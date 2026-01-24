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

    if (tables.length === 0) {
      // 테이블이 없으면 빈 배열 반환
      return []
    }

    // 재무제표 테이블 찾기 (IFRS(연결) Annual 헤더가 있는 테이블 중 연도별 데이터가 있는 것)
    let financialTable: any = null
    tables.each((i: number, table: any) => {
      const $table = $(table)
      const headers = $table.find('thead th, thead td').map((_: number, th: any) => $(th).text().trim()).get()
      const headersText = headers.join(' ')

      // "IFRS(연결)" + "Annual" 포함하고, "Net Quarter"가 없는 테이블 찾기 (연간 데이터만)
      if (headersText.includes('IFRS') && headersText.includes('Annual') && !headersText.includes('Net Quarter')) {
        financialTable = $table
        return false // 루프 중단
      }
    })

    if (!financialTable || financialTable.length === 0) {
      // 재무제표 테이블을 찾을 수 없으면 빈 배열 반환
      return []
    }

    // 헤더에서 기간 정보 추출
    // FnGuide 헤더 구조: IFRS(연결) | Annual | Net Quarter | 2022/12 | 2023/12 | 2024/12 | ...
    const headers: string[] = []
    financialTable.find('thead th, thead td').each((i: number, th: any) => {
      headers.push($(th).text().trim())
    })

    // 데이터 행 파싱
    const rows: { [key: string]: string[] } = {}
    financialTable.find('tbody tr').each((_: number, tr: any) => {
      const cells = $(tr).find('td, th')
      const rowName = cells.first().text().trim()
      const values: string[] = []

      cells.each((i: number, td: any) => {
        if (i > 0) {
          values.push($(td).text().trim())
        }
      })

      if (rowName && values.length > 0) {
        rows[rowName] = values
      }
    })

    // 재무 데이터 구성
    // 테이블 11 (연간 전용): 헤더[0] = IFRS(연결), 헤더[1] = Annual, 헤더[2] = 2020/12, 헤더[3] = 2021/12, ...
    // values[0] = Annual 값, values[1] = 2020/12 값, values[2] = 2021/12 값, ...
    // 연도별 데이터는 values[1]부터 시작 (헤더[2]부터)
    for (let i = 2; i < Math.min(headers.length, 10); i++) {
      let period = headers[i] || ''

      // 추정치(Estimate) 제외, 잠정실적(Provisional)은 포함
      if (!period || period.includes('Estimate') || period.includes('추정') || period.includes('컨센서스')) {
        continue
      }

      // 헤더에서 연도 정보 추출 (예: "2025/12(P)" 또는 "(P) : Provisional\n잠정실적\n\n2025/12(P)")
      const yearMatch = period.match(/(\d{4}\/\d{2})/)
      if (!yearMatch) {
        continue // 연도 정보가 없으면 스킵
      }
      period = yearMatch[1] // "2025/12" 형태로 정규화

      // 연간 테이블이므로 모두 annual
      const isQuarterly = false
      const valueIndex = i - 1 // 헤더 인덱스 2 = values 인덱스 1

      const financial: FinancialData = {
        period,
        periodType: isQuarterly ? 'quarterly' : 'annual',
        revenue: rows['매출액']?.[valueIndex] || rows['영업수익']?.[valueIndex] || '-',
        costOfRevenue: rows['매출원가']?.[valueIndex] || '-',
        grossProfit: rows['매출총이익']?.[valueIndex] || '-',
        grossMargin: rows['매출총이익률']?.[valueIndex] || '-',
        operatingProfit: rows['영업이익']?.[valueIndex] || '-',
        operatingMargin: rows['영업이익률']?.[valueIndex] || '-',
        netIncome: rows['당기순이익']?.[valueIndex] || rows['순이익']?.[valueIndex] || '-',
        netMargin: rows['순이익률']?.[valueIndex] || '-',
        ebitda: rows['EBITDA']?.[valueIndex] || '-',
        // 추가 재무 지표
        totalAssets: rows['자산총계']?.[valueIndex] || rows['자산']?.[valueIndex] || '-',
        totalLiabilities: rows['부채총계']?.[valueIndex] || rows['부채']?.[valueIndex] || '-',
        totalEquity: rows['자본총계']?.[valueIndex] || rows['자본']?.[valueIndex] || '-',
        debtRatio: rows['부채비율']?.[valueIndex] || '-',
        operatingCashFlow: rows['영업활동현금흐름']?.[valueIndex] || rows['영업현금흐름']?.[valueIndex] || '-',
        freeCashFlow: rows['잉여현금흐름']?.[valueIndex] || rows['FCF']?.[valueIndex] || '-',
      }

      // 값 정리
      financial.revenue = cleanValue(financial.revenue)
      financial.costOfRevenue = cleanValue(financial.costOfRevenue)
      financial.grossProfit = cleanValue(financial.grossProfit)
      financial.grossMargin = cleanValue(financial.grossMargin)
      financial.operatingProfit = cleanValue(financial.operatingProfit)
      financial.operatingMargin = cleanValue(financial.operatingMargin)
      financial.netIncome = cleanValue(financial.netIncome)
      financial.netMargin = cleanValue(financial.netMargin)
      financial.ebitda = cleanValue(financial.ebitda)
      financial.totalAssets = cleanValue(financial.totalAssets)
      financial.totalLiabilities = cleanValue(financial.totalLiabilities)
      financial.totalEquity = cleanValue(financial.totalEquity)
      financial.debtRatio = cleanValue(financial.debtRatio)
      financial.operatingCashFlow = cleanValue(financial.operatingCashFlow)
      financial.freeCashFlow = cleanValue(financial.freeCashFlow)

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
    $('table').each((_: number, table: any) => {
      $(table)
        .find('tr')
        .each((_: number, tr: any) => {
          const cells = $(tr).find('td, th')
          cells.each((i: number, cell: any) => {
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
            // 추가 지표
            if (text === 'ROA' || text.includes('ROA(%)')) {
              indicators.roa = cleanValue(nextValue) || indicators.roa
            }
            if (text.includes('유동비율')) {
              indicators.currentRatio = cleanValue(nextValue) || indicators.currentRatio
            }
            if (text.includes('당좌비율')) {
              indicators.quickRatio = cleanValue(nextValue) || indicators.quickRatio
            }
            if (text.includes('베타') || text.includes('Beta')) {
              indicators.beta = cleanValue(nextValue) || indicators.beta
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
    $('table').each((_: number, table: any) => {
      $(table)
        .find('tr')
        .each((_: number, tr: any) => {
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
          // 추가 정보
          if (th.includes('사업내용') || th.includes('주요사업')) {
            companyInfo.businessDescription = td
          }
          if (th.includes('주요제품') || th.includes('주력제품') || th.includes('대표제품')) {
            companyInfo.mainProducts = td
          }
        })
    })

    return companyInfo
  } catch (error) {
    console.error('FnGuide company info scraping error:', error)
    return {}
  }
}
