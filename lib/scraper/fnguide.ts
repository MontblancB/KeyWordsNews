import * as cheerio from 'cheerio'
import type { FinancialData, CompanyInfo, InvestmentIndicators } from '@/types/stock'

/**
 * FnGuide 재무제표 스크래퍼
 */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * 숫자 정리 (쉼표 제거, 단위 처리)
 */
function cleanValue(text: string): string {
  return text.replace(/,/g, '').trim() || '-'
}

/**
 * 재무제표 스크래핑 (FnGuide)
 */
export async function scrapeFinancials(code: string): Promise<FinancialData[]> {
  try {
    // FnGuide 기업 페이지
    const url = `https://comp.fnguide.com/SVO2/ASP/SVD_Main.asp?gicode=A${code}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch FnGuide: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const financials: FinancialData[] = []

    // 연간 재무제표 테이블 파싱
    // FnGuide의 SVD_Main 페이지에서 재무 하이라이트 테이블
    const tables = $('table.us_table_ty1')

    // 첫 번째 테이블이 재무 하이라이트
    const financialTable = tables.first()

    if (financialTable.length === 0) {
      // 테이블이 없으면 빈 배열 반환
      return []
    }

    // 헤더에서 기간 정보 추출
    const headers: string[] = []
    financialTable.find('thead th').each((i, th) => {
      if (i > 0) {
        // 첫 번째 열은 항목명
        headers.push($(th).text().trim())
      }
    })

    // 데이터 행 파싱
    const rows: { [key: string]: string[] } = {}
    financialTable.find('tbody tr').each((_, tr) => {
      const cells = $(tr).find('td')
      const rowName = cells.first().text().trim()
      const values: string[] = []

      cells.each((i, td) => {
        if (i > 0) {
          values.push($(td).text().trim())
        }
      })

      if (rowName && values.length > 0) {
        rows[rowName] = values
      }
    })

    // 재무 데이터 구성
    for (let i = 0; i < Math.min(headers.length, 4); i++) {
      const period = headers[i] || ''
      const isQuarterly = period.includes('Q') || period.includes('분기')

      const financial: FinancialData = {
        period,
        periodType: isQuarterly ? 'quarterly' : 'annual',
        revenue: rows['매출액']?.[i] || rows['영업수익']?.[i] || '-',
        operatingProfit: rows['영업이익']?.[i] || '-',
        netIncome: rows['당기순이익']?.[i] || rows['순이익']?.[i] || '-',
        operatingMargin: rows['영업이익률']?.[i] || '-',
        netMargin: rows['순이익률']?.[i] || '-',
        // 추가 재무 지표
        totalAssets: rows['자산총계']?.[i] || rows['자산']?.[i] || '-',
        totalLiabilities: rows['부채총계']?.[i] || rows['부채']?.[i] || '-',
        totalEquity: rows['자본총계']?.[i] || rows['자본']?.[i] || '-',
        debtRatio: rows['부채비율']?.[i] || '-',
      }

      // 값 정리
      financial.revenue = cleanValue(financial.revenue)
      financial.operatingProfit = cleanValue(financial.operatingProfit)
      financial.netIncome = cleanValue(financial.netIncome)
      financial.operatingMargin = cleanValue(financial.operatingMargin)
      financial.netMargin = cleanValue(financial.netMargin)
      financial.totalAssets = cleanValue(financial.totalAssets)
      financial.totalLiabilities = cleanValue(financial.totalLiabilities)
      financial.totalEquity = cleanValue(financial.totalEquity)
      financial.debtRatio = cleanValue(financial.debtRatio)

      financials.push(financial)
    }

    return financials
  } catch (error) {
    console.error('FnGuide financials scraping error:', error)
    return []
  }
}

/**
 * 투자 지표 스크래핑 (FnGuide)
 */
export async function scrapeFnGuideIndicators(
  code: string
): Promise<Partial<InvestmentIndicators>> {
  try {
    const url = `https://comp.fnguide.com/SVO2/ASP/SVD_Main.asp?gicode=A${code}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch FnGuide: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const indicators: Partial<InvestmentIndicators> = {}

    // 투자지표 섹션에서 PER, PBR, ROE 등 추출
    $('table').each((_, table) => {
      $(table)
        .find('tr')
        .each((_, tr) => {
          const cells = $(tr).find('td, th')
          cells.each((i, cell) => {
            const text = $(cell).text().trim()
            const nextValue = $(cells[i + 1])
              .text()
              .trim()

            if (text === 'PER' || text.includes('PER(배)')) {
              indicators.per = cleanValue(nextValue) || indicators.per
            }
            if (text === 'PBR' || text.includes('PBR(배)')) {
              indicators.pbr = cleanValue(nextValue) || indicators.pbr
            }
            if (text === 'ROE' || text.includes('ROE(%)')) {
              indicators.roe = cleanValue(nextValue) || indicators.roe
            }
            if (text === 'EPS' || text.includes('EPS(원)')) {
              indicators.eps = cleanValue(nextValue) || indicators.eps
            }
            if (text === 'BPS' || text.includes('BPS(원)')) {
              indicators.bps = cleanValue(nextValue) || indicators.bps
            }
            if (text.includes('배당수익률') || text.includes('배당률')) {
              indicators.dividendYield = cleanValue(nextValue) || indicators.dividendYield
            }
            // 추가 지표
            if (text === 'PSR' || text.includes('PSR(배)')) {
              indicators.psr = cleanValue(nextValue) || indicators.psr
            }
            if (text === 'DPS' || text.includes('DPS(원)') || text.includes('주당배당금')) {
              indicators.dps = cleanValue(nextValue) || indicators.dps
            }
            if (text.includes('52주') && text.includes('최고')) {
              indicators.week52High = cleanValue(nextValue) || indicators.week52High
            }
            if (text.includes('52주') && text.includes('최저')) {
              indicators.week52Low = cleanValue(nextValue) || indicators.week52Low
            }
          })
        })
    })

    return indicators
  } catch (error) {
    console.error('FnGuide indicators scraping error:', error)
    return {}
  }
}

/**
 * 기업 상세 정보 스크래핑 (FnGuide)
 */
export async function scrapeFnGuideCompanyInfo(
  code: string
): Promise<Partial<CompanyInfo>> {
  try {
    const url = `https://comp.fnguide.com/SVO2/ASP/SVD_Main.asp?gicode=A${code}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch FnGuide: ${response.statusText}`)
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    const companyInfo: Partial<CompanyInfo> = {}

    // 기업 개요 섹션에서 정보 추출
    $('table').each((_, table) => {
      $(table)
        .find('tr')
        .each((_, tr) => {
          const th = $(tr).find('th').text().trim()
          const td = $(tr).find('td').first().text().trim()

          if (th.includes('대표자') || th.includes('CEO')) {
            companyInfo.ceo = td
          }
          if (th.includes('설립일')) {
            companyInfo.establishedDate = td
          }
          if (th.includes('결산월') || th.includes('결산')) {
            companyInfo.fiscalMonth = td
          }
          if (th.includes('직원') || th.includes('종업원')) {
            companyInfo.employees = td
          }
          if (th.includes('업종')) {
            companyInfo.industry = td
          }
          if (th.includes('홈페이지') || th.includes('웹사이트')) {
            companyInfo.website = td
          }
          // 추가 정보
          if (th.includes('액면가')) {
            companyInfo.faceValue = td
          }
          if (th.includes('상장일')) {
            companyInfo.listedDate = td
          }
          if (th.includes('상장주식') || th.includes('발행주식')) {
            companyInfo.listedShares = td
          }
          if (th.includes('외국인') || th.includes('외인')) {
            companyInfo.foreignOwnership = td
          }
          if (th.includes('자본금')) {
            companyInfo.capital = td
          }
        })
    })

    return companyInfo
  } catch (error) {
    console.error('FnGuide company info scraping error:', error)
    return {}
  }
}
