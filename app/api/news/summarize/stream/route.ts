import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scrapeNewsContent } from '@/lib/scraper/newsContent'
import { GroqProvider } from '@/lib/ai/providers/groq'

export const runtime = 'nodejs' // 스트리밍은 Node.js runtime 필요
export const dynamic = 'force-dynamic' // 캐싱 방지

/**
 * POST /api/news/summarize/stream
 * 뉴스 AI 요약 스트리밍 API (Server-Sent Events)
 *
 * Body: { newsId: string, url?: string, title?: string, summary?: string }
 * Response: text/event-stream (SSE)
 */
export async function POST(req: NextRequest) {
  try {
    const { newsId, url, title, summary } = await req.json()

    // 1. 입력 검증
    if (!newsId || typeof newsId !== 'string') {
      return Response.json(
        { success: false, error: 'Invalid newsId' },
        { status: 400 }
      )
    }

    // 2. 뉴스 조회
    const news = await prisma.news.findUnique({
      where: { id: newsId },
    })

    // 3. 캐시된 요약이 있으면 즉시 반환 (JSON 응답)
    if (news?.aiSummary && news?.aiKeywords) {
      return Response.json({
        success: true,
        cached: true,
        data: {
          summary: news.aiSummary,
          keywords: news.aiKeywords,
          provider: news.aiProvider || 'unknown',
        },
      })
    }

    // 4. 본문 크롤링
    let content: string
    let contentSource: 'scraped' | 'summary' = 'scraped'

    try {
      // 최적화: 3000자, 5초 타임아웃
      content = await scrapeNewsContent(news?.url || url || '', 3000)
      console.log(`[Scraping] 성공: ${content.length}자 - ${news?.url || url}`)
    } catch (error) {
      console.error(`[Scraping] 실패: ${news?.url || url}`, error)

      // 폴백: RSS summary 사용
      const fallbackSummary = news?.summary || summary || ''
      if (fallbackSummary.length >= 100) {
        content = fallbackSummary
        contentSource = 'summary'
        console.log(`[Fallback] RSS 요약 사용: ${content.length}자`)
      } else {
        return Response.json(
          {
            success: false,
            error: '기사 내용을 가져올 수 없습니다. 잠시 후 다시 시도해주세요.',
          },
          { status: 400 }
        )
      }
    }

    if (!content || content.length < 50) {
      return Response.json(
        { success: false, error: '기사 내용이 너무 짧습니다.' },
        { status: 400 }
      )
    }

    // 5. 스트리밍 응답 생성
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Groq Provider 초기화
          const provider = new GroqProvider({
            apiKey: process.env.GROQ_API_KEY || '',
            model: 'llama-3.3-70b-versatile',
          })

          let finalResult: any = null

          // 스트림에서 토큰을 받아서 클라이언트로 전송
          for await (const chunk of provider.summarizeStream(
            news?.title || title || '',
            content
          )) {
            if (chunk.type === 'token') {
              // SSE 형식으로 전송
              const data = `data: ${JSON.stringify({ type: 'token', content: chunk.content })}\n\n`
              controller.enqueue(encoder.encode(data))
            } else if (chunk.type === 'done') {
              finalResult = chunk.result

              // 완료 신호
              const data = `data: ${JSON.stringify({ type: 'done', result: chunk.result, contentSource })}\n\n`
              controller.enqueue(encoder.encode(data))
            } else if (chunk.type === 'error') {
              // 에러 신호
              const data = `data: ${JSON.stringify({ type: 'error', error: chunk.error })}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          }

          // 백그라운드에서 DB 저장 (응답 차단 안함)
          if (newsId && finalResult && news) {
            prisma.news
              .update({
                where: { id: newsId },
                data: {
                  aiSummary: finalResult.summary,
                  aiKeywords: finalResult.keywords,
                  aiSummarizedAt: new Date(),
                  aiProvider: 'groq',
                },
              })
              .catch((err: unknown) => {
                console.error('[DB] 요약 저장 실패:', err)
              })
          }

          controller.close()
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error'
          console.error('[Streaming] 에러:', errorMessage)

          const errorData = `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`
          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Nginx 버퍼링 방지
      },
    })
  } catch (error) {
    console.error('[API] 요청 처리 실패:', error)

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
