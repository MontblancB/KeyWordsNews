import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { newsService } from '@/lib/db/news'
import { isDatabaseEnabled } from '@/lib/config/database'
import { realtimeCollector } from '@/lib/rss/realtime-collector'
import { fetchGoogleTrends } from '@/lib/api/google-trends'
import { fetchSignalTrends } from '@/lib/api/signal-bz'
import { STOPWORDS, calcTimeWeight } from '@/lib/trends/stopwords'

export const dynamic = 'force-dynamic'
export const maxDuration = 30 // 30초 타임아웃

/**
 * POST /api/trends/collect
 * GitHub Actions Cron용 트렌드 수집 엔드포인트
 * 3단계 폴백: Signal.bz → Google Trends RSS → 자체 뉴스 분석
 */
export async function POST(request: NextRequest) {
  try {
    // Cron Secret 검증
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let keywords: { keyword: string; rank: number; country: string; traffic?: string; state?: string }[] = []
    let source = 'local_analysis'

    // 1차: Signal.bz 실시간 검색어
    console.log('[Trends Collect] 1st: Trying Signal.bz...')
    const signalTrends = await fetchSignalTrends()

    if (signalTrends && signalTrends.length > 0) {
      console.log(`[Trends Collect] Signal.bz: ${signalTrends.length} trends`)
      keywords = signalTrends.map((t) => ({
        keyword: t.keyword,
        rank: t.rank,
        country: 'south_korea',
        state: t.state,
      }))
      source = 'signal_bz'
    }

    // 2차: Google Trends RSS
    if (keywords.length === 0) {
      console.log('[Trends Collect] 2nd: Trying Google Trends RSS...')
      const googleTrends = await fetchGoogleTrends()

      if (googleTrends && googleTrends.length > 0) {
        console.log(`[Trends Collect] Google Trends RSS: ${googleTrends.length} trends`)
        keywords = googleTrends.map((t) => ({
          keyword: t.keyword,
          rank: t.rank,
          country: 'south_korea',
          traffic: t.traffic,
        }))
        source = 'google_trends_rss'
      }
    }

    // 3차: 자체 뉴스 키워드 분석
    if (keywords.length === 0) {
      console.log('[Trends Collect] 3rd: Falling back to local analysis...')

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

      // 키워드 빈도 계산 (지수 감소 시간 가중치)
      const keywordFrequency = new Map<string, number>()
      const now = Date.now()

      recentNews.forEach((news) => {
        const hoursSincePublished =
          (now - new Date(news.publishedAt).getTime()) / (1000 * 60 * 60)
        const timeWeight = calcTimeWeight(hoursSincePublished)

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

      keywords = Array.from(keywordFrequency.entries())
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

        let allNews: any[] = []

        if (isDatabaseEnabled()) {
          allNews = await newsService.getLatestNews(500, 0)
        } else {
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

        const titleKeywords = new Map<string, number>()

        allNews.forEach((news: any) => {
          const hoursSincePublished =
            (now - new Date(news.publishedAt).getTime()) / (1000 * 60 * 60)
          const timeWeight = calcTimeWeight(hoursSincePublished)

          let title = news.title.split(/[-|]/).shift() || ''
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
    }

    // DB 저장 (source, traffic, state 필드 포함)
    const collectedAt = new Date()

    await prisma.$transaction(
      keywords.map((trend) =>
        prisma.trend.create({
          data: {
            keyword: trend.keyword,
            rank: trend.rank,
            country: trend.country,
            traffic: trend.traffic || null,
            state: trend.state || null,
            source,
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
      source,
      collectedAt: collectedAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Trend Collection Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
