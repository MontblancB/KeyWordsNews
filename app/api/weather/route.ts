import { NextResponse } from 'next/server'
import { scrapeNaverWeather } from '@/lib/scraper/naver-weather'
import type { WeatherData } from '@/types/weather'

// 캐시 설정 (10분)
let cachedData: WeatherData | null = null
let lastFetchTime = 0
const CACHE_DURATION = 10 * 60 * 1000 // 10분

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const forceRefresh = searchParams.get('force') === 'true'

    const now = Date.now()

    // 캐시 확인
    if (!forceRefresh && cachedData && now - lastFetchTime < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
      })
    }

    // 네이버 날씨 크롤링
    const weatherData = await scrapeNaverWeather('서울')

    // WeatherData 구성
    const data: WeatherData = {
      weather: weatherData,
      location: '서울',
      lastUpdated: new Date().toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }

    // 캐시 업데이트
    cachedData = data
    lastFetchTime = now

    return NextResponse.json({
      success: true,
      data,
      cached: false,
    })
  } catch (error) {
    console.error('Weather API error:', error)

    // 에러 발생 시 캐시된 데이터 반환
    if (cachedData) {
      return NextResponse.json({
        success: true,
        data: cachedData,
        cached: true,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
