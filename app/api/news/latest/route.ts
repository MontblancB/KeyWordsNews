import { NextResponse } from 'next/server'
import { newsService } from '@/lib/db/news'
import { cache } from '@/lib/cache'
import { isDatabaseEnabled } from '@/lib/config/database'
import { realtimeCollector } from '@/lib/rss/realtime-collector'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sourcesParam = searchParams.get('sources')
    const sources = sourcesParam ? sourcesParam.split(',') : undefined

    const cacheKey = `news:latest:${limit}:${offset}:${sourcesParam || 'all'}`

    // 캐시 확인
    const cached = cache.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        source: 'cache',
        ...cached
      })
    }

    let response: any

    if (isDatabaseEnabled()) {
      // ========== DB 모드 ==========
      const news = await newsService.getLatestNews(limit, offset, sources)
      const total = await newsService.getLatestNewsCount(sources)

      response = {
        data: news,
        total,
        hasMore: offset + limit < total,
        source: 'database'
      }
    } else {
      // ========== 실시간 RSS 모드 ==========
      const allNews = await realtimeCollector.collectAllRealtime()

      // 소스 필터링
      const filteredNews = sources && sources.length > 0
        ? allNews.filter(news => sources.includes(news.source))
        : allNews

      // 메모리에서 페이지네이션
      const paginatedNews = filteredNews.slice(offset, offset + limit)

      response = {
        data: paginatedNews,
        total: filteredNews.length,
        hasMore: offset + limit < filteredNews.length,
        source: 'realtime-rss'
      }
    }

    // 캐시에 저장 (30초)
    cache.set(cacheKey, response, 30)

    return NextResponse.json({
      success: true,
      ...response
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    )
  }
}
