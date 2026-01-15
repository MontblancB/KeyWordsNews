import { NextResponse } from 'next/server'
import { newsService } from '@/lib/db/news'
import { cache } from '@/lib/cache'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sourcesParam = searchParams.get('sources') // 활성화된 소스 이름 목록 (콤마 구분)

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

    // DB 조회
    let news = await newsService.getBreakingNews(10)

    // 사용자가 활성화한 소스로 필터링
    if (sourcesParam) {
      const enabledSourceNames = sourcesParam.split(',')
      news = news.filter(item => enabledSourceNames.includes(item.source))
      console.log(`✅ 속보 - 활성화된 소스로 필터링: ${news.length}건`)
    }

    // 캐시에 저장 (5분)
    cache.set(cacheKey, news, 300)

    return NextResponse.json({
      success: true,
      source: 'database',
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
