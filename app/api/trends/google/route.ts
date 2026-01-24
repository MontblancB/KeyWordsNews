import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { newsService } from '@/lib/db/news'
import { isDatabaseEnabled } from '@/lib/config/database'
import { realtimeCollector } from '@/lib/rss/realtime-collector'

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
  '뉴스', '기사', '보도', '발표', '공개', '전달', '알려', '밝혀',
  // 날짜/시간
  '오늘', '어제', '내일', '올해', '작년', '내년', '이번', '지난', '다음', '월', '일', '년',
])

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

      // 더미 데이터 감지 (뉴스, 한국, 정부, 경제, 사회)
      const DUMMY_KEYWORDS = new Set(['뉴스', '한국', '정부', '경제', '사회'])
      const isDummyData =
        cachedTrends.length === 5 &&
        cachedTrends.every((t) => DUMMY_KEYWORDS.has(t.keyword))

      if (isDummyData) {
        console.warn('[Trends] Dummy data detected, deleting and refreshing...')
        // 더미 데이터 삭제
        await prisma.trend.deleteMany({
          where: { collectedAt: cachedTrends[0].collectedAt },
        })
        // 강제 새로고침으로 진행
      } else if (cachedTrends.length > 0) {
        console.log('[Trends] Returning cached data')
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
        const cleaned = keyword.trim()
        // 불용어 제외, 2글자 이상, 숫자만인 경우 제외
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
        score: Math.round(score * 100) / 100, // 점수 포함 (참고용)
      }))

    if (sortedKeywords.length === 0) {
      console.log('[Trends] No AI keywords found, trying title extraction')

      // newsService 또는 realtimeCollector 사용 (메인 API와 동일)
      let allNews: any[] = []

      if (isDatabaseEnabled()) {
        console.log('[Trends] Using database mode')
        allNews = await newsService.getLatestNews(500, 0)
      } else {
        console.log('[Trends] Using realtime RSS mode')
        allNews = await realtimeCollector.collectAllRealtime()
      }

      console.log(`[Trends] Found ${allNews.length} news for title extraction`)

      if (allNews.length === 0) {
        console.error('[Trends] No news found!')
        throw new Error('No news data available')
      }

      console.log(`[Trends] Sample news title: "${allNews[0].title}"`)

      const newsWithTitles = allNews.map((news) => ({
        title: news.title,
        publishedAt: new Date(news.publishedAt),
      }))

      // 스마트 키워드 추출 (불용어 제외, 시간 가중치 적용)
      const titleKeywords = new Map<string, number>()
      const now = Date.now()

      newsWithTitles.forEach((news) => {
        const hoursSincePublished =
          (now - new Date(news.publishedAt).getTime()) / (1000 * 60 * 60)
        // 최근 24시간 뉴스에 높은 가중치, 그 이후는 감소
        const timeWeight = Math.max(0.1, 1 - hoursSincePublished / 24)

        // 제목에서 키워드 추출
        const title = news.title
          // 특수문자를 공백으로 치환 (따옴표, 괄호 등 유지)
          .replace(/[\[\]{}():;,\.!?'"…·]/g, ' ')
          // 여러 공백을 하나로
          .replace(/\s+/g, ' ')
          .trim()

        const words = title
          .split(' ')
          .map((w: string) => w.trim())
          .filter((w: string) => {
            // 필터링 조건:
            // 1. 2글자 이상
            // 2. 불용어가 아님
            // 3. 숫자만으로 이루어지지 않음
            return (
              w.length >= 2 &&
              !STOPWORDS.has(w) &&
              !/^[0-9]+$/.test(w)
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

      console.log(
        `[Trends] Extracted ${titleTrends.length} keywords from titles:`,
        titleTrends.map((t) => t.keyword).join(', ')
      )

      if (titleTrends.length === 0) {
        console.error('[Trends] No keywords extracted from titles')
        throw new Error('No trends available - insufficient news data')
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
