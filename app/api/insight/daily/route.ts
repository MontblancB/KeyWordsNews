import { NextRequest } from 'next/server'
import Groq from 'groq-sdk'
import { FEATURE_FLAGS } from '@/lib/feature-flags'

interface NewsItem {
  title: string
  summary: string
  source: string
  category: string
}

interface InsightResult {
  insights: string
  keywords: string[]
}

// 시스템 프롬프트
const SYSTEM_PROMPT =
  '당신은 뉴스를 종합 분석하여 인사이트를 도출하는 전문 AI입니다. 여러 뉴스에서 패턴과 트렌드를 발견하고, 이슈를 카테고리별로 분류하며, 통찰력 있는 분석을 제공합니다. 답변은 반드시 JSON 형식으로 작성합니다. 반드시 쉬운 한글로 작성하고 한자어는 피합니다.'

// 프롬프트 생성 함수
function createPrompt(newsText: string, newsCount: number): string {
  return `다음은 오늘의 주요 뉴스 ${newsCount}개입니다. 이를 종합 분석하여 인사이트를 도출해주세요.

${newsText}

---

**분석 요청:**
1. **주요 이슈 분류** (3-5개 카테고리로 묶기)
   - 각 카테고리별 핵심 내용 2-3줄
2. **종합 인사이트**
   - 오늘 뉴스에서 발견되는 트렌드
   - 특히 주목할 점
   - 향후 전망이나 시사점
3. **핵심 키워드** 5개

**중요: 쉬운 한글 사용**
- 한자어 대신 쉬운 순우리말이나 일상 표현 사용
- 예: 추진→밀고 나감, 검토→살펴봄, 시행→실시, 전망→내다봄, 우려→걱정

**출력 형식 (반드시 JSON):**
{
  "insights": "📊 **주요 이슈 분류**\\n\\n**1. [카테고리명]**\\n• 내용1\\n• 내용2\\n\\n**2. [카테고리명]**\\n• 내용1\\n• 내용2\\n\\n💡 **종합 인사이트**\\n\\n• 트렌드...\\n• 주목할 점...\\n• 전망...",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"]
}`
}

// Groq 스트리밍 함수
async function* streamWithGroq(
  prompt: string
): AsyncGenerator<{ type: string; content?: string; result?: InsightResult; error?: string }> {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  })

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.4,
    max_tokens: 2500,
    response_format: { type: 'json_object' },
    stream: true,
  })

  let fullContent = ''

  for await (const chunk of response) {
    const delta = chunk.choices[0]?.delta?.content

    if (delta) {
      fullContent += delta
      yield { type: 'token', content: delta }
    }
  }

  // 최종 결과 파싱
  try {
    const result = JSON.parse(fullContent) as InsightResult
    if (!result.insights || !Array.isArray(result.keywords)) {
      throw new Error('Invalid response format')
    }
    result.keywords = result.keywords.slice(0, 5)
    yield { type: 'done', result }
  } catch {
    yield {
      type: 'done',
      result: { insights: fullContent, keywords: [] },
    }
  }
}

// OpenRouter 스트리밍 함수 (폴백)
async function* streamWithOpenRouter(
  prompt: string
): AsyncGenerator<{ type: string; content?: string; result?: InsightResult; error?: string }> {
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
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_tokens: 2500,
      stream: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body from OpenRouter')
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let fullContent = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const delta = parsed.choices?.[0]?.delta?.content

          if (delta) {
            fullContent += delta
            yield { type: 'token', content: delta }
          }
        } catch {
          // JSON 파싱 실패 무시
        }
      }
    }
  }

  // 최종 결과 파싱
  try {
    // JSON 추출 (마크다운 코드 블록 처리)
    const jsonMatch = fullContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found')
    }

    const result = JSON.parse(jsonMatch[0]) as InsightResult
    if (!result.insights || !Array.isArray(result.keywords)) {
      throw new Error('Invalid response format')
    }
    result.keywords = result.keywords.slice(0, 5)
    yield { type: 'done', result }
  } catch {
    yield {
      type: 'done',
      result: { insights: fullContent, keywords: [] },
    }
  }
}

/**
 * POST /api/insight/daily
 *
 * InsightNow API (SSE 스트리밍)
 * 현재 로드된 뉴스들을 종합 분석하여 인사이트를 생성합니다.
 * Groq 실패 시 OpenRouter로 자동 폴백됩니다.
 *
 * @feature ENABLE_DAILY_INSIGHT
 */
export async function POST(request: NextRequest) {
  // Feature Flag 체크
  if (!FEATURE_FLAGS.ENABLE_DAILY_INSIGHT) {
    return new Response(
      JSON.stringify({ error: 'Daily Insight feature is disabled' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await request.json()
    const newsList: NewsItem[] = body.newsList

    // 유효성 검사
    if (!Array.isArray(newsList) || newsList.length < 5) {
      return new Response(
        JSON.stringify({ error: '최소 5개의 뉴스가 필요합니다.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 뉴스 데이터를 텍스트로 변환
    const newsText = newsList
      .map(
        (news, index) =>
          `[${index + 1}] [${news.source}] ${news.title}\n   요약: ${news.summary || '없음'}`
      )
      .join('\n\n')

    const prompt = createPrompt(newsText, newsList.length)

    // SSE 스트리밍 응답
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        let useOpenRouter = false

        // 1차 시도: Groq
        if (process.env.GROQ_API_KEY) {
          try {
            console.log('[InsightNow] Trying Groq...')
            for await (const chunk of streamWithGroq(prompt)) {
              if (chunk.type === 'token') {
                const data = JSON.stringify({ type: 'token', content: chunk.content })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              } else if (chunk.type === 'done') {
                const doneData = JSON.stringify({ type: 'done', result: chunk.result })
                controller.enqueue(encoder.encode(`data: ${doneData}\n\n`))
              }
            }
            controller.close()
            return
          } catch (error) {
            console.error('[InsightNow] Groq failed:', error)
            useOpenRouter = true
          }
        } else {
          useOpenRouter = true
        }

        // 2차 시도: OpenRouter (폴백)
        if (useOpenRouter && process.env.OPENROUTER_API_KEY) {
          try {
            console.log('[InsightNow] Falling back to OpenRouter...')
            for await (const chunk of streamWithOpenRouter(prompt)) {
              if (chunk.type === 'token') {
                const data = JSON.stringify({ type: 'token', content: chunk.content })
                controller.enqueue(encoder.encode(`data: ${data}\n\n`))
              } else if (chunk.type === 'done') {
                const doneData = JSON.stringify({ type: 'done', result: chunk.result })
                controller.enqueue(encoder.encode(`data: ${doneData}\n\n`))
              }
            }
            controller.close()
            return
          } catch (error) {
            console.error('[InsightNow] OpenRouter failed:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            const errorData = JSON.stringify({ type: 'error', error: `모든 AI 프로바이더 실패: ${errorMessage}` })
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
            controller.close()
            return
          }
        }

        // 모든 프로바이더 사용 불가
        const errorData = JSON.stringify({
          type: 'error',
          error: 'AI API 키가 설정되지 않았습니다. GROQ_API_KEY 또는 OPENROUTER_API_KEY를 설정해주세요.',
        })
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('[Daily Insight API Error]', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
