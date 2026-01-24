import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // 30초 타임아웃

/**
 * POST /api/trends/collect
 * GitHub Actions Cron용 트렌드 수집 엔드포인트
 */
export async function POST(request: NextRequest) {
  try {
    // Cron Secret 검증
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 최근 24시간 뉴스에서 키워드 추출
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const recentNews = await prisma.news.findMany({
      where: {
        publishedAt: { gte: oneDayAgo },
        aiKeywords: { isEmpty: false },
      },
      select: {
        aiKeywords: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 200,
    })

    console.log(`[Trends Collect] Found ${recentNews.length} news with AI keywords`)

    // 키워드 빈도 계산 (시간 가중치)
    const keywordFrequency = new Map<string, number>()
    const now = Date.now()

    recentNews.forEach((news) => {
      const hoursSincePublished =
        (now - new Date(news.publishedAt).getTime()) / (1000 * 60 * 60)
      const timeWeight = Math.max(0, 1 - hoursSincePublished / 24)

      news.aiKeywords.forEach((keyword) => {
        if (keyword && keyword.length >= 2) {
          const current = keywordFrequency.get(keyword) || 0
          keywordFrequency.set(keyword, current + timeWeight)
        }
      })
    })

    // 상위 20개 추출
    let keywords = Array.from(keywordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, _], index) => ({
        keyword,
        rank: index + 1,
        country: 'south_korea',
      }))

    // AI 키워드가 없으면 제목에서 추출
    if (keywords.length === 0) {
      console.log('[Trends Collect] No AI keywords, trying title extraction')

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const newsWithTitles = await prisma.news.findMany({
        where: { publishedAt: { gte: sevenDaysAgo } },
        select: { title: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 500,
      })

      console.log(`[Trends Collect] Found ${newsWithTitles.length} news for title extraction`)

      const titleKeywords = new Map<string, number>()
      const now = Date.now()

      newsWithTitles.forEach((news) => {
        const hoursSincePublished =
          (now - new Date(news.publishedAt).getTime()) / (1000 * 60 * 60)
        const timeWeight = Math.max(0.1, 1 - hoursSincePublished / (7 * 24))

        const words = news.title
          .split(/[\s,\.]+/)
          .filter((w) => w.length >= 2 && !/^[0-9]+$/.test(w))

        words.forEach((word) => {
          const current = titleKeywords.get(word) || 0
          titleKeywords.set(word, current + timeWeight)
        })
      })

      keywords = Array.from(titleKeywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([keyword, _], index) => ({
          keyword,
          rank: index + 1,
          country: 'south_korea',
        }))

      console.log(`[Trends Collect] Extracted ${keywords.length} keywords from titles`)
    }

    if (keywords.length === 0) {
      console.warn('[Trends Collect] No keywords found, skipping collection')
      return Response.json({
        success: false,
        error: 'No trends available',
        count: 0,
      })
    }

    // DB 저장
    const collectedAt = new Date()

    await prisma.$transaction(
      keywords.map((trend) =>
        prisma.trend.create({
          data: {
            keyword: trend.keyword,
            rank: trend.rank,
            country: trend.country,
            collectedAt,
          },
        })
      )
    )

    // 7일 이상 된 데이터 삭제
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    await prisma.trend.deleteMany({
      where: { collectedAt: { lt: sevenDaysAgo } },
    })

    return Response.json({
      success: true,
      count: keywords.length,
      collectedAt: collectedAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Trend Collection Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
