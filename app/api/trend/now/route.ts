import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { FEATURE_FLAGS } from '@/lib/feature-flags'

interface NewsItem {
  title: string
  summary: string
  source: string
  category: string
}

interface TrendResult {
  trends: string
  keywords: string[]
}

// 트렌드 분석 시스템 프롬프트
const TREND_SYSTEM_PROMPT = `당신은 **트렌드 분석 전문가**입니다.

**당신의 전문성:**
- 뉴스 데이터에서 패턴과 트렌드를 식별하는 데이터 분석 전문가
- 키워드 빈도와 연관성을 파악하여 현재 흐름을 분석
- 복잡한 정보를 시각적으로 이해하기 쉽게 정리하는 능력
- 객관적 데이터 기반의 트렌드 예측

**당신의 분석 방식:**
- 뉴스 제목과 요약에서 반복되는 키워드와 주제를 식별합니다
- 주제별로 뉴스를 그룹화하여 현재 가장 뜨거운 이슈를 파악합니다
- 각 트렌드의 강도와 방향성을 분석합니다
- 독자가 "지금 무엇이 화제인지"를 한눈에 파악할 수 있도록 정리합니다

답변은 반드시 JSON 형식으로 작성합니다. 쉬운 한글로 작성하고 한자어는 피합니다.`

// 트렌드 분석 프롬프트
function createTrendPrompt(newsText: string, newsCount: number): string {
  return `다음은 현재 주요 뉴스 ${newsCount}개입니다. 트렌드 분석 전문가로서 현재 뉴스 흐름과 트렌드를 분석해주세요.

${newsText}

---

**분석 요청:**

1. **📈 현재 화제 TOP 5**
   - 현재 가장 많이 언급되는 주제/이슈를 순위로 정리
   - 각 주제별 관련 뉴스 수와 핵심 내용 요약
   - 왜 이 주제가 화제인지 간단히 설명

2. **🔥 트렌드 분석**
   - **상승 트렌드**: 최근 급부상하는 이슈/키워드
   - **지속 트렌드**: 꾸준히 언급되는 이슈
   - **주목할 신호**: 앞으로 화제가 될 가능성이 있는 이슈

3. **📊 키워드 맵**
   - 가장 많이 등장하는 키워드 5개
   - 각 키워드가 어떤 맥락에서 사용되는지

4. **💡 트렌드 요약**
   - 한 줄로 정리하는 오늘의 뉴스 흐름
   - 독자가 알아야 할 핵심 트렌드

**중요 지침:**
- 쉬운 한글 사용 (한자어 대신 일상 표현)
- 데이터 기반의 객관적 분석
- 시각적으로 이해하기 쉬운 구조
- 독자가 "아, 지금 이게 화제구나!" 하고 바로 이해할 수 있도록

**출력 형식 (반드시 JSON):**
{
  "trends": "📈 **현재 화제 TOP 5**\\n\\n**1위. [주제명]** (뉴스 N건)\\n• 핵심 내용...\\n\\n**2위. [주제명]** (뉴스 N건)\\n• 핵심 내용...\\n\\n🔥 **트렌드 분석**\\n\\n**상승 트렌드**\\n• ...\\n\\n**지속 트렌드**\\n• ...\\n\\n**주목할 신호**\\n• ...\\n\\n📊 **키워드 맵**\\n• 키워드1: 맥락 설명\\n• 키워드2: 맥락 설명\\n\\n💡 **트렌드 요약**\\n• 한 줄 정리...",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}`
}

// Groq API 호출 함수
async function generateWithGroq(prompt: string): Promise<TrendResult> {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  })

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: TREND_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 2500,
    response_format: { type: 'json_object' },
  })

  const content = response.choices[0]?.message?.content || ''

  const result = JSON.parse(content) as TrendResult
  if (!result.trends || !Array.isArray(result.keywords)) {
    throw new Error('Invalid response format')
  }
  result.keywords = result.keywords.slice(0, 5)

  return result
}

// Gemini API 호출 함수 (2nd 폴백)
async function generateWithGemini(prompt: string): Promise<TrendResult> {
  const baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'

  const response = await fetch(
    `${baseUrl}/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${TREND_SYSTEM_PROMPT}\n\n${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2500,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  // JSON 추출
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in response')
  }

  const result = JSON.parse(jsonMatch[0]) as TrendResult
  if (!result.trends || !Array.isArray(result.keywords)) {
    throw new Error('Invalid response format')
  }
  result.keywords = result.keywords.slice(0, 5)

  return result
}

// OpenRouter API 호출 함수 (3rd 폴백)
async function generateWithOpenRouter(prompt: string): Promise<TrendResult> {
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
        { role: 'system', content: TREND_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
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

  const result = JSON.parse(jsonMatch[0]) as TrendResult
  if (!result.trends || !Array.isArray(result.keywords)) {
    throw new Error('Invalid response format')
  }
  result.keywords = result.keywords.slice(0, 5)

  return result
}

/**
 * POST /api/trend/now
 *
 * TrendNow API (일반 JSON 응답)
 * 현재 로드된 뉴스들의 트렌드를 분석합니다.
 * Fallback 순서: Groq -> Gemini -> OpenRouter
 *
 * @feature ENABLE_DAILY_INSIGHT
 */
export async function POST(request: NextRequest) {
  // Feature Flag 체크 (InsightNow와 동일한 플래그 사용)
  if (!FEATURE_FLAGS.ENABLE_DAILY_INSIGHT) {
    return NextResponse.json(
      { error: 'Trend analysis feature is disabled' },
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

    console.log(`[TrendNow] News count: ${newsList.length}`)

    // 뉴스 데이터를 텍스트로 변환
    const newsText = newsList
      .map(
        (news, index) =>
          `[${index + 1}] [${news.source}] [${news.category}] ${news.title}\n   요약: ${news.summary || '없음'}`
      )
      .join('\n\n')

    const prompt = createTrendPrompt(newsText, newsList.length)

    let result: TrendResult
    let provider: string = 'groq'

    // 1차 시도: Groq
    if (process.env.GROQ_API_KEY) {
      try {
        console.log('[TrendNow] Trying Groq...')
        result = await generateWithGroq(prompt)
        return NextResponse.json({
          success: true,
          data: result,
          provider,
        })
      } catch (error) {
        console.error('[TrendNow] Groq failed:', error)
        // 폴백으로 진행
      }
    }

    // 2차 시도: Gemini (2nd 폴백)
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('[TrendNow] Falling back to Gemini...')
        provider = 'gemini'
        result = await generateWithGemini(prompt)
        return NextResponse.json({
          success: true,
          data: result,
          provider,
        })
      } catch (error) {
        console.error('[TrendNow] Gemini failed:', error)
        // 다음 폴백으로 진행
      }
    }

    // 3차 시도: OpenRouter (3rd 폴백)
    if (process.env.OPENROUTER_API_KEY) {
      try {
        console.log('[TrendNow] Falling back to OpenRouter...')
        provider = 'openrouter'
        result = await generateWithOpenRouter(prompt)
        return NextResponse.json({
          success: true,
          data: result,
          provider,
        })
      } catch (error) {
        console.error('[TrendNow] OpenRouter failed:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return NextResponse.json(
          { error: `모든 AI 프로바이더 실패: ${errorMessage}` },
          { status: 500 }
        )
      }
    }

    // 모든 프로바이더 사용 불가
    return NextResponse.json(
      { error: 'AI API 키가 설정되지 않았습니다. GROQ_API_KEY, GEMINI_API_KEY 또는 OPENROUTER_API_KEY를 설정해주세요.' },
      { status: 500 }
    )
  } catch (error) {
    console.error('[TrendNow API Error]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
