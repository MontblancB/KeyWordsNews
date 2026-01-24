/**
 * 네이버 금융 투자지표 스크래퍼
 * ROE, ROA, 유동비율, 당좌비율, 베타 등 고급 투자지표 수집
 */

import * as cheerio from 'cheerio'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface AdvancedIndicators {
  roe?: string // 자기자본이익률
  roa?: string // 총자산이익률
  currentRatio?: string // 유동비율
  quickRatio?: string // 당좌비율
  beta?: string // 베타
  psr?: string // 주가매출비율
}

/**
 * 네이버 금융 투자지표 스크래핑
 */
export async function scrapeAdvancedIndicators(
  stockCode: string
): Promise<AdvancedIndicators> {
  try {
    const url = `https://finance.naver.com/item/main.naver?code=${stockCode}`

    console.log(`[투자지표] 스크래핑 시작: ${stockCode}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP 오류: ${response.status}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const indicators: AdvancedIndicators = {}

    // 1. ROE (자기자본이익률) - 테이블에서 추출
    // ROE는 여러 곳에 있을 수 있으므로 가장 최근 값 추출
    $('.cop_analysis table tbody tr').each((_, row) => {
      const th = $(row).find('th').text().trim()

      if (th.includes('ROE') && !indicators.roe) {
        // 첫 번째 td 값 (가장 최근)
        const value = $(row).find('td').first().text().trim()
        if (value && value !== '-' && value !== 'N/A') {
          indicators.roe = value
        }
      }
    })

    // 2. 재무비율 테이블에서 유동비율, 당좌비율 추출
    $('.section.cop_analysis table tbody tr').each((_, row) => {
      const th = $(row).find('th').text().trim()

      if (th.includes('당좌비율') && !indicators.quickRatio) {
        const value = $(row).find('td').first().text().trim()
        if (value && value !== '-' && value !== 'N/A') {
          indicators.quickRatio = value
        }
      }

      if (th.includes('유동비율') && !indicators.currentRatio) {
        const value = $(row).find('td').first().text().trim()
        if (value && value !== '-' && value !== 'N/A') {
          indicators.currentRatio = value
        }
      }
    })

    // 3. ROA - 다른 테이블에 있을 수 있음
    $('table tbody tr').each((_, row) => {
      const th = $(row).find('th').text().trim()

      if ((th.includes('ROA') || th.includes('총자산이익률')) && !indicators.roa) {
        const value = $(row).find('td').first().text().trim()
        if (value && value !== '-' && value !== 'N/A') {
          indicators.roa = value
        }
      }
    })

    // 4. PSR (주가매출비율)
    $('.per_table table tbody tr, .cop_analysis table tbody tr').each((_, row) => {
      const th = $(row).find('th').text().trim()

      if ((th.includes('PSR') || th.includes('주가매출')) && !indicators.psr) {
        const value = $(row).find('td').first().text().trim()
        if (value && value !== '-' && value !== 'N/A') {
          indicators.psr = value
        }
      }
    })

    // 5. 베타 - HTS 정보에 있을 수 있음
    $('.per_table table tbody tr, .cop_analysis table tbody tr, table tbody tr').each(
      (_, row) => {
        const th = $(row).find('th').text().trim()

        if (th.includes('베타') && !indicators.beta) {
          const value = $(row).find('td').first().text().trim()
          if (value && value !== '-' && value !== 'N/A') {
            indicators.beta = value
          }
        }
      }
    )

    // 로그 출력
    const collectedCount = Object.keys(indicators).length
    console.log(
      `[투자지표] 스크래핑 완료: ${stockCode} - ${collectedCount}개 수집`,
      indicators
    )

    return indicators
  } catch (error) {
    console.error(`[투자지표] 스크래핑 실패: ${stockCode}`, error)
    return {}
  }
}
