import * as cheerio from 'cheerio'
import type { Indicator, ChangeType } from '@/types/economy'

/**
 * 네이버 금융 스크래퍼
 * 실시간 경제 지표 데이터 수집
 */

interface ScrapeResult {
  value: string
  change: string
  changePercent: string
  changeType: ChangeType
}

/**
 * HTML에서 숫자 추출 및 포맷팅
 */
function parseNumber(text: string): string {
  const cleaned = text.replace(/[^\d.,+-]/g, '').trim()
  return cleaned || '0'
}

/**
 * 변동 타입 판단
 */
function getChangeType(changeText: string): ChangeType {
  if (changeText.includes('+') || changeText.includes('상승')) {
    return 'up'
  } else if (changeText.includes('-') || changeText.includes('하락')) {
    return 'down'
  }
  return 'unchanged'
}

/**
 * 국내 지수 (KOSPI, KOSDAQ) 스크래핑
 */
export async function scrapeDomesticIndex(
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

    // 전일대비 (변동값)
    const changeElement = $('#change_value_and_rate')
    const changeText = changeElement.text().trim()
    const [change, changePercent] = changeText.split('\n').map((s) => s.trim())

    // 변동 타입
    const changeType = getChangeType(changeElement.attr('class') || '')

    return {
      name: code,
      value: value || '0',
      change: change || '0',
      changePercent: changePercent?.replace(/[()]/g, '') || '0',
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
 * 환율 스크래핑
 */
export async function scrapeExchange(): Promise<{
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

    // 환율 데이터 추출 함수
    const parseExchangeData = (
      selector: string,
      name: string
    ): Indicator => {
      const element = $(selector)
      const value = element.find('.value').text().trim()
      const change = element.find('.change').text().trim()
      const changePercent = element.find('.ratio').text().trim()

      const changeType: ChangeType = element.hasClass('up')
        ? 'up'
        : element.hasClass('down')
          ? 'down'
          : 'unchanged'

      return {
        name,
        value: value || '0',
        change: change || '0',
        changePercent: changePercent || '0',
        changeType,
      }
    }

    return {
      usdKrw: parseExchangeData('.market1 .data_lst li:nth-child(1)', 'USD/KRW'),
      jpyKrw: parseExchangeData(
        '.market1 .data_lst li:nth-child(2)',
        'JPY(100)/KRW'
      ),
      eurKrw: parseExchangeData('.market1 .data_lst li:nth-child(3)', 'EUR/KRW'),
      cnyKrw: parseExchangeData('.market1 .data_lst li:nth-child(4)', 'CNY/KRW'),
    }
  } catch (error) {
    console.error('Error scraping exchange rates:', error)
    return {
      usdKrw: {
        name: 'USD/KRW',
        value: '데이터 없음',
        change: '0',
        changePercent: '0',
        changeType: 'unchanged',
      },
      jpyKrw: {
        name: 'JPY(100)/KRW',
        value: '데이터 없음',
        change: '0',
        changePercent: '0',
        changeType: 'unchanged',
      },
      eurKrw: {
        name: 'EUR/KRW',
        value: '데이터 없음',
        change: '0',
        changePercent: '0',
        changeType: 'unchanged',
      },
      cnyKrw: {
        name: 'CNY/KRW',
        value: '데이터 없음',
        change: '0',
        changePercent: '0',
        changeType: 'unchanged',
      },
    }
  }
}

/**
 * 해외 지수 스크래핑
 */
export async function scrapeInternationalIndices(): Promise<{
  sp500: Indicator
  nasdaq: Indicator
  dow: Indicator
  nikkei: Indicator
}> {
  try {
    const url = 'https://finance.naver.com/world/'
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(
        `Failed to fetch international indices: ${response.statusText}`
      )
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // 해외 지수 데이터 추출 함수
    const parseIndexData = (selector: string, name: string): Indicator => {
      const element = $(selector)
      const value = element.find('.point_status .num').first().text().trim()
      const change = element.find('.point_status .num').eq(1).text().trim()
      const changePercent = element.find('.point_status .num').eq(2).text().trim()

      const changeType: ChangeType = element.find('.point_status').hasClass('up')
        ? 'up'
        : element.find('.point_status').hasClass('down')
          ? 'down'
          : 'unchanged'

      return {
        name,
        value: value || '0',
        change: change || '0',
        changePercent: changePercent || '0',
        changeType,
      }
    }

    return {
      dow: parseIndexData('.tb_data tbody tr:nth-child(1)', 'Dow Jones'),
      nasdaq: parseIndexData('.tb_data tbody tr:nth-child(2)', 'NASDAQ'),
      sp500: parseIndexData('.tb_data tbody tr:nth-child(3)', 'S&P 500'),
      nikkei: parseIndexData('.tb_data tbody tr:nth-child(7)', 'Nikkei 225'),
    }
  } catch (error) {
    console.error('Error scraping international indices:', error)
    return {
      sp500: {
        name: 'S&P 500',
        value: '데이터 없음',
        change: '0',
        changePercent: '0',
        changeType: 'unchanged',
      },
      nasdaq: {
        name: 'NASDAQ',
        value: '데이터 없음',
        change: '0',
        changePercent: '0',
        changeType: 'unchanged',
      },
      dow: {
        name: 'Dow Jones',
        value: '데이터 없음',
        change: '0',
        changePercent: '0',
        changeType: 'unchanged',
      },
      nikkei: {
        name: 'Nikkei 225',
        value: '데이터 없음',
        change: '0',
        changePercent: '0',
        changeType: 'unchanged',
      },
    }
  }
}

/**
 * 금시세 스크래핑
 */
export async function scrapeGoldPrice(): Promise<Indicator> {
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

    // 금시세 데이터 추출
    const value = $('.spot .value').text().trim()
    const change = $('.spot .change').text().trim()
    const changePercent = $('.spot .ratio').text().trim()

    const changeType: ChangeType = $('.spot').hasClass('up')
      ? 'up'
      : $('.spot').hasClass('down')
        ? 'down'
        : 'unchanged'

    return {
      name: '국제 금',
      value: value ? `$${value}` : '데이터 없음',
      change: change || '0',
      changePercent: changePercent || '0',
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
 * 모든 경제 지표 스크래핑 (병렬 처리)
 */
export async function scrapeAllIndicators() {
  const [kospi, kosdaq, exchange, international, gold] = await Promise.all([
    scrapeDomesticIndex('KOSPI'),
    scrapeDomesticIndex('KOSDAQ'),
    scrapeExchange(),
    scrapeInternationalIndices(),
    scrapeGoldPrice(),
  ])

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
    lastUpdated: new Date().toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
  }
}
