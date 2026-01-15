import { NextResponse } from 'next/server'
import { newsService } from '@/lib/db/news'
import { cache } from '@/lib/cache'

export async function GET() {
  try {
    const cacheKey = 'news:latest'

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
    const news = await newsService.getLatestNews(30)

    // 캐시에 저장 (3분)
    cache.set(cacheKey, news, 180)

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
