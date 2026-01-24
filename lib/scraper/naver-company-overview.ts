/**
 * 네이버 금융 기업개요 스크래퍼
 * 직원수, 주요사업, 대표제품 수집
 */

import * as cheerio from 'cheerio'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

interface CompanyOverview {
  employees?: string // 직원수
  businessDescription?: string // 주요사업
  mainProducts?: string // 대표제품
}

/**
 * 네이버 금융 기업개요 스크래핑
 */
export async function scrapeCompanyOverview(
  stockCode: string
): Promise<CompanyOverview> {
  try {
    const url = `https://finance.naver.com/item/coinfo.naver?code=${stockCode}`

    console.log(`[기업개요] 스크래핑 시작: ${stockCode}`)

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

    const overview: CompanyOverview = {}

    // 1. 직원수 - 테이블에서 추출
    $('.tb_type1 table tbody tr, table tbody tr').each((_, row) => {
      const th = $(row).find('th').text().trim()
      const td = $(row).find('td').text().trim()

      // 직원수
      if ((th.includes('직원수') || th.includes('종업원수')) && !overview.employees) {
        if (td && td !== '-') {
          overview.employees = td
        }
      }
    })

    // 2. 사업내용 - "사업내용" 섹션에서 추출
    $('.section_business .txt_summary, .txt_summary, .bsn_txt').each((_, elem) => {
      const text = $(elem).text().trim()
      if (text && text.length > 10 && !overview.businessDescription) {
        overview.businessDescription = text
      }
    })

    // 사업내용이 없으면 다른 방법으로 시도
    if (!overview.businessDescription) {
      $('table tbody tr').each((_, row) => {
        const th = $(row).find('th').text().trim()
        const td = $(row).find('td').text().trim()

        if ((th.includes('사업내용') || th.includes('주요사업')) && !overview.businessDescription) {
          if (td && td.length > 10) {
            overview.businessDescription = td
          }
        }
      })
    }

    // 3. 대표제품 - 테이블에서 추출
    $('table tbody tr').each((_, row) => {
      const th = $(row).find('th').text().trim()
      const td = $(row).find('td').text().trim()

      if ((th.includes('주요제품') || th.includes('대표제품')) && !overview.mainProducts) {
        if (td && td !== '-') {
          overview.mainProducts = td
        }
      }
    })

    // 로그 출력
    const collectedCount = Object.keys(overview).length
    console.log(
      `[기업개요] 스크래핑 완료: ${stockCode} - ${collectedCount}개 수집`,
      overview
    )

    return overview
  } catch (error) {
    console.error(`[기업개요] 스크래핑 실패: ${stockCode}`, error)
    return {}
  }
}
