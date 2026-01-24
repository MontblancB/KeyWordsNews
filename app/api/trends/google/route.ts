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

    console.log(`[Trends] Found ${recentNews.length} news with AI keywords in last 24h`)

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
      console.log('[Trends] No AI keywords found, trying title extraction')

      // 뉴스에 키워드가 없는 경우, 제목에서 추출 (기간 확대: 7일)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const newsWithTitles = await prisma.news.findMany({
        where: { publishedAt: { gte: sevenDaysAgo } },
        select: { title: true, publishedAt: true },
        orderBy: { publishedAt: 'desc' },
        take: 500, // 더 많은 뉴스 확인
      })

      console.log(`[Trends] Found ${newsWithTitles.length} news for title extraction`)

      // 간단한 키워드 추출 (2글자 이상 단어, 시간 가중치 적용)
      const titleKeywords = new Map<string, number>()
      const now = Date.now()

      newsWithTitles.forEach((news) => {
        const hoursSincePublished =
          (now - new Date(news.publishedAt).getTime()) / (1000 * 60 * 60)
        const timeWeight = Math.max(0.1, 1 - hoursSincePublished / (7 * 24)) // 최소 0.1 가중치

        const words = news.title
          .split(/[\s,\.]+/)
          .filter((w) => w.length >= 2 && !/^[0-9]+$/.test(w))

        words.forEach((word) => {
          const current = titleKeywords.get(word) || 0
          titleKeywords.set(word, current + timeWeight)
        })
      })

      const titleTrends = Array.from(titleKeywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([keyword, score], index) => ({
          keyword,
          rank: index + 1,
          country: 'south_korea',
          score: Math.round(score * 100) / 100,
        }))

      console.log(`[Trends] Extracted ${titleTrends.length} keywords from titles`)

      if (titleTrends.length === 0) {
        // 최후의 수단: 더미 데이터
        console.warn('[Trends] No keywords extracted, returning dummy data')
        const dummyTrends = [
          { keyword: '뉴스', rank: 1, country: 'south_korea', score: 1 },
          { keyword: '한국', rank: 2, country: 'south_korea', score: 0.9 },
          { keyword: '정부', rank: 3, country: 'south_korea', score: 0.8 },
          { keyword: '경제', rank: 4, country: 'south_korea', score: 0.7 },
          { keyword: '사회', rank: 5, country: 'south_korea', score: 0.6 },
        ]

        const collectedAt = new Date()
        await prisma.$transaction(
          dummyTrends.map((trend) =>
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
          data: dummyTrends.map((t) => ({
            ...t,
            collectedAt: collectedAt.toISOString(),
            createdAt: collectedAt.toISOString(),
            id: `temp-${t.rank}`,
          })),
          cached: false,
          collectedAt: collectedAt.toISOString(),
          warning: 'Using fallback data',
        })
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
