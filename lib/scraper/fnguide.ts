import * as cheerio from 'cheerio'
import type { FinancialData, CompanyInfo, InvestmentIndicators } from '@/types/stock'

/**
 * FnGuide 재무제표 스크래퍼
 *
 * FnGuide SVD_Main 페이지의 테이블 구조 (17개+):
 * - Table 0: 시세 (종가, 거래량, 52주 최고/최저)
 * - Table 7: 투자의견/컨센서스 (추정 EPS, PER)
 * - Table 8-9: 비교분석 (삼성전자 vs KOSPI)
 * - Table 10: IFRS(연결) Annual + Net Quarter (혼합)
 * - Table 11: IFRS(연결) Annual Only ← 핵심 데이터 소스
 * - Table 12: IFRS(연결) Net Quarter
 * - Table 13-15: IFRS(별도) ← 별도 재무제표 (사용하지 않음)
 *
 * 중요: $('table') 전체 순회하면 별도(Table 14)의 값이 연결(Table 11)을 덮어씀
 * → 반드시 IFRS(연결) Annual Only 테이블만 타겟팅해야 함
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
 * FnGuide HTML에서 IFRS(연결) Annual Only 테이블 찾기
 */
function findConsolidatedAnnualTable($: any): any | null {
  const tables = $('table.us_table_ty1')
  let financialTable: any | null = null

  tables.each((_i: number, table: any) => {
    const $table = $(table)
    const headers = $table.find('thead th, thead td').map((_: number, th: any) => $(th).text().trim()).get()
    const headersText = headers.join(' ')

    // "IFRS(연결)" + "Annual" 포함하고, "Net Quarter"가 없는 테이블 (연간 전용)
    if (headersText.includes('IFRS') && headersText.includes('Annual') && !headersText.includes('Net Quarter')) {
      // "별도"가 아닌 "연결"만
      if (!headersText.includes('별도')) {
        financialTable = $table
        return false // 루프 중단
      }
    }
  })

  return financialTable
}

/**
 * 테이블에서 행 데이터 파싱
 * FnGuide 행 이름에 설명 텍스트가 포함됨 (예: "영업이익률(%)(영업이익 / 영업수익) * 100영업이익률")
 * → 키워드 매칭으로 처리
 */
function parseTableRows($: any, table: any): { [key: string]: string[] } {
  const rows: { [key: string]: string[] } = {}

  table.find('tbody tr').each((_: number, tr: any) => {
    const cells = $(tr).find('td, th')
    const rawName = cells.first().text().trim()
    const values: string[] = []

    cells.each((i: number, td: any) => {
      if (i > 0) {
        values.push($(td).text().trim())
      }
    })

    if (rawName && values.length > 0) {
      rows[rawName] = values
    }
  })

  return rows
}

/**
 * FnGuide 행 이름으로 값 찾기
 * 행 이름에 설명 텍스트가 포함되므로 키워드 매칭
 * 예: "영업이익률(%)(영업이익 / 영업수익) * 100영업이익률" → "영업이익률" 키워드로 매칭
 */
function findRowByKeyword(rows: { [key: string]: string[] }, keyword: string, excludeKeywords?: string[]): string[] | undefined {
  for (const [name, values] of Object.entries(rows)) {
    if (name.includes(keyword)) {
      // 제외 키워드 체크
      if (excludeKeywords && excludeKeywords.some(ek => name.includes(ek))) {
        continue
      }
      return values
    }
  }
  return undefined
}

/**
 * 재무제표 스크래핑 (FnGuide)
 * IFRS(연결) Annual Only 테이블(Table 11)에서 추출
 */
export async function scrapeFinancials(code: string): Promise<FinancialData[]> {
  try {
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

    const financialTable = findConsolidatedAnnualTable($)
    if (!financialTable) {
      return []
    }

    // 헤더에서 기간 정보 추출
    const headers: string[] = []
    financialTable.find('thead th, thead td').each((_i: number, th: any) => {
      headers.push($(th).text().trim())
    })

    const rows = parseTableRows($, financialTable)

    const financials: FinancialData[] = []

    // 헤더[0] = IFRS(연결), 헤더[1] = Annual, 헤더[2] = 2020/12, ...
    for (let i = 2; i < Math.min(headers.length, 10); i++) {
      let period = headers[i] || ''

      // 추정치(Estimate) 제외, 잠정실적(Provisional)은 포함
      if (!period || period.includes('Estimate') || period.includes('추정') || period.includes('컨센서스')) {
        continue
      }

      const yearMatch = period.match(/(\d{4}\/\d{2})/)
      if (!yearMatch) continue
      period = yearMatch[1]

      const valueIndex = i - 1

      // 기본 재무데이터
      const revenue = cleanValue(findRowByKeyword(rows, '매출액')?.[valueIndex] || findRowByKeyword(rows, '영업수익')?.[valueIndex] || '-')
      const operatingProfit = cleanValue(findRowByKeyword(rows, '영업이익', ['영업이익률', '영업이익(발표'])?.[valueIndex] || '-')
      const netIncome = cleanValue(findRowByKeyword(rows, '당기순이익')?.[valueIndex] || '-')
      const totalAssets = cleanValue(findRowByKeyword(rows, '자산총계')?.[valueIndex] || '-')
      const totalLiabilities = cleanValue(findRowByKeyword(rows, '부채총계')?.[valueIndex] || '-')
      const totalEquity = cleanValue(findRowByKeyword(rows, '자본총계')?.[valueIndex] || '-')

      // FnGuide가 직접 제공하는 비율 데이터
      const operatingMarginRow = findRowByKeyword(rows, '영업이익률')
      const debtRatioRow = findRowByKeyword(rows, '부채비율')

      let operatingMargin = cleanValue(operatingMarginRow?.[valueIndex] || '-')
      let netMargin = '-'
      let debtRatio = cleanValue(debtRatioRow?.[valueIndex] || '-')

      // FnGuide에서 비율을 제공하지 않으면 직접 계산
      const revenueNum = parseFloat(revenue.replace(/,/g, '')) || 0
      const opProfitNum = parseFloat(operatingProfit.replace(/,/g, '')) || 0
      const netIncomeNum = parseFloat(netIncome.replace(/,/g, '')) || 0
      const totalLiabNum = parseFloat(totalLiabilities.replace(/,/g, '')) || 0
      const totalEquityNum = parseFloat(totalEquity.replace(/,/g, '')) || 0

      if (operatingMargin === '-' && revenueNum > 0 && opProfitNum !== 0) {
        operatingMargin = ((opProfitNum / revenueNum) * 100).toFixed(2) + '%'
      } else if (operatingMargin !== '-' && !operatingMargin.includes('%')) {
        operatingMargin += '%'
      }

      if (revenueNum > 0 && netIncomeNum !== 0) {
        netMargin = ((netIncomeNum / revenueNum) * 100).toFixed(2) + '%'
      }

      if (debtRatio === '-' && totalEquityNum > 0 && totalLiabNum > 0) {
        debtRatio = ((totalLiabNum / totalEquityNum) * 100).toFixed(2) + '%'
      } else if (debtRatio !== '-' && !debtRatio.includes('%')) {
        debtRatio += '%'
      }

      const financial: FinancialData = {
        period,
        periodType: 'annual',
        revenue,
        costOfRevenue: cleanValue(findRowByKeyword(rows, '매출원가')?.[valueIndex] || '-'),
        grossProfit: cleanValue(findRowByKeyword(rows, '매출총이익')?.[valueIndex] || '-'),
        grossMargin: '-',
        operatingProfit,
        operatingMargin,
        netIncome,
        netMargin,
        ebitda: cleanValue(findRowByKeyword(rows, 'EBITDA')?.[valueIndex] || '-'),
        totalAssets,
        totalLiabilities,
        totalEquity,
        debtRatio,
        operatingCashFlow: cleanValue(findRowByKeyword(rows, '영업활동현금흐름')?.[valueIndex] || findRowByKeyword(rows, '영업현금흐름')?.[valueIndex] || '-'),
        freeCashFlow: cleanValue(findRowByKeyword(rows, '잉여현금흐름')?.[valueIndex] || findRowByKeyword(rows, 'FCF')?.[valueIndex] || '-'),
      }

      financials.push(financial)
    }

    return financials
  } catch (error) {
    console.error('FnGuide financials scraping error:', error)
    return []
  }
}

/**
 * 투자지표 스크래핑 (FnGuide)
 * IFRS(연결) Annual Only 테이블(Table 11)에서 최신 연도의 지표만 추출
 *
 * Table 11에 포함된 지표:
 * - EPS(원), BPS(원), PER(배), PBR(배)
 * - ROE(%), ROA(%)
 * - DPS(원), 배당수익률(%)
 * - 영업이익률(%), 부채비율(%)
 * - 발행주식수 (천주)
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

    // IFRS(연결) Annual Only 테이블에서만 추출
    const financialTable = findConsolidatedAnnualTable($)
    if (!financialTable) {
      return indicators
    }

    // 헤더에서 마지막 유효 연도 인덱스 찾기
    const headers: string[] = []
    financialTable.find('thead th, thead td').each((_i: number, th: any) => {
      headers.push($(th).text().trim())
    })

    // 최신 유효 연도 인덱스 찾기 (추정치 제외)
    let latestIndex = -1
    for (let i = headers.length - 1; i >= 2; i--) {
      const h = headers[i]
      if (h && h.match(/\d{4}\/\d{2}/) && !h.includes('Estimate') && !h.includes('추정')) {
        latestIndex = i - 1 // value index
        break
      }
    }

    if (latestIndex < 0) return indicators

    const rows = parseTableRows($, financialTable)

    // 최신 연도 데이터에서 지표 추출
    const getValue = (keyword: string, excludeKeywords?: string[]): string | undefined => {
      const row = findRowByKeyword(rows, keyword, excludeKeywords)
      if (!row || !row[latestIndex]) return undefined
      const val = cleanValue(row[latestIndex])
      return val !== '-' ? val : undefined
    }

    indicators.per = getValue('PER')
    indicators.pbr = getValue('PBR')
    indicators.eps = getValue('EPS')
    indicators.bps = getValue('BPS')
    indicators.roe = getValue('ROE')
    indicators.roa = getValue('ROA')
    indicators.dps = getValue('DPS')
    indicators.dividendYield = getValue('배당수익률') || getValue('배당')

    // 52주 최고/최저 — Table 0 (시세 테이블)에서 추출
    const priceTable = $('table.us_table_ty1').first()
    if (priceTable.length) {
      priceTable.find('tr').each((_: number, tr: any) => {
        const thText = $(tr).find('th').text().trim()
        if (thText.includes('52주') && thText.includes('최고')) {
          const vals = $(tr).find('td')
          if (vals.length >= 2) {
            indicators.week52High = cleanValue($(vals[0]).text().trim())
            indicators.week52Low = cleanValue($(vals[1]).text().trim())
          }
        }
      })
    }

    // 베타 — Table 8 (비교분석)에서 추출
    $('table.us_table_ty1').each((_: number, table: any) => {
      const $table = $(table)
      const headerText = $table.find('thead').text()
      // 비교분석 테이블 (구분, 종목명, 업종, KOSPI 형식)
      if (headerText.includes('구분') && headerText.includes('KOSPI')) {
        $table.find('tbody tr').each((_: number, tr: any) => {
          const th = $(tr).find('th, td').first().text().trim()
          if (th.includes('베타') || th.includes('Beta')) {
            const val = $(tr).find('td').first().text().trim()
            if (val && val !== '-') {
              indicators.beta = cleanValue(val)
            }
          }
        })
        return false
      }
    })

    return indicators
  } catch (error) {
    console.error('FnGuide indicators scraping error:', error)
    return {}
  }
}

/**
 * 기업 상세 정보 스크래핑 (FnGuide)
 * IFRS(연결) Annual Only 테이블에서 업종/발행주식수만 추출
 * (다른 필드는 DART/네이버가 더 정확)
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

    // IFRS(연결) Annual 테이블에서 발행주식수 추출 (천주 단위)
    const financialTable = findConsolidatedAnnualTable($)
    if (financialTable) {
      const rows = parseTableRows($, financialTable)
      const sharesRow = findRowByKeyword(rows, '발행주식수')
      if (sharesRow && sharesRow.length > 0) {
        // 마지막 유효 값 사용 (최신 연도)
        for (let i = sharesRow.length - 1; i >= 0; i--) {
          const val = cleanValue(sharesRow[i])
          if (val !== '-') {
            // 천주 단위 → 실제 주수로 변환
            const sharesInThousands = parseFloat(val.replace(/,/g, ''))
            if (sharesInThousands > 0) {
              const actualShares = Math.round(sharesInThousands * 1000)
              companyInfo.listedShares = actualShares.toLocaleString('ko-KR') + '주'
            }
            break
          }
        }
      }
    }

    // 비교분석 테이블 (Table 8)에서 업종 정보 추출
    $('table.us_table_ty1').each((_: number, table: any) => {
      const $table = $(table)
      const headerText = $table.find('thead').text()
      // 비교분석 테이블 식별 (구분 + 종목명 + 업종 + KOSPI)
      if (headerText.includes('구분') && headerText.includes('KOSPI')) {
        // 헤더의 두 번째 열이 업종명 (예: "코스피 전기·전자")
        const headerCells = $table.find('thead th, thead td')
        if (headerCells.length >= 3) {
          const industryText = $(headerCells[2]).text().trim()
            .replace(/\s+/g, ' ')
            .replace(/코스피\s*/, '')
            .replace(/코스닥\s*/, '')
            .trim()
          if (industryText && industryText.length > 1) {
            companyInfo.industry = industryText
          }
        }
        return false
      }
    })

    return companyInfo
  } catch (error) {
    console.error('FnGuide company info scraping error:', error)
    return {}
  }
}
