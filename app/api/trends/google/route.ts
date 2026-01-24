import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30 // 30초 타임아웃

/**
 * GET /api/trends/google
 * 자체 뉴스 키워드 트렌드 분석
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
      take: 200, // 최근 200개 뉴스
    })

    // 키워드 빈도 계산 (시간 가중치 적용)
    const keywordFrequency = new Map<string, number>()
    const now = Date.now()

    recentNews.forEach((news) => {
      const hoursSincePublished =
        (now - new Date(news.publishedAt).getTime()) / (1000 * 60 * 60)

      // 최근 뉴스일수록 높은 가중치 (최대 24시간 전까지)
      const timeWeight = Math.max(0, 1 - hoursSincePublished / 24)

      news.aiKeywords.forEach((keyword) => {
        if (keyword && keyword.length >= 2) {
          // 2글자 이상만
          const current = keywordFrequency.get(keyword) || 0
          keywordFrequency.set(keyword, current + timeWeight)
        }
      })
    })

    // 빈도순 정렬 및 상위 20개 추출
    const sortedKeywords = Array.from(keywordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([keyword, score], index) => ({
        keyword,
        rank: index + 1,
        country: 'south_korea',
        score: Math.round(score * 100) / 100, // 점수 포함 (참고용)
      }))

    if (sortedKeywords.length === 0) {
      // 뉴스에 키워드가 없는 경우, 제목에서 추출
      const newsWithTitles = await prisma.news.findMany({
        where: { publishedAt: { gte: oneDayAgo } },
        select: { title: true },
        orderBy: { publishedAt: 'desc' },
        take: 100,
      })

      // 간단한 키워드 추출 (2글자 이상 단어)
      const titleKeywords = new Map<string, number>()
      newsWithTitles.forEach((news) => {
        const words = news.title
          .split(/[\s,\.]+/)
          .filter((w) => w.length >= 2 && !/^[0-9]+$/.test(w))

        words.forEach((word) => {
          titleKeywords.set(word, (titleKeywords.get(word) || 0) + 1)
        })
      })

      const titleTrends = Array.from(titleKeywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([keyword, count], index) => ({
          keyword,
          rank: index + 1,
          country: 'south_korea',
          score: count,
        }))

      if (titleTrends.length === 0) {
        throw new Error('No trends found')
      }

      // DB 저장
      const collectedAt = new Date()
      await prisma.$transaction(
        titleTrends.map((trend) =>
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
        data: titleTrends.map((t) => ({
          ...t,
          collectedAt: collectedAt.toISOString(),
          createdAt: collectedAt.toISOString(),
          id: `temp-${t.rank}`,
        })),
        cached: false,
        collectedAt: collectedAt.toISOString(),
      })
    }

    // DB에 저장
    const collectedAt = new Date()

    await prisma.$transaction(
      sortedKeywords.map((trend) =>
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
      data: sortedKeywords.map((k) => ({
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
