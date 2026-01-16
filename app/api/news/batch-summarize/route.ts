import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { scrapeNewsContent } from '@/lib/scraper/newsContent'
import { NewsSummarizer } from '@/lib/ai/summarizer'

/**
 * POST /api/news/batch-summarize
 * 속보 뉴스 배치 요약 API (GitHub Actions Cron용)
 *
 * Headers: { x-cron-secret: string }
 * Response: { success: true, summarized: number, failed: number }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. CRON SECRET 검증
    const secret = req.headers.get('x-cron-secret')
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const startTime = Date.now()

    // 2. 최근 1시간 내 속보 중 미요약 뉴스 조회
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const breakingNews = await prisma.news.findMany({
      where: {
        isBreaking: true,
        aiSummary: null,
        publishedAt: {
          gte: oneHourAgo,
        },
      },
      take: 30, // 한 번에 최대 30개 (Groq 무료 티어 고려)
      orderBy: {
        publishedAt: 'desc',
      },
    })

    console.log(`Found ${breakingNews.length} breaking news to summarize`)

    if (breakingNews.length === 0) {
      return NextResponse.json({
        success: true,
        summarized: 0,
        failed: 0,
        duration: Date.now() - startTime,
      })
    }

    let summarized = 0
    let failed = 0
    const failedUrls: string[] = []

    // 3. 뉴스 요약 (순차 처리 - Rate Limit 준수)
    for (const news of breakingNews) {
      try {
        // 3-1. 본문 크롤링
        let content: string
        try {
          content = await scrapeNewsContent(news.url, 2000)
        } catch (error) {
          console.error(`Scraping failed for ${news.url}:`, error)
          // 크롤링 실패 시 RSS summary 사용
          content = news.summary
        }

        if (!content || content.length < 50) {
          console.warn(`Content too short for ${news.url}`)
          failed++
          failedUrls.push(news.url)
          continue
        }

        // 3-2. AI 요약 생성
        const result = await NewsSummarizer.summarize(news.title, content)

        // 3-3. DB 저장
        await prisma.news.update({
          where: { id: news.id },
          data: {
            aiSummary: result.summary,
            aiKeywords: result.keywords,
            aiSummarizedAt: new Date(),
            aiProvider: result.provider,
          },
        })

        summarized++
        console.log(
          `✓ Summarized: ${news.title.slice(0, 50)}... (provider: ${result.provider})`
        )

        // 3-4. Rate Limit 준수 (Groq: 30 RPM = 2초당 1개)
        // 2초 대기 (마지막 항목은 대기하지 않음)
        if (breakingNews.indexOf(news) < breakingNews.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      } catch (error) {
        failed++
        failedUrls.push(news.url)
        console.error(`Failed to summarize ${news.url}:`, error)
        // 에러 발생해도 계속 진행
      }
    }

    const duration = Date.now() - startTime

    // 4. 결과 반환
    const response = {
      success: true,
      summarized,
      failed,
      duration,
      total: breakingNews.length,
      failedUrls: failed > 0 ? failedUrls : undefined,
    }

    console.log('Batch summarization completed:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Batch summarization error:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Batch summarization failed',
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/news/batch-summarize
 * 배치 요약 상태 확인 (테스트용)
 */
export async function GET(req: NextRequest) {
  try {
    // CRON SECRET 검증
    const secret = req.headers.get('x-cron-secret')
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 최근 1시간 내 속보 통계
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const [total, summarized, pending] = await Promise.all([
      prisma.news.count({
        where: {
          isBreaking: true,
          publishedAt: { gte: oneHourAgo },
        },
      }),
      prisma.news.count({
        where: {
          isBreaking: true,
          publishedAt: { gte: oneHourAgo },
          aiSummary: { not: null },
        },
      }),
      prisma.news.count({
        where: {
          isBreaking: true,
          publishedAt: { gte: oneHourAgo },
          aiSummary: null,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        total,
        summarized,
        pending,
        summarizationRate: total > 0 ? (summarized / total) * 100 : 0,
      },
    })
  } catch (error) {
    console.error('Status check error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Status check failed',
      },
      { status: 500 }
    )
  }
}
