import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import googleTrends from 'google-trends-api'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30 // 30초 타임아웃

/**
 * GET /api/trends/google
 * Google Trends 실시간 검색어 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('refresh') === 'true'

    // 캐시 확인 (1시간 이내 데이터)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    if (!forceRefresh) {
      const cachedTrends = await prisma.trend.findMany({
        where: {
          collectedAt: { gte: oneHourAgo },
          country: 'south_korea',
        },
        orderBy: { rank: 'asc' },
        take: 20,
      })

      if (cachedTrends.length > 0) {
        return Response.json({
          success: true,
          data: cachedTrends,
          cached: true,
          collectedAt: cachedTrends[0].collectedAt,
        })
      }
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

    // DB에 저장
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

    return Response.json({
      success: true,
      data: keywords.map((k: any) => ({
        ...k,
        collectedAt: collectedAt.toISOString(),
        createdAt: collectedAt.toISOString(),
        id: `temp-${k.rank}`,
      })),
      cached: false,
      collectedAt: collectedAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Trends API Error:', error)
    return Response.json(
      {
        success: false,
        error: error.message || 'Failed to fetch trends',
      },
      { status: 500 }
    )
  }
}
