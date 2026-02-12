import { NextResponse } from 'next/server'
import { type Prisma } from '@prisma/client'
import { fetchTrendingStocks, fetchFallbackFromPriceHistory } from '@/lib/api/krx'
import { prisma } from '@/lib/db/prisma'
import type { TrendingStocksData } from '@/types/trending-stock'

/**
 * 실시간 주목 종목 API
 *
 * 장중: 네이버에서 실시간 데이터 수집 → 인메모리 캐시 + DB 영속 캐시
 * 장외/주말: 인메모리 캐시 → DB 캐시 → 직전 거래일 종가 기준 반환
 */

const DB_CACHE_KEY = 'trending-stocks'

// 인메모리 캐시 (3분)
let cachedData: TrendingStocksData | null = null
let lastFetchTime: number = 0
const CACHE_DURATION = 3 * 60 * 1000

/**
 * DB에서 캐시된 주목 종목 데이터 로드
 */
async function loadFromDB(): Promise<TrendingStocksData | null> {
  try {
    const cached = await prisma.keywordMap.findUnique({
      where: { cacheKey: DB_CACHE_KEY },
    })
    if (!cached) return null
    return cached.data as unknown as TrendingStocksData
  } catch (error) {
    console.error('[Trending Stocks] DB read error:', error)
    return null
  }
}

/**
 * DB에 주목 종목 데이터 저장 (upsert)
 */
async function saveToDB(data: TrendingStocksData): Promise<void> {
  try {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 1주일

    await prisma.keywordMap.upsert({
      where: { cacheKey: DB_CACHE_KEY },
      update: {
        data: JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue,
        generatedAt: now,
        expiresAt,
      },
      create: {
        cacheKey: DB_CACHE_KEY,
        data: JSON.parse(JSON.stringify(data)) as Prisma.InputJsonValue,
        newsCount: 0,
        provider: 'naver',
        generatedAt: now,
        expiresAt,
      },
    })
  } catch (error) {
    console.error('[Trending Stocks] DB write error:', error)
  }
}

export async function GET(request: Request) {
  try {
    const now = Date.now()
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('force') === 'true'

    // 인메모리 캐시 유효 시 반환
    if (!forceRefresh && cachedData && now - lastFetchTime < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
        cacheAge: Math.floor((now - lastFetchTime) / 1000),
      })
    }

    // 실시간 데이터 수집 시도
    const freshData = await fetchTrendingStocks()

    if (freshData) {
      // 데이터 수집 성공 → 인메모리 + DB 캐시 갱신
      cachedData = freshData
      lastFetchTime = now

      // 유효한 데이터(장중/장 마감 직후)면 DB에 저장
      const hasData = freshData.volume.length > 0 || freshData.gainers.length > 0
      if (hasData) {
        saveToDB(freshData) // fire-and-forget
      }

      return NextResponse.json({
        success: true,
        data: freshData,
        cached: false,
      })
    }

    // 실시간 데이터 없음 (장외) → fallback으로 직전 거래일 데이터 수집
    console.log('[Trending Stocks] Off-hours, fetching fallback from price history')
    const fallbackData = await fetchFallbackFromPriceHistory()
    if (fallbackData) {
      cachedData = fallbackData
      lastFetchTime = now
      saveToDB(fallbackData) // fire-and-forget

      return NextResponse.json({
        success: true,
        data: fallbackData,
        cached: false,
        source: 'fallback',
      })
    }

    // fallback 실패 → 인메모리 캐시 확인
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: { ...cachedData, marketOpen: false },
        cached: true,
        source: 'memory',
      })
    }

    // 인메모리 캐시도 없음 → DB 캐시 확인
    console.log('[Trending Stocks] Fallback failed, loading from DB')
    const dbData = await loadFromDB()
    if (dbData) {
      cachedData = { ...dbData, marketOpen: false }
      lastFetchTime = now

      return NextResponse.json({
        success: true,
        data: { ...dbData, marketOpen: false },
        cached: true,
        source: 'database',
      })
    }

    // 모든 소스 실패 시 빈 데이터 반환
    return NextResponse.json({
      success: true,
      data: {
        volume: [],
        gainers: [],
        losers: [],
        marketOpen: false,
        tradingDate: '',
        lastUpdated: new Date().toISOString(),
      },
      cached: false,
      source: 'empty',
    })
  } catch (error) {
    console.error('Trending stocks error:', error)

    // 에러 시 인메모리 → DB 순으로 캐시 반환
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: { ...cachedData, marketOpen: false },
        cached: true,
      })
    }

    const dbData = await loadFromDB()
    if (dbData) {
      return NextResponse.json({
        success: true,
        data: { ...dbData, marketOpen: false },
        cached: true,
        source: 'database',
      })
    }

    // 에러 상태에서도 fallback 시도
    try {
      const fallbackData = await fetchFallbackFromPriceHistory()
      if (fallbackData) {
        return NextResponse.json({
          success: true,
          data: fallbackData,
          cached: false,
          source: 'fallback',
        })
      }
    } catch { /* fallback도 실패 */ }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch trending stocks' },
      { status: 500 }
    )
  }
}
