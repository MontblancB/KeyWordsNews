/**
 * 날씨 데이터 타입 정의 (네이버 날씨 크롤링)
 */

// 날씨 상태 타입
export type SkyStatus = 'clear' | 'cloudy' | 'rain' | 'snow'
export type AirQuality = 'good' | 'normal' | 'bad' | 'very_bad'
export type UVLevel = 'low' | 'moderate' | 'high' | 'very_high'

// 자외선 정보
export interface UV {
  index: string
  level: UVLevel
}

// 일출/일몰
export interface SunriseSunset {
  sunrise: string // "06:30"
  sunset: string // "17:45"
}

// 오존 정보
export interface Ozone {
  value: string // "0.045"
  level: AirQuality
}

// 네이버 날씨 크롤링 데이터
export interface NaverWeatherData {
  temperature: string // 현재 기온 (°C)
  feelsLike: string // 체감온도 (°C)
  humidity: string // 습도 (%)
  sky: SkyStatus // 날씨 상태
  precipitationProb: string // 강수확률 (%)
  windSpeed: string // 풍속 (m/s)

  // 대기질
  pm10: string // 미세먼지 (µg/m³)
  pm25: string // 초미세먼지 (µg/m³)
  pm10Grade: AirQuality // 미세먼지 등급
  pm25Grade: AirQuality // 초미세먼지 등급

  // 추가 정보 (선택적)
  uv?: UV // 자외선 지수
  sunriseSunset?: SunriseSunset // 일출/일몰 시간
  ozone?: Ozone // 오존 농도
  dust?: {
    // 황사 정보
    detected: boolean
    level?: string
  }
}

// API 응답 타입
export interface WeatherData {
  weather: NaverWeatherData
  location: string // 지역명 (예: 서울)
  lastUpdated: string // 마지막 업데이트 시간 (KST)
}
