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
    const { newsId, url, title, summary } = await req.json()

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
      // ⭐️ DB에 없으면 URL 기반 폴백 (RSS 뉴스 대응)
      if (url && title) {
        console.log(`[Fallback] DB에 없는 뉴스, URL로 요약 생성: ${url}`)

        let content: string
        let contentSource: 'scraped' | 'summary' = 'scraped'

        try {
          content = await scrapeNewsContent(url, 3000)
          console.log(`[Scraping] 성공: ${content.length}자 확보 - ${url}`)
        } catch (error) {
          console.error(`[Scraping] 실패: ${url}`, error)

          // 크롤링 실패 시 RSS summary 사용 (최소 100자 이상일 때만)
          if (summary && summary.length >= 100) {
            content = summary
            contentSource = 'summary'
            console.log(`[Fallback] RSS 요약 사용: ${content.length}자`)
          } else {
            return NextResponse.json(
              {
                success: false,
                error: '기사 내용을 가져올 수 없습니다. 잠시 후 다시 시도해주세요.',
              },
              { status: 400 }
            )
          }
        }

        if (!content || content.length < 50) {
          return NextResponse.json(
            { success: false, error: '기사 내용이 너무 짧습니다.' },
            { status: 400 }
          )
        }

        const result = await NewsSummarizer.summarize(title, content)

        return NextResponse.json({
          success: true,
          data: {
            summary: result.summary,
            keywords: result.keywords,
            oneLiner: result.oneLiner,
            provider: result.provider,
            cached: false,
            fallback: true,  // 폴백 모드임을 표시
            contentSource,   // 스크래핑 or RSS 요약
          },
        })
      }

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
          oneLiner: news.aiOneLiner,
          provider: news.aiProvider || 'unknown',
          cached: true,
        },
      })
    }

    // 4. 본문 크롤링 (3000자로 최적화 - AI 요약에 충분)
    let content: string
    let contentSource: 'scraped' | 'summary' = 'scraped'

    try {
      content = await scrapeNewsContent(news.url, 3000)
      console.log(`[Scraping] 성공: ${content.length}자 확보 - ${news.url}`)
    } catch (error) {
      console.error(`[Scraping] 실패: ${news.url}`, error)

      // 크롤링 실패 시 RSS summary 사용 (최소 100자 이상일 때만)
      if (news.summary && news.summary.length >= 100) {
        content = news.summary
        contentSource = 'summary'
        console.log(`[Fallback] RSS 요약 사용: ${content.length}자`)
      } else {
        return NextResponse.json(
          {
            success: false,
            error: '기사 내용을 가져올 수 없습니다. 잠시 후 다시 시도해주세요.',
          },
          { status: 400 }
        )
      }
    }

    if (!content || content.length < 50) {
      return NextResponse.json(
        {
          success: false,
          error: '기사 내용이 너무 짧습니다.',
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
        aiOneLiner: result.oneLiner,
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
        oneLiner: result.oneLiner,
        provider: result.provider,
        cached: false,
        contentSource, // 스크래핑 or RSS 요약
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
