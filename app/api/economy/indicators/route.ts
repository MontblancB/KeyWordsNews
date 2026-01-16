import { NextResponse } from 'next/server'
import { scrapeAllIndicators } from '@/lib/scraper/naver-finance'
import type { EconomyData } from '@/types/economy'

/**
 * 경제 지표 API
 * 네이버 금융에서 실시간 경제 지표를 스크래핑하여 반환
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

    // 실시간 스크래핑
    console.log('[Economy API] Scraping fresh data from Naver Finance')
    const data = await scrapeAllIndicators()

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
