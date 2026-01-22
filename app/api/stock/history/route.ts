import { NextResponse } from 'next/server'
import { fetchKoreanIndexHistory, fetchStockHistory } from '@/lib/api/yahoo-finance'

/**
 * KOSPI/KOSDAQ 과거 차트 데이터 API + 개별 종목 차트 데이터 API
 * Lightweight Charts용 OHLC 데이터 제공
 */

// 캐시 설정 (5분)
const cacheStore = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5분

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const indexCode = searchParams.get('index') as 'KOSPI' | 'KOSDAQ' | null
    const stockCode = searchParams.get('code')
    const market = (searchParams.get('market') as 'KOSPI' | 'KOSDAQ' | 'US') || 'KOSPI'
    const range = (searchParams.get('range') as '1d' | '5d' | '1mo' | '3mo' | '1y' | '2y' | '5y') || '3mo'
    const interval = searchParams.get('interval') || '1d'

    // 지수 또는 개별 종목 중 하나는 필수
    if (!indexCode && !stockCode) {
      return NextResponse.json(
        { success: false, error: 'Either index or code parameter is required.' },
        { status: 400 }
      )
    }

    // 캐시 키
    const cacheKey = stockCode
      ? `stock-${stockCode}-${market}-${range}-${interval}`
      : `index-${indexCode}-${range}-${interval}`
    const now = Date.now()

    // 캐시 확인
    const cached = cacheStore.get(cacheKey)
    if (cached && now - cached.timestamp < CACHE_DURATION) {
      const cacheAge = Math.floor((now - cached.timestamp) / 1000)
      console.log(`[Stock History API] Returning cached data for ${cacheKey} (age: ${cacheAge}s)`)
      return NextResponse.json({
        success: true,
        data: cached.data,
        cached: true,
        cacheAge,
      })
    }

    // 데이터 가져오기
    let data: any[]

    if (stockCode) {
      // 개별 종목
      console.log(`[Stock History API] Fetching fresh data for stock ${stockCode} (${market}, ${range}, ${interval})`)
      data = await fetchStockHistory(stockCode, market, range, interval)
    } else if (indexCode) {
      // 지수
      console.log(`[Stock History API] Fetching fresh data for index ${indexCode} (${range}, ${interval})`)
      data = await fetchKoreanIndexHistory(indexCode, range, interval)
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid parameters' },
        { status: 400 }
      )
    }

    if (!data.length) {
      return NextResponse.json(
        { success: false, error: 'No data available' },
        { status: 404 }
      )
    }

    // 캐시 저장
    cacheStore.set(cacheKey, { data, timestamp: now })

    return NextResponse.json({
      success: true,
      data,
      cached: false,
      ...(stockCode ? { code: stockCode, market } : { index: indexCode }),
      range,
      interval,
      dataPoints: data.length,
    })
  } catch (error) {
    console.error('Stock history API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock history' },
      { status: 500 }
    )
  }
}
