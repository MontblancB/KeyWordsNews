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

/**
 * POST /api/insight/daily
 *
 * 오늘의 Insight API (SSE 스트리밍)
 * 현재 로드된 뉴스들을 종합 분석하여 인사이트를 생성합니다.
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

    // 최대 30개로 제한
    const limitedNews = newsList.slice(0, 30)

    // Groq 클라이언트 초기화
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    // 뉴스 데이터를 텍스트로 변환
    const newsText = limitedNews
      .map(
        (news, index) =>
          `[${index + 1}] [${news.source}] ${news.title}\n   요약: ${news.summary || '없음'}`
      )
      .join('\n\n')

    // AI 프롬프트
    const prompt = `다음은 오늘의 주요 뉴스 ${limitedNews.length}개입니다. 이를 종합 분석하여 인사이트를 도출해주세요.

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

    // SSE 스트리밍 응답
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await groq.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
              {
                role: 'system',
                content:
                  '당신은 뉴스를 종합 분석하여 인사이트를 도출하는 전문 AI입니다. 여러 뉴스에서 패턴과 트렌드를 발견하고, 이슈를 카테고리별로 분류하며, 통찰력 있는 분석을 제공합니다. 답변은 반드시 JSON 형식으로 작성합니다. 반드시 쉬운 한글로 작성하고 한자어는 피합니다.',
              },
              {
                role: 'user',
                content: prompt,
              },
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

              // 토큰 전송
              const data = JSON.stringify({ type: 'token', content: delta })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }
          }

          // 최종 결과 파싱
          try {
            const result = JSON.parse(fullContent) as InsightResult

            // 검증
            if (!result.insights || !Array.isArray(result.keywords)) {
              throw new Error('Invalid response format')
            }

            // 키워드 5개로 제한
            result.keywords = result.keywords.slice(0, 5)

            // 완료 신호
            const doneData = JSON.stringify({ type: 'done', result })
            controller.enqueue(encoder.encode(`data: ${doneData}\n\n`))
          } catch {
            // JSON 파싱 실패 시 원본 텍스트 반환
            const fallbackResult: InsightResult = {
              insights: fullContent,
              keywords: [],
            }
            const doneData = JSON.stringify({
              type: 'done',
              result: fallbackResult,
            })
            controller.enqueue(encoder.encode(`data: ${doneData}\n\n`))
          }

          controller.close()
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          const errorData = JSON.stringify({ type: 'error', error: errorMessage })
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`))
          controller.close()
        }
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
