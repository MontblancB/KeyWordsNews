import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { newsService } from '@/lib/db/news'
import { isDatabaseEnabled } from '@/lib/config/database'
import { realtimeCollector } from '@/lib/rss/realtime-collector'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // 30초 타임아웃

// 한국어 불용어 리스트
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

      // newsService 또는 realtimeCollector 사용
      let allNews: any[] = []

      if (isDatabaseEnabled()) {
        console.log('[Trends Collect] Using database mode')
        allNews = await newsService.getLatestNews(500, 0)
      } else {
        console.log('[Trends Collect] Using realtime RSS mode')
        allNews = await realtimeCollector.collectAllRealtime()
      }

      console.log(`[Trends Collect] Found ${allNews.length} news for title extraction`)

      if (allNews.length === 0) {
        console.warn('[Trends Collect] No news found, skipping collection')
        return Response.json({
          success: false,
          error: 'No news available',
          count: 0,
        })
      }

      const newsWithTitles = allNews.map((news) => ({
        title: news.title,
        publishedAt: new Date(news.publishedAt),
      }))

      const titleKeywords = new Map<string, number>()
      const now = Date.now()

      newsWithTitles.forEach((news) => {
        const hoursSincePublished =
          (now - new Date(news.publishedAt).getTime()) / (1000 * 60 * 60)
        const timeWeight = Math.max(0.1, 1 - hoursSincePublished / 24)

        // 제목에서 키워드 추출
        let title = news.title
          // 출처 제거
          .split(/[-|]/)
          .shift() || ''

        title = title
          // 대괄호 안 내용 제거
          .replace(/\[.*?\]/g, ' ')
          // 특수문자 제거
          .replace(/[→←↑↓…·""''""「」『』【】〈〉《》]/g, ' ')
          .replace(/[\[\]{}():;,\.!?'"]/g, ' ')
          // 년생 패턴 유지
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

      keywords = Array.from(titleKeywords.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([keyword, _], index) => ({
          keyword,
          rank: index + 1,
          country: 'south_korea',
        }))

      console.log(`[Trends Collect] Extracted ${keywords.length} keywords from titles`)

      if (keywords.length === 0) {
        console.warn('[Trends Collect] No keywords extracted, skipping collection')
        return Response.json({
          success: false,
          error: 'No trends available',
          count: 0,
        })
      }
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
