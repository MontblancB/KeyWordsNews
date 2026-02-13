import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { newsService } from '@/lib/db/news'
import { isDatabaseEnabled } from '@/lib/config/database'
import { realtimeCollector } from '@/lib/rss/realtime-collector'
import { fetchGoogleTrends } from '@/lib/api/google-trends'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 30 // 30초 타임아웃

// 한국어 불용어 리스트 (조사, 접속사, 일반 명사)
const STOPWORDS = new Set([
  // 조사
  '이', '가', '은', '는', '을', '를', '의', '에', '에서', '으로', '로', '과', '와', '도', '만', '까지', '부터', '조차', '마저',
  // 접속사/부사
  '그리고', '하지만', '그러나', '또한', '또', '및', '등', '이런', '저런', '그런',
  // 일반적인 단어
  '것', '수', '때', '등', '중', '내', '위', '통해', '대해', '관련', '있다', '없다', '하다',
  '있는', '없는', '하는', '된', '되는', '한', '할', '위한', '대한', '관한',
  '뉴스', '기사', '보도', '발표', '공개', '전달', '알려', '밝혀', '속보', '긴급',
  // 날짜/시간
  '오늘', '어제', '내일', '올해', '작년', '내년', '이번', '지난', '다음', '월', '일', '년',
  // 도메인/기술 용어
  'com', 'co', 'kr', 'net', 'org', 'www', 'http', 'https',
  // 뉴스 출처/플랫폼
  '네이트', '네이버', '다음', 'daum', 'naver', 'google', '구글',
  // 카테고리
  '글로벌', '스포츠', '연예', '문화', '사회', '정치', '경제', 'IT',
])

/**
 * GET /api/trends/google
 * Google Trends RSS 기반 실시간 검색어 (폴백: 자체 뉴스 키워드 분석)
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

      // 더미 데이터 감지
      const DUMMY_KEYWORDS = new Set(['뉴스', '한국', '정부', '경제', '사회'])
      const isDummyData =
        cachedTrends.length === 5 &&
        cachedTrends.every((t) => DUMMY_KEYWORDS.has(t.keyword))

      if (isDummyData) {
        console.warn('[Trends] Dummy data detected, deleting and refreshing...')
        await prisma.trend.deleteMany({
          where: { collectedAt: cachedTrends[0].collectedAt },
        })
      } else if (cachedTrends.length > 0) {
        console.log('[Trends] Returning cached data')
        const cachedSource = cachedTrends[0].source || 'google_trends_rss'
        return Response.json({
          success: true,
          data: cachedTrends,
          cached: true,
          collectedAt: cachedTrends[0].collectedAt,
          source: cachedSource,
        })
      }
    }

    // 1차 시도: Google Trends RSS
    console.log('[Trends] Trying Google Trends RSS...')
    const googleTrends = await fetchGoogleTrends()

    if (googleTrends && googleTrends.length > 0) {
      console.log(`[Trends] Google Trends RSS: ${googleTrends.length} trends`)

      const collectedAt = new Date()

      // DB 저장
      await prisma.$transaction(
        googleTrends.map((trend) =>
          prisma.trend.create({
            data: {
              keyword: trend.keyword,
              rank: trend.rank,
              country: 'south_korea',
              traffic: trend.traffic || null,
              source: 'google_trends_rss',
              collectedAt,
            },
          })
        )
      )

      return Response.json({
        success: true,
        data: googleTrends.map((t) => ({
          keyword: t.keyword,
          rank: t.rank,
          country: 'south_korea',
          traffic: t.traffic,
          collectedAt: collectedAt.toISOString(),
          createdAt: collectedAt.toISOString(),
          id: `gt-${t.rank}`,
        })),
        cached: false,
        collectedAt: collectedAt.toISOString(),
        source: 'google_trends_rss',
      })
    }

    // 2차 폴백: 자체 뉴스 키워드 분석
    console.log('[Trends] Google Trends RSS failed, falling back to local analysis...')
    return await analyzeLocalNews()
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

/**
 * 기존 자체 뉴스 키워드 분석 (폴백용)
 */
async function analyzeLocalNews() {
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

  console.log(`[Trends] Found ${recentNews.length} news with AI keywords in last 24h`)

  // 키워드 빈도 계산 (시간 가중치 적용)
  const keywordFrequency = new Map<string, number>()
  const now = Date.now()

  recentNews.forEach((news) => {
    const hoursSincePublished =
      (now - new Date(news.publishedAt).getTime()) / (1000 * 60 * 60)
    const timeWeight = Math.max(0, 1 - hoursSincePublished / 24)

    news.aiKeywords.forEach((keyword) => {
      const cleaned = keyword.trim()
      if (
        cleaned &&
        cleaned.length >= 2 &&
        !STOPWORDS.has(cleaned) &&
        !/^[0-9]+$/.test(cleaned)
      ) {
        const current = keywordFrequency.get(cleaned) || 0
        keywordFrequency.set(cleaned, current + timeWeight)
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
      score: Math.round(score * 100) / 100,
    }))

  if (sortedKeywords.length === 0) {
    console.log('[Trends] No AI keywords found, trying title extraction')

    let allNews: any[] = []

    if (isDatabaseEnabled()) {
      allNews = await newsService.getLatestNews(500, 0)
    } else {
      allNews = await realtimeCollector.collectAllRealtime()
    }

    console.log(`[Trends] Found ${allNews.length} news for title extraction`)

    if (allNews.length === 0) {
      throw new Error('No news data available')
    }

    const newsWithTitles = allNews.map((news) => ({
      title: news.title,
      publishedAt: new Date(news.publishedAt),
    }))

    const titleKeywords = new Map<string, number>()

    newsWithTitles.forEach((news) => {
      const hoursSincePublished =
        (now - new Date(news.publishedAt).getTime()) / (1000 * 60 * 60)
      const timeWeight = Math.max(0.1, 1 - hoursSincePublished / 24)

      let title = news.title
        .split(/[-|]/)
        .shift() || ''

      title = title
        .replace(/\[.*?\]/g, ' ')
        .replace(/[→←↑↓…·""''""「」『』【】〈〉《》]/g, ' ')
        .replace(/[\[\]{}():;,\.!?'"]/g, ' ')
        .replace(/\d{2,4}년생/g, (match: string) => match)
        .replace(/\s+/g, ' ')
        .trim()

      const words = title
        .split(' ')
        .map((w: string) => w.trim())
        .filter((w: string) => {
          return (
            w.length >= 2 &&
            !STOPWORDS.has(w) &&
            !/^[0-9]+$/.test(w) &&
            /[가-힣]/.test(w) &&
            !/^[^가-힣a-zA-Z0-9]+$/.test(w)
          )
        })

      words.forEach((word: string) => {
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

    if (titleTrends.length === 0) {
      throw new Error('No trends available - insufficient news data')
    }

    const collectedAt = new Date()
    await prisma.$transaction(
      titleTrends.map((trend) =>
        prisma.trend.create({
          data: {
            keyword: trend.keyword,
            rank: trend.rank,
            country: trend.country,
            source: 'local_analysis',
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
      source: 'local_analysis',
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
          source: 'local_analysis',
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
    source: 'local_analysis',
  })
}
