import { NextResponse } from 'next/server'
import { newsService } from '@/lib/db/news'
import { cache } from '@/lib/cache'
import { hybridCategorySearch } from '@/lib/rss/realtime-search'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params
    const { searchParams } = new URL(request.url)
    const sourcesParam = searchParams.get('sources') // 활성화된 소스 이름 목록 (콤마 구분)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const cacheKey = `news:topic:${category}:hybrid${sourcesParam ? ':' + sourcesParam : ''}:${limit}:${offset}`

    console.log(`🔍 하이브리드 카테고리 조회 시작: "${category}" (limit: ${limit}, offset: ${offset})`)

    // 캐시 확인 (5분)
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

    // 1. DB에서 해당 카테고리 뉴스 조회
    let dbNews = await newsService.getNewsByCategory(category, 100)
    console.log(`📊 DB 조회 결과: ${dbNews.length}건`)

    // 1.5. 사용자가 활성화한 소스로 필터링
    if (sourcesParam) {
      const enabledSourceNames = sourcesParam.split(',')
      dbNews = dbNews.filter(news => enabledSourceNames.includes(news.source))
      console.log(`✅ 활성화된 소스로 필터링: ${dbNews.length}건`)
    }

    // 2. Google News 실시간 검색 + DB 결과 병합
    const allResults = await hybridCategorySearch(category, dbNews)

    // 3. 페이지네이션 적용
    const total = allResults.length
    const paginatedResults = allResults.slice(offset, offset + limit)

    const response = {
      data: paginatedResults,
      total,
      hasMore: offset + limit < total
    }

    // 캐시에 저장 (5분)
    cache.set(cacheKey, response, 300)

    console.log(`✅ 최종 결과 반환: ${paginatedResults.length}건 (전체: ${total}건)`)

    return NextResponse.json({
      success: true,
      category,
      source: 'hybrid',
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
