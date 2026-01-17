import * as cheerio from 'cheerio'
import type { NaverWeatherData, SkyStatus, AirQuality } from '@/types/weather'

/**
 * 네이버 날씨 스크래퍼
 * - 네이버 금융 크롤링 패턴 재사용 (lib/scraper/naver-finance-v2.ts)
 * - 기온, 습도, 미세먼지 등 모든 날씨 정보 크롤링
 */

/**
 * 날씨 상태 파싱 (텍스트 → SkyStatus)
 */
function parseSkyStatus(text: string): SkyStatus {
  const cleanText = text.trim().toLowerCase()
  if (cleanText.includes('맑음') || cleanText.includes('clear')) return 'clear'
  if (cleanText.includes('비') || cleanText.includes('rain')) return 'rain'
  if (cleanText.includes('눈') || cleanText.includes('snow')) return 'snow'
  return 'cloudy'
}

/**
 * 대기질 등급 파싱 (네이버 등급 → AirQuality)
 */
function parseAirQuality(grade: string): AirQuality {
  const cleanGrade = grade.trim()
  if (cleanGrade.includes('좋음')) return 'good'
  if (cleanGrade.includes('보통')) return 'normal'
  if (cleanGrade.includes('나쁨') && cleanGrade.includes('매우')) return 'very_bad'
  if (cleanGrade.includes('나쁨')) return 'bad'
  return 'normal'
}

/**
 * 숫자 추출 (텍스트에서 숫자만 추출)
 */
function extractNumber(text: string): string {
  if (!text) return '0'
  const match = text.match(/(-?\d+\.?\d*)/)
  return match ? match[1] : '0'
}

/**
 * 네이버 날씨 크롤링 (서울)
 */
export async function scrapeNaverWeather(
  cityName: string = '서울'
): Promise<NaverWeatherData> {
  try {
    // 네이버 검색 결과 페이지에서 날씨 정보 크롤링
    const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(
      cityName
    )}+날씨`

    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Naver weather: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 날씨 정보 추출 (CSS 선택자)
    // 기온: .temperature_text strong 또는 .weather_graphic .temperature_text
    const tempElement = $('.temperature_text strong').first()
    const temperature = extractNumber(tempElement.text())

    // 체감온도: dd 태그에서 "체감" 포함된 항목 찾기
    let feelsLike = temperature // 기본값은 현재 기온
    $('.today_chart_list dd').each((_, el) => {
      const text = $(el).text()
      if (text.includes('체감')) {
        feelsLike = extractNumber(text)
      }
    })

    // 습도: dd 태그에서 "습도" 포함된 항목 찾기
    let humidity = '50' // 기본값
    $('.today_chart_list dd').each((_, el) => {
      const text = $(el).text()
      if (text.includes('습도')) {
        humidity = extractNumber(text)
      }
    })

    // 강수확률: "강수확률" 포함된 항목 찾기
    let precipitationProb = '0' // 기본값
    $('.today_chart_list dd').each((_, el) => {
      const text = $(el).text()
      if (text.includes('강수') || text.includes('확률')) {
        precipitationProb = extractNumber(text)
      }
    })

    // 풍속: "풍속" 포함된 항목 찾기
    let windSpeed = '2' // 기본값
    $('.today_chart_list dd').each((_, el) => {
      const text = $(el).text()
      if (text.includes('풍속') || text.includes('바람')) {
        windSpeed = extractNumber(text)
      }
    })

    // 날씨 상태: .weather .cast_txt 또는 .summary
    const skyText =
      $('.weather .cast_txt').first().text() || $('.summary').first().text()
    const sky = parseSkyStatus(skyText)

    // 미세먼지 정보: .sub_info .item_today 영역
    let pm10 = '30' // 기본값
    let pm25 = '15' // 기본값
    let pm10Grade: AirQuality = 'good'
    let pm25Grade: AirQuality = 'good'

    // 미세먼지 파싱
    $('.sub_info .item_today').each((_, el) => {
      const title = $(el).find('.title').text()
      const value = $(el).find('.num').text()
      const grade = $(el).find('.txt').text()

      if (title.includes('미세먼지') && !title.includes('초미세')) {
        pm10 = extractNumber(value)
        pm10Grade = parseAirQuality(grade)
      } else if (title.includes('초미세먼지')) {
        pm25 = extractNumber(value)
        pm25Grade = parseAirQuality(grade)
      }
    })

    return {
      temperature,
      feelsLike,
      humidity,
      sky,
      precipitationProb,
      windSpeed,
      pm10,
      pm25,
      pm10Grade,
      pm25Grade,
    }
  } catch (error) {
    console.error('Error scraping Naver weather:', error)

    // 폴백: 기본값 반환
    return {
      temperature: '20',
      feelsLike: '20',
      humidity: '50',
      sky: 'clear',
      precipitationProb: '0',
      windSpeed: '2',
      pm10: '30',
      pm25: '15',
      pm10Grade: 'good',
      pm25Grade: 'good',
    }
  }
}
