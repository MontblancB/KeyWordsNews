import { NextResponse } from 'next/server'
import { fetchTrendingStocks } from '@/lib/api/krx'
import type { TrendingStocksData } from '@/types/trending-stock'

/**
 * 실시간 주목 종목 API
 *
 * KRX 한국거래소에서 전종목 시세를 가져와
 * 거래량 상위 / 상승률 상위 / 하락률 상위 10개를 반환합니다.
 */

// 인메모리 캐시 (3분)
let cachedData: TrendingStocksData | null = null
let lastFetchTime: number = 0
const CACHE_DURATION = 3 * 60 * 1000

export async function GET(request: Request) {
  try {
    const now = Date.now()
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('force') === 'true'

    // 캐시 유효 시 캐시 반환
    if (!forceRefresh && cachedData && now - lastFetchTime < CACHE_DURATION) {
      const cacheAge = Math.floor((now - lastFetchTime) / 1000)
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        cacheAge,
      })
    }

    console.log(
      forceRefresh
        ? `[Trending Stocks API] 🔄 Force refresh at ${new Date().toLocaleTimeString('ko-KR')}`
        : '[Trending Stocks API] Collecting fresh data (cache expired)'
    )

    const data = await fetchTrendingStocks()

    // 캐시 업데이트
    cachedData = data
    lastFetchTime = now

    return NextResponse.json({
      success: true,
      data,
      cached: false,
    })
  } catch (error) {
    console.error('Trending stocks error:', error)

    // 에러 시 캐시 데이터 반환
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        error: 'Fresh data unavailable, using cached data',
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trending stocks',
      },
      { status: 500 }
    )
  }
}
