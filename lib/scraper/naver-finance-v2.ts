import * as cheerio from 'cheerio'
import type { Indicator, ChangeType, EconomyData } from '@/types/economy'

/**
 * 네이버 금융 스크래퍼 V2 (개선 버전)
 * 실제 HTML 구조에 맞춰 정확하게 데이터 수집
 */

/**
 * 변동 타입 판단 (class 기반)
 */
function getChangeTypeFromClass(className: string | undefined): ChangeType {
  if (!className) return 'unchanged'

  if (className.includes('up') || className.includes('ris')) {
    return 'up'
  } else if (className.includes('down') || className.includes('fal')) {
    return 'down'
  }
  return 'unchanged'
}

/**
 * 텍스트에서 변동률 추출 (+0.90% → +0.90)
 */
function extractChangePercent(text: string): string {
  const match = text.match(/([+-]?\d+\.?\d*)%/)
  return match ? match[1] : '0'
}

/**
 * 국내 지수 (KOSPI, KOSDAQ) 스크래핑 V2
 */
export async function scrapeDomesticIndexV2(
  code: 'KOSPI' | 'KOSDAQ'
): Promise<Indicator> {
  try {
    const url = `https://finance.naver.com/sise/sise_index.naver?code=${code}`
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch ${code}: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 현재가
    const value = $('#now_value').text().trim()

    // 변동 정보 영역
    const changeArea = $('#change_value_and_rate')
    const changeText = changeArea.text().trim()

    // 변동값과 변동률 추출
    const parts = changeText.split('\n').map((s) => s.trim()).filter(Boolean)
    const change = parts[0] || '0'
    const changePercent = extractChangePercent(changeText)

    // 변동 타입 - 부모 요소의 class 확인
    const parentClass = changeArea.parent().attr('class') || ''
    const changeType = getChangeTypeFromClass(parentClass)

    return {
      name: code,
      value: value || '0',
      change,
      changePercent,
      changeType,
    }
  } catch (error) {
    console.error(`Error scraping ${code}:`, error)
    return {
      name: code,
      value: '데이터 없음',
      change: '0',
      changePercent: '0',
      changeType: 'unchanged',
    }
  }
}

/**
 * 환율 스크래핑 V2
 */
export async function scrapeExchangeV2(): Promise<{
  usdKrw: Indicator
  jpyKrw: Indicator
  eurKrw: Indicator
  cnyKrw: Indicator
}> {
  try {
    const url = 'https://finance.naver.com/marketindex/'
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 환율 데이터 추출 함수 (개선 버전)
    const parseExchangeData = (index: number, name: string): Indicator => {
      const li = $('.market1 .data_lst li').eq(index)

      // 값, 변동값 추출
      const valueText = li.find('.value').text().trim()
      const changeText = li.find('.change').text().trim()

      // 숫자로 변환 (콤마 제거)
      const value = parseFloat(valueText.replace(/,/g, ''))
      const change = parseFloat(changeText.replace(/,/g, ''))

      // 변동률 계산 (네이버 금융 환율 페이지에는 변동률이 없음)
      let changePercent = '0'
      if (!isNaN(value) && !isNaN(change) && value > 0) {
        const previousValue = value - change
        if (previousValue !== 0) {
          const percent = (change / previousValue) * 100
          changePercent = percent.toFixed(2)
        }
      }

      // 변동 타입 - div.head_info의 class 확인
      const headInfoClass = li.find('.head_info').attr('class') || ''
      const changeType = getChangeTypeFromClass(headInfoClass)

      return {
        name,
        value: valueText || '0',
        change: changeText || '0',
        changePercent,
        changeType,
      }
    }

    return {
      usdKrw: parseExchangeData(0, 'USD/KRW'),
      jpyKrw: parseExchangeData(1, 'JPY(100)/KRW'),
      eurKrw: parseExchangeData(2, 'EUR/KRW'),
      cnyKrw: parseExchangeData(3, 'CNY/KRW'),
    }
  } catch (error) {
    console.error('Error scraping exchange rates:', error)
    const fallback: Indicator = {
      name: '',
      value: '데이터 없음',
      change: '0',
      changePercent: '0',
      changeType: 'unchanged',
    }
    return {
      usdKrw: { ...fallback, name: 'USD/KRW' },
      jpyKrw: { ...fallback, name: 'JPY(100)/KRW' },
      eurKrw: { ...fallback, name: 'EUR/KRW' },
      cnyKrw: { ...fallback, name: 'CNY/KRW' },
    }
  }
}

/**
 * 해외 지수 스크래핑 V2
 * 네이버 금융의 해외지수 페이지는 JS로 동적 로딩됨
 * 대안: investing.com이나 다른 소스 활용
 */
export async function scrapeInternationalIndicesV2(): Promise<{
  sp500: Indicator
  nasdaq: Indicator
  dow: Indicator
  nikkei: Indicator
}> {
  try {
    // 네이버 금융 해외지수 페이지 시도
    const url = 'https://finance.naver.com/world/sise.naver?symbol=SPI@SPX'
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    const html = await response.text()
    const $ = cheerio.load(html)

    // 네이버 금융 해외지수 개별 페이지에서 데이터 추출
    const value = $('.rate_info .blind').eq(0).text().trim() ||
      $('#now_value').text().trim()

    // 간단한 구현 - 실제로는 각 지수별로 개별 요청 필요
    console.log('해외 지수는 개별 페이지 크롤링 필요')

    // Fallback: 데이터 없음 반환
    const fallback: Indicator = {
      name: '',
      value: '데이터 없음',
      change: '0',
      changePercent: '0',
      changeType: 'unchanged',
    }

    return {
      sp500: { ...fallback, name: 'S&P 500' },
      nasdaq: { ...fallback, name: 'NASDAQ' },
      dow: { ...fallback, name: 'Dow Jones' },
      nikkei: { ...fallback, name: 'Nikkei 225' },
    }
  } catch (error) {
    console.error('Error scraping international indices:', error)
    const fallback: Indicator = {
      name: '',
      value: '데이터 없음',
      change: '0',
      changePercent: '0',
      changeType: 'unchanged',
    }
    return {
      sp500: { ...fallback, name: 'S&P 500' },
      nasdaq: { ...fallback, name: 'NASDAQ' },
      dow: { ...fallback, name: 'Dow Jones' },
      nikkei: { ...fallback, name: 'Nikkei 225' },
    }
  }
}

/**
 * 금시세 스크래핑 V2
 * span으로 분리된 개별 숫자 조합
 */
export async function scrapeGoldPriceV2(): Promise<Indicator> {
  try {
    const url = 'https://finance.naver.com/marketindex/goldDetail.naver'
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch gold price: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 현재가 - em 내부의 텍스트만 추출 (숫자 span들)
    const priceEm = $('.no_today em')
    const priceText = priceEm.text().trim()

    // 변동값
    const changeEm = $('.no_exday em').first()
    const changeText = changeEm.text().trim()

    // 변동률
    const changePercentEm = $('.no_exday em').eq(1)
    const changePercentText = changePercentEm.text().trim()
    const changePercent = extractChangePercent(changePercentText)

    // 변동 타입
    const emClass = priceEm.attr('class') || ''
    const changeType = getChangeTypeFromClass(emClass)

    return {
      name: '국제 금',
      value: priceText ? `${priceText}원/g` : '데이터 없음',
      change: changeText || '0',
      changePercent,
      changeType,
    }
  } catch (error) {
    console.error('Error scraping gold price:', error)
    return {
      name: '국제 금',
      value: '데이터 없음',
      change: '0',
      changePercent: '0',
      changeType: 'unchanged',
    }
  }
}

/**
 * 모든 경제 지표 스크래핑 V2 (병렬 처리)
 */
export async function scrapeAllIndicatorsV2(): Promise<EconomyData> {
  const [kospi, kosdaq, exchange, gold] = await Promise.all([
    scrapeDomesticIndexV2('KOSPI'),
    scrapeDomesticIndexV2('KOSDAQ'),
    scrapeExchangeV2(),
    scrapeGoldPriceV2(),
  ])

  // 해외 지수는 별도 처리 (느림)
  const international = await scrapeInternationalIndicesV2()

  // 빈 crypto 데이터 (V2는 크립토를 지원하지 않음)
  const fallbackIndicator: Indicator = {
    name: '',
    value: '데이터 없음',
    change: '0',
    changePercent: '0',
    changeType: 'unchanged',
  }

  return {
    domestic: {
      kospi,
      kosdaq,
    },
    international,
    exchange,
    gold: {
      international: gold,
    },
    crypto: {
      bitcoin: { ...fallbackIndicator, name: 'Bitcoin (BTC)' },
      ethereum: { ...fallbackIndicator, name: 'Ethereum (ETH)' },
      ripple: { ...fallbackIndicator, name: 'Ripple (XRP)' },
      cardano: { ...fallbackIndicator, name: 'Cardano (ADA)' },
    },
    lastUpdated: new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}
