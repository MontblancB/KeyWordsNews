import { NextResponse } from 'next/server'
import { newsService } from '@/lib/db/news'
import { cache } from '@/lib/cache'
import { hybridCategorySearch } from '@/lib/rss/realtime-search'
import { isDatabaseEnabled } from '@/lib/config/database'
import { realtimeCollector } from '@/lib/rss/realtime-collector'

export async function GET(
  request: Request,
  context: { params: Promise<{ category: string }> | { category: string } }
) {
  try {
    // Next.js 15+: params is Promise, Next.js 14-: params is object
    const resolvedParams = 'then' in context.params
      ? await context.params
      : context.params
    const { category } = resolvedParams
    const { searchParams } = new URL(request.url)
    const sourcesParam = searchParams.get('sources')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const cacheKey = `news:topic:${category}:${sourcesParam ? sourcesParam : 'all'}:${limit}:${offset}`

    console.log(`🔍 카테고리 조회: "${category}" (limit: ${limit}, offset: ${offset})`)

    // 캐시 확인
    const cached = cache.get<any>(cacheKey)
    if (cached) {
      console.log(`✅ 캐시에서 반환: ${cached.data.length}건`)
      return NextResponse.json({
        success: true,
        category,
        source: 'cache',
        ...cached
      })
    }

    let response: any

    if (isDatabaseEnabled()) {
      // ========== DB 모드 (하이브리드 검색) ==========
      let dbNews = await newsService.getNewsByCategory(category, 100)

      if (sourcesParam) {
        const enabledSourceNames = sourcesParam.split(',')
        dbNews = dbNews.filter(news => enabledSourceNames.includes(news.source))
      }

      const allResults = await hybridCategorySearch(category, dbNews)
      const paginatedResults = allResults.slice(offset, offset + limit)

      response = {
        data: paginatedResults,
        total: allResults.length,
        hasMore: offset + limit < allResults.length,
        source: 'database-hybrid'
      }
    } else {
      // ========== 실시간 RSS 모드 ==========
      let allNews = await realtimeCollector.collectCategoryRealtime(category)

      // 소스 필터링
      if (sourcesParam) {
        const enabledSourceNames = sourcesParam.split(',')
        allNews = allNews.filter(news => enabledSourceNames.includes(news.source))
      }

      // 페이지네이션
      const paginatedNews = allNews.slice(offset, offset + limit)

      response = {
        data: paginatedNews,
        total: allNews.length,
        hasMore: offset + limit < allNews.length,
        source: 'realtime-rss'
      }
    }

    // 캐시에 저장 (30초)
    cache.set(cacheKey, response, 30)

    console.log(`✅ 결과 반환: ${response.data.length}건 (전체: ${response.total}건)`)

    return NextResponse.json({
      success: true,
      category,
      ...response
    })
  } catch (error: any) {
    console.error('카테고리 조회 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    )
  }
}
