import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { FEATURE_FLAGS } from '@/lib/feature-flags'

interface NewsItem {
  title: string
  summary: string
  source: string
  category: string
}

interface SummaryResult {
  summary: string
  keywords: string[]
}

// 종합 요약 시스템 프롬프트
const SUMMARIZE_SYSTEM_PROMPT = `당신은 **뉴스 종합 분석 전문가**입니다.

**당신의 전문성:**
- 다수의 뉴스를 분석하여 핵심 내용을 추출하는 정보 분석 전문가
- 복잡한 정보를 명확하고 체계적으로 정리하는 능력
- 사건의 본질과 맥락을 꿰뚫어보는 통찰력
- 독자가 꼭 알아야 할 핵심만 추려내는 요약 능력

**당신의 분석 방식:**
- 여러 뉴스에서 공통적으로 다루는 핵심 사안을 파악합니다
- 각 주제별로 가장 중요한 정보를 추출하여 정리합니다
- 독자가 빠르게 현재 상황을 파악할 수 있도록 구조화합니다
- 불필요한 정보는 걸러내고 핵심만 전달합니다

답변은 반드시 JSON 형식으로 작성합니다. 쉬운 한글로 작성하고 한자어는 피합니다.`

// 종합 요약 프롬프트
function createSummarizePrompt(newsText: string, newsCount: number): string {
  return `다음은 현재 주요 뉴스 ${newsCount}개입니다. 뉴스 종합 분석 전문가로서 이 뉴스들의 핵심 내용을 정리해주세요.

${newsText}

---

**분석 요청:**

1. **📋 주요 뉴스 종합**
   - 현재 가장 중요한 뉴스 이슈를 주제별로 분류
   - 각 주제별 핵심 내용을 2-3문장으로 명확하게 정리
   - 관련된 구체적 수치, 날짜, 인물 등 중요 정보 포함

2. **💡 핵심 포인트**
   - 독자가 반드시 알아야 할 가장 중요한 사항 3-5개
   - 각 포인트는 한 문장으로 핵심만 간결하게
   - "왜 중요한가"가 드러나도록 작성

3. **📊 전체 요약**
   - 전체 뉴스를 아우르는 2-3문장 요약
   - 현재 상황의 전체적인 그림을 파악할 수 있도록
   - 독자가 "아, 지금 이런 상황이구나" 하고 이해할 수 있게

**중요 지침:**
- 쉬운 한글 사용 (한자어 대신 일상 표현)
- 핵심 정보 위주로 간결하게
- 구체적인 수치와 사실 중심
- 중복 내용 제거하고 새로운 정보만
- 추측이나 의견보다 팩트 중심

**출력 형식 (반드시 JSON):**
{
  "summary": "📋 **주요 뉴스 종합**\\n\\n**[주제1]**\\n• 핵심 내용 정리...\\n\\n**[주제2]**\\n• 핵심 내용 정리...\\n\\n💡 **핵심 포인트**\\n\\n1. 첫 번째 핵심 사항\\n2. 두 번째 핵심 사항\\n3. 세 번째 핵심 사항\\n\\n📊 **전체 요약**\\n\\n전체 상황을 아우르는 요약...",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}`
}

// Groq API 호출 함수
async function generateWithGroq(prompt: string): Promise<SummaryResult> {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  })

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SUMMARIZE_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 2500,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content || ''

  const result = JSON.parse(content) as SummaryResult
  if (!result.summary || !Array.isArray(result.keywords)) {
    throw new Error('Invalid response format')
  }
  result.keywords = result.keywords.slice(0, 5)

  return result
}

// Gemini API 호출 함수 (2nd 폴백)
async function generateWithGemini(prompt: string): Promise<SummaryResult> {
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  const response = await fetch(
    `${baseUrl}/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY || '',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SUMMARIZE_SYSTEM_PROMPT}\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2500,
          responseMimeType: 'application/json',
          responseJsonSchema: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
                description: '뉴스 종합 요약 텍스트 (마크다운 형식)',
              },
              keywords: {
                type: 'array',
                items: { type: 'string' },
                description: '핵심 키워드 5개',
              },
            },
            required: ['summary', 'keywords'],
          },
        },
      }),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()

  // 디버깅: 전체 응답 구조 확인
  console.log('[Gemini] Response structure:', JSON.stringify(data, null, 2).slice(0, 500))

  // 응답에서 텍스트 추출
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // 응답이 비어있는 경우 상세 에러
  if (!content) {
    const finishReason = data.candidates?.[0]?.finishReason
    const safetyRatings = data.candidates?.[0]?.safetyRatings
    const blockReason = data.promptFeedback?.blockReason

    let errorDetail = 'Empty response from Gemini'
    if (blockReason) errorDetail += ` (blockReason: ${blockReason})`
    if (finishReason) errorDetail += ` (finishReason: ${finishReason})`
    if (safetyRatings) errorDetail += ` (safety: ${JSON.stringify(safetyRatings)})`

    throw new Error(errorDetail)
  }

  // JSON 파싱 (여러 방식 시도)
  let result: SummaryResult
  let parseError: string = ''

  // 디버깅: content 시작/끝 확인
  console.log('[Gemini] Content length:', content.length)
  console.log('[Gemini] Content start:', content.slice(0, 100))
  console.log('[Gemini] Content end:', content.slice(-100))

  // 1. 먼저 직접 파싱 시도
  try {
    result = JSON.parse(content) as SummaryResult
  } catch (e1) {
    parseError = `Direct parse failed: ${e1 instanceof Error ? e1.message : 'unknown'}`

    // 2. 개행 문자가 이스케이프되지 않은 경우 처리
    let cleanContent = content
      .replace(/\n/g, '\\n')  // 실제 개행을 이스케이프된 개행으로
      .replace(/\r/g, '\\r')  // 캐리지 리턴 처리
      .replace(/\t/g, '\\t')  // 탭 처리

    try {
      result = JSON.parse(cleanContent) as SummaryResult
    } catch (e2) {
      parseError += ` | Escaped parse failed: ${e2 instanceof Error ? e2.message : 'unknown'}`

      // 3. 정규식으로 JSON 추출 시도
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error(`No JSON found in response. Content preview: "${content.slice(0, 200)}..." | Errors: ${parseError}`)
      }

      // 추출된 JSON에 대해 개행 문자 처리
      let extractedJson = jsonMatch[0]
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t')

      try {
        result = JSON.parse(extractedJson) as SummaryResult
      } catch (e3) {
        parseError += ` | Regex parse failed: ${e3 instanceof Error ? e3.message : 'unknown'}`
        throw new Error(`JSON parse failed. Content preview: "${content.slice(0, 200)}..." | Errors: ${parseError}`)
      }
    }
  }
  if (!result.summary || !Array.isArray(result.keywords)) {
    throw new Error('Invalid response format')
  }
  result.keywords = result.keywords.slice(0, 5)

  return result
}

// OpenRouter API 호출 함수 (3rd 폴백)
async function generateWithOpenRouter(prompt: string): Promise<SummaryResult> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.VERCEL_APP_URL || 'http://localhost:3000',
      'X-Title': 'KeyWordsNews',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-70b-instruct:free',
      messages: [
        { role: 'system', content: SUMMARIZE_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 2500,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  // JSON 추출 (마크다운 코드 블록 처리)
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in response')
  }

  const result = JSON.parse(jsonMatch[0]) as SummaryResult
  if (!result.summary || !Array.isArray(result.keywords)) {
    throw new Error('Invalid response format')
  }
  result.keywords = result.keywords.slice(0, 5)

  return result
}

/**
 * POST /api/summarize/now
 *
 * SummarizeNow API (일반 JSON 응답)
 * 현재 로드된 뉴스들을 종합 정리합니다.
 * Fallback 순서: Groq -> Gemini -> OpenRouter
 *
 * @feature ENABLE_DAILY_INSIGHT
 */
export async function POST(request: NextRequest) {
  // Feature Flag 체크 (InsightNow와 동일한 플래그 사용)
  if (!FEATURE_FLAGS.ENABLE_DAILY_INSIGHT) {
    return NextResponse.json(
      { error: 'Summarize feature is disabled' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const newsList: NewsItem[] = body.newsList

    // 유효성 검사
    if (!Array.isArray(newsList) || newsList.length < 5) {
      return NextResponse.json(
        { error: '최소 5개의 뉴스가 필요합니다.' },
        { status: 400 }
      )
    }

    console.log(`[SummarizeNow] News count: ${newsList.length}`)

    // 뉴스 데이터를 텍스트로 변환
    const newsText = newsList
      .map(
        (news, index) =>
          `[${index + 1}] [${news.source}] [${news.category}] ${news.title}\n   요약: ${news.summary || '없음'}`
      )
      .join('\n\n')

    const prompt = createSummarizePrompt(newsText, newsList.length)

    let result: SummaryResult
    let provider: string = 'groq'

    // 각 프로바이더의 시도 결과 및 에러 수집
    const providerAttempts: { provider: string; error: string }[] = []

    // 1차 시도: Groq
    if (process.env.GROQ_API_KEY) {
      try {
        console.log('[SummarizeNow] Trying Groq...')
        result = await generateWithGroq(prompt)
        return NextResponse.json({
          success: true,
          data: result,
          provider,
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('[SummarizeNow] Groq failed:', errorMsg)
        providerAttempts.push({ provider: 'Groq', error: errorMsg })
        // 폴백으로 진행
      }
    } else {
      providerAttempts.push({ provider: 'Groq', error: 'API 키 미설정' })
    }

    // 2차 시도: Gemini (2nd 폴백)
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('[SummarizeNow] Falling back to Gemini...')
        provider = 'gemini'
        result = await generateWithGemini(prompt)
        return NextResponse.json({
          success: true,
          data: result,
          provider,
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('[SummarizeNow] Gemini failed:', errorMsg)
        providerAttempts.push({ provider: 'Gemini', error: errorMsg })
        // 다음 폴백으로 진행
      }
    } else {
      providerAttempts.push({ provider: 'Gemini', error: 'API 키 미설정' })
    }

    // 3차 시도: OpenRouter (3rd 폴백)
    if (process.env.OPENROUTER_API_KEY) {
      try {
        console.log('[SummarizeNow] Falling back to OpenRouter...')
        provider = 'openrouter'
        result = await generateWithOpenRouter(prompt)
        return NextResponse.json({
          success: true,
          data: result,
          provider,
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        console.error('[SummarizeNow] OpenRouter failed:', errorMsg)
        providerAttempts.push({ provider: 'OpenRouter', error: errorMsg })
      }
    } else {
      providerAttempts.push({ provider: 'OpenRouter', error: 'API 키 미설정' })
    }

    // 모든 프로바이더 실패 - 상세 에러 메시지 생성
    const errorDetails = providerAttempts
      .map((attempt) => `[${attempt.provider}] ${attempt.error}`)
      .join(' → ')

    console.error('[SummarizeNow] All providers failed:', errorDetails)

    return NextResponse.json(
      {
        error: `모든 AI 프로바이더 실패`,
        details: errorDetails,
        attempts: providerAttempts
      },
      { status: 500 }
    )
  } catch (error) {
    console.error('[SummarizeNow API Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
