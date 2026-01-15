import { NextResponse } from 'next/server'
import { newsService } from '@/lib/db/news'
import { cache } from '@/lib/cache'
import { isDatabaseEnabled } from '@/lib/config/database'
import { realtimeCollector } from '@/lib/rss/realtime-collector'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sourcesParam = searchParams.get('sources')

    const cacheKey = `news:breaking${sourcesParam ? ':' + sourcesParam : ''}`

    // 캐시 확인
    const cached = cache.get<any[]>(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        source: 'cache',
        data: cached
      })
    }

    let news: any[]

    if (isDatabaseEnabled()) {
      // ========== DB 모드 ==========
      news = await newsService.getBreakingNews(10)
    } else {
      // ========== 실시간 RSS 모드 ==========
      news = await realtimeCollector.collectCategoryRealtime('breaking')
      news = news.slice(0, 10) // 최신 10개만
    }

    // 소스 필터링
    if (sourcesParam) {
      const enabledSourceNames = sourcesParam.split(',')
      news = news.filter(item => enabledSourceNames.includes(item.source))
      console.log(`✅ 속보 필터링: ${news.length}건`)
    }

    // 캐시에 저장 (15초)
    cache.set(cacheKey, news, 15)

    return NextResponse.json({
      success: true,
      source: isDatabaseEnabled() ? 'database' : 'realtime-rss',
      data: news
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
