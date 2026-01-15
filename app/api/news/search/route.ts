import { NextResponse } from 'next/server'
import { newsService } from '@/lib/db/news'
import { hybridSearch } from '@/lib/rss/realtime-search'
import { isDatabaseEnabled } from '@/lib/config/database'
import { realtimeCollector } from '@/lib/rss/realtime-collector'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '30')
    const sourcesParam = searchParams.get('sources')

    if (!keyword) {
      return NextResponse.json(
        {
          success: false,
          error: '검색 키워드를 입력해주세요.'
        },
        { status: 400 }
      )
    }

    console.log(`🔍 검색: "${keyword}" (페이지 ${page})`)

    let allResults: any[]

    if (isDatabaseEnabled()) {
      // ========== DB 모드 (하이브리드 검색) ==========
      const dbResult = await newsService.searchNews(keyword, 1, 1000)
      allResults = dbResult.news

      if (page === 1) {
        allResults = await hybridSearch(keyword, dbResult.news)
      }
    } else {
      // ========== 실시간 RSS 모드 ==========
      allResults = await realtimeCollector.searchRealtime(keyword)
    }

    // 소스 필터링
    if (sourcesParam) {
      const enabledSourceNames = sourcesParam.split(',')
      allResults = allResults.filter(news =>
        enabledSourceNames.includes(news.source) || news.source === 'Google News'
      )
      console.log(`✅ 소스 필터링: ${allResults.length}건`)
    }

    // 페이지네이션
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
