import { NextResponse } from 'next/server'
import { newsService } from '@/lib/db/news'
import { hybridSearch } from '@/lib/rss/realtime-search'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const sourcesParam = searchParams.get('sources') // 활성화된 소스 ID 목록 (콤마 구분)

    if (!keyword) {
      return NextResponse.json(
        {
          success: false,
          error: '검색 키워드를 입력해주세요.'
        },
        { status: 400 }
      )
    }

    console.log(`🔍 하이브리드 검색 시작: "${keyword}" (페이지 ${page})`)

    // 1. DB에서 검색 (전체 결과 - 페이지네이션 나중에 적용)
    const dbResult = await newsService.searchNews(keyword, 1, 1000)

    // 2. 첫 페이지일 때만 Google News 실시간 검색 (성능 최적화)
    let allResults = dbResult.news

    if (page === 1) {
      // Google News 실시간 검색 + DB 결과 병합
      allResults = await hybridSearch(keyword, dbResult.news)
    }

    // 2.5. 사용자가 활성화한 소스로 필터링
    if (sourcesParam) {
      const enabledSourceNames = sourcesParam.split(',')
      allResults = allResults.filter(news =>
        enabledSourceNames.includes(news.source) || news.source === 'Google News'
      )
      console.log(`✅ 활성화된 소스로 필터링: ${allResults.length}건`)
    }

    // 3. 페이지네이션 적용
    const skip = (page - 1) * limit
    const paginatedResults = allResults.slice(skip, skip + limit)
    const totalPages = Math.ceil(allResults.length / limit)

    return NextResponse.json({
      success: true,
      keyword,
      page,
      totalPages,
      total: allResults.length,
      data: paginatedResults
    })
  } catch (error: any) {
    console.error('검색 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    )
  }
}
