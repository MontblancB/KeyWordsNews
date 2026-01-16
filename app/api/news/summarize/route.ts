import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scrapeNewsContent } from '@/lib/scraper/newsContent'
import { NewsSummarizer } from '@/lib/ai/summarizer'

/**
 * POST /api/news/summarize
 * 뉴스 AI 요약 API (온디맨드)
 *
 * Body: { newsId: string }
 * Response: { success: true, data: { summary, keywords, provider } }
 */
export async function POST(req: NextRequest) {
  try {
    const { newsId } = await req.json()

    // 1. 입력 검증
    if (!newsId || typeof newsId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid newsId' },
        { status: 400 }
      )
    }

    // 2. 뉴스 조회
    const news = await prisma.news.findUnique({
      where: { id: newsId },
    })

    if (!news) {
      return NextResponse.json(
        { success: false, error: 'News not found' },
        { status: 404 }
      )
    }

    // 3. 이미 요약이 있으면 캐시된 결과 반환
    if (news.aiSummary && news.aiKeywords) {
      return NextResponse.json({
        success: true,
        data: {
          summary: news.aiSummary,
          keywords: news.aiKeywords,
          provider: news.aiProvider || 'unknown',
          cached: true,
        },
      })
    }

    // 4. 본문 크롤링
    let content: string
    try {
      content = await scrapeNewsContent(news.url, 2000)
    } catch (error) {
      console.error('Scraping failed:', error)
      // 크롤링 실패 시 RSS summary 사용
      content = news.summary
    }

    if (!content || content.length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch article content',
        },
        { status: 400 }
      )
    }

    // 5. AI 요약 생성 (자동 Fallback 포함)
    const result = await NewsSummarizer.summarize(news.title, content)

    // 6. DB에 저장
    await prisma.news.update({
      where: { id: newsId },
      data: {
        aiSummary: result.summary,
        aiKeywords: result.keywords,
        aiSummarizedAt: new Date(),
        aiProvider: result.provider,
      },
    })

    // 7. 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        summary: result.summary,
        keywords: result.keywords,
        provider: result.provider,
        cached: false,
      },
    })
  } catch (error) {
    console.error('Summarization error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Summarization failed',
      },
      { status: 500 }
    )
  }
}
