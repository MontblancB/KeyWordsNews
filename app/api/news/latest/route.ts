import { NextResponse } from 'next/server'
import { newsService } from '@/lib/db/news'
import { cache } from '@/lib/cache'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const cacheKey = `news:latest:${limit}:${offset}`

    // 캐시 확인
    const cached = cache.get<any>(cacheKey)
    if (cached) {
      return NextResponse.json({
        success: true,
        source: 'cache',
        ...cached
      })
    }

    // DB 조회
    const news = await newsService.getLatestNews(limit, offset)
    const total = await newsService.getLatestNewsCount()

    const response = {
      data: news,
      total,
      hasMore: offset + limit < total
    }

    // 캐시에 저장 (1분 - 새로고침 응답성 향상)
    cache.set(cacheKey, response, 60)

    return NextResponse.json({
      success: true,
      source: 'database',
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
