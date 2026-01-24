import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import googleTrends from 'google-trends-api'

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

    // Google Trends API 호출 (Node.js)
    const resultsString = await googleTrends.realTimeTrends({
      geo: 'KR', // 한국
      category: 'all',
    })

    const results = JSON.parse(resultsString)

    // 실시간 트렌드 추출
    const trendingSearches = results.storySummaries?.trendingStories || []
    const keywords = trendingSearches
      .slice(0, 20)
      .map((story: any, index: number) => ({
        keyword: story.title || story.entityNames?.[0] || '',
        rank: index + 1,
        country: 'south_korea',
      }))
      .filter((item: any) => item.keyword) // 빈 키워드 제거

    if (keywords.length === 0) {
      throw new Error('No trends found')
    }

    // DB 저장
    const collectedAt = new Date()

    await prisma.$transaction(
      keywords.map((trend: any) =>
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
