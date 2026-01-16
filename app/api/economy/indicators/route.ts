import { NextResponse } from 'next/server'
import { collectAllEconomyData } from '@/lib/scraper/hybrid-economy'
import type { EconomyData } from '@/types/economy'

/**
 * 경제 지표 API (하이브리드 방식)
 *
 * - 국내 지수 (KOSPI, KOSDAQ): 네이버 금융 스크래핑
 * - 환율 (USD, JPY, EUR, CNY): 네이버 금융 스크래핑
 * - 금시세: 네이버 금융 스크래핑
 * - 해외 지수 (S&P 500, NASDAQ, Dow, Nikkei): Finnhub API
 * - 암호화폐 (BTC, ETH, XRP, ADA): Finnhub API
 */

// 캐시 설정 (5분)
let cachedData: EconomyData | null = null
let lastFetchTime: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5분

export async function GET() {
  try {
    const now = Date.now()

    // 캐시 확인
    if (cachedData && now - lastFetchTime < CACHE_DURATION) {
      console.log('[Economy API] Returning cached data')
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
      })
    }

    // 하이브리드 데이터 수집
    console.log(
      '[Economy API] Collecting fresh data (Naver Finance + Finnhub API)'
    )
    const data = await collectAllEconomyData()

    // 캐시 업데이트
    cachedData = data
    lastFetchTime = now

    return NextResponse.json({
      success: true,
      data,
      cached: false,
    })
  } catch (error) {
    console.error('Economy indicators error:', error)

    // 에러 발생 시 캐시된 데이터가 있으면 반환
    if (cachedData) {
      console.log('[Economy API] Error occurred, returning cached data')
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
        error: 'Failed to fetch economy indicators',
      },
      { status: 500 }
    )
  }
}
