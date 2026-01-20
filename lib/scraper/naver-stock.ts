import * as cheerio from 'cheerio'
import type {
  StockSearchResult,
  StockBasicInfo,
  FinancialStatement,
  InvestmentMetrics,
  StockInfo,
} from '@/types/stock'

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * 네이버 금융에서 종목 검색
 */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  try {
    // 네이버 금융 검색 API 사용
    const url = `https://ac.finance.naver.com/ac?q=${encodeURIComponent(query)}&q_enc=euc-kr&t_koreng=1&st=111&r_lt=111`

    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })

    const data = await response.json()
    const results: StockSearchResult[] = []

    // 검색 결과 파싱
    if (data.items && data.items[0]) {
      for (const item of data.items[0]) {
        const code = item[0]?.[0] // 종목 코드
        const name = item[1]?.[0] // 종목명
        const market = item[2]?.[0] // 시장 (KOSPI/KOSDAQ)

        if (code && name) {
          // 6자리 숫자 코드만 (주식)
          if (/^\d{6}$/.test(code)) {
            results.push({
              code,
              name,
              market: market?.includes('KOSDAQ') ? 'KOSDAQ' : 'KOSPI',
            })
          }
        }
      }
    }

    return results.slice(0, 10) // 최대 10개
  } catch (error) {
    console.error('Stock search error:', error)
    return []
  }
}

/**
 * 네이버 금융에서 종목 상세 정보 조회
 */
export async function getStockInfo(code: string): Promise<StockInfo | null> {
  try {
    // 기본 정보와 재무정보를 병렬로 조회
    const [basicInfo, financialData] = await Promise.all([
      scrapeBasicInfo(code),
      scrapeFinancialInfo(code),
    ])

    if (!basicInfo) {
      return null
    }

    return {
      basic: basicInfo,
      financials: financialData.financials,
      metrics: financialData.metrics,
      lastUpdated: new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
  } catch (error) {
    console.error('Get stock info error:', error)
    return null
  }
}

/**
 * 기본 정보 스크래핑 (현재가, 시가총액 등)
 */
async function scrapeBasicInfo(code: string): Promise<StockBasicInfo | null> {
  try {
    const url = `https://finance.naver.com/item/main.naver?code=${code}`
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })
    const html = await response.text()
    const $ = cheerio.load(html)

    // 종목명
    const name = $('.wrap_company h2 a').text().trim() || $('title').text().split(':')[0].trim()

    // 시장 구분
    const marketText = $('.description').text()
    const market: 'KOSPI' | 'KOSDAQ' = marketText.includes('코스닥') ? 'KOSDAQ' : 'KOSPI'

    // 업종
    const sector = $('.sub_info a').first().text().trim() || '-'

    // 현재가
    const currentPriceText = $('.no_today .blind').first().text().trim()
    const currentPrice = currentPriceText.replace(/,/g, '')

    // 전일 대비
    const changeElement = $('.no_exday')
    const changeValue = changeElement.find('.blind').first().text().trim().replace(/,/g, '')
    const changePercentText = changeElement.find('.blind').last().text().trim()

    // 변동 방향 확인
    let changeType: 'up' | 'down' | 'unchanged' = 'unchanged'
    const changeClass = changeElement.find('em').attr('class') || ''
    if (changeClass.includes('bu_p') || changeClass.includes('red')) {
      changeType = 'up'
    } else if (changeClass.includes('bu_n') || changeClass.includes('blue') || changeClass.includes('nv')) {
      changeType = 'down'
    }

    // 시가총액
    const marketCapTable = $('#_market_sum').text().trim() ||
                           $('table.no_info tbody tr').eq(0).find('td').eq(0).text().trim()
    const marketCap = marketCapTable ? `${marketCapTable}억원` : '-'

    // 거래량
    const volume = $('table.no_info tbody tr').eq(0).find('td').eq(2).find('.blind').text().trim() || '-'

    // 52주 최고/최저
    const high52week = $('table.no_info tbody tr').eq(1).find('td').eq(0).find('.blind').text().trim() || '-'
    const low52week = $('table.no_info tbody tr').eq(1).find('td').eq(1).find('.blind').text().trim() || '-'

    // 변동값 포맷팅
    const change = changeType === 'up' ? `+${changeValue}` :
                   changeType === 'down' ? `-${changeValue}` : '0'
    const changePercent = changeType === 'up' ? `+${changePercentText}` :
                          changeType === 'down' ? `-${changePercentText}` : '0%'

    return {
      code,
      name: name || code,
      market,
      sector,
      currentPrice: Number(currentPrice).toLocaleString('ko-KR'),
      change,
      changePercent,
      changeType,
      marketCap,
      volume: volume ? Number(volume.replace(/,/g, '')).toLocaleString('ko-KR') : '-',
      high52week: high52week ? Number(high52week.replace(/,/g, '')).toLocaleString('ko-KR') + '원' : '-',
      low52week: low52week ? Number(low52week.replace(/,/g, '')).toLocaleString('ko-KR') + '원' : '-',
    }
  } catch (error) {
    console.error('Scrape basic info error:', error)
    return null
  }
}

/**
 * 재무제표 및 투자지표 스크래핑
 */
async function scrapeFinancialInfo(code: string): Promise<{
  financials: FinancialStatement[]
  metrics: InvestmentMetrics
}> {
  try {
    // 종목분석 페이지에서 재무정보 조회
    const url = `https://finance.naver.com/item/main.naver?code=${code}`
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })
    const html = await response.text()
    const $ = cheerio.load(html)

    // 투자지표 파싱 (시세 페이지의 테이블)
    const per = $('table.per_table tbody tr').eq(0).find('td').eq(0).find('em').text().trim() || '-'
    const eps = $('table.per_table tbody tr').eq(0).find('td').eq(1).find('em').text().trim() || '-'
    const pbr = $('table.per_table tbody tr').eq(1).find('td').eq(0).find('em').text().trim() || '-'
    const bps = $('table.per_table tbody tr').eq(1).find('td').eq(1).find('em').text().trim() || '-'

    // 배당수익률과 ROE는 다른 위치에서 가져옴
    let dividendYield = '-'
    let roe = '-'

    // 투자정보 테이블에서 추가 정보 조회
    $('table.tb_type1 tbody tr').each((_, row) => {
      const label = $(row).find('th').text().trim()
      const value = $(row).find('td').first().text().trim()

      if (label.includes('ROE')) {
        roe = value || '-'
      }
      if (label.includes('배당수익률')) {
        dividendYield = value || '-'
      }
    })

    const metrics: InvestmentMetrics = {
      per: per !== '-' ? `${per}배` : '-',
      pbr: pbr !== '-' ? `${pbr}배` : '-',
      eps: eps !== '-' ? `${eps}원` : '-',
      bps: bps !== '-' ? `${bps}원` : '-',
      dividendYield: dividendYield !== '-' ? `${dividendYield}%` : '-',
      roe: roe !== '-' ? `${roe}%` : '-',
    }

    // 재무제표 조회 (별도 페이지)
    const financials = await scrapeAnnualFinancials(code)

    return { financials, metrics }
  } catch (error) {
    console.error('Scrape financial info error:', error)
    return {
      financials: [],
      metrics: {
        per: '-',
        pbr: '-',
        eps: '-',
        bps: '-',
        dividendYield: '-',
        roe: '-',
      },
    }
  }
}

/**
 * 연간 재무제표 스크래핑
 */
async function scrapeAnnualFinancials(code: string): Promise<FinancialStatement[]> {
  try {
    // 종목분석 > 기업현황 페이지
    const url = `https://finance.naver.com/item/coinfo.naver?code=${code}&target=finsum_more`
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
    })
    const html = await response.text()
    const $ = cheerio.load(html)

    const financials: FinancialStatement[] = []

    // iframe 내용을 직접 가져오기 어려우므로 기본 페이지에서 최근 실적 추출
    // 또는 간단한 형태로 표시

    // 메인 페이지의 실적 테이블 파싱 시도
    const mainUrl = `https://finance.naver.com/item/main.naver?code=${code}`
    const mainResponse = await fetch(mainUrl, {
      headers: { 'User-Agent': USER_AGENT },
    })
    const mainHtml = await mainResponse.text()
    const $main = cheerio.load(mainHtml)

    // 연간 실적 테이블 (#content > div.section.cop_analysis > div.sub_section > table)
    const $table = $main('table.tb_type1_ifrs, table.tb_type1')

    if ($table.length > 0) {
      // 헤더에서 연도 추출
      const years: string[] = []
      $table.find('thead th').each((i, th) => {
        const text = $main(th).text().trim()
        // 연도 형식 (YYYY.MM 또는 YYYY/MM)
        const yearMatch = text.match(/(\d{4})/)
        if (yearMatch && i > 0) {
          years.push(yearMatch[1])
        }
      })

      // 행에서 데이터 추출
      const data: Record<string, string[]> = {
        revenue: [],
        operatingProfit: [],
        netIncome: [],
        operatingMargin: [],
      }

      $table.find('tbody tr').each((_, row) => {
        const label = $main(row).find('th').text().trim()
        const values: string[] = []

        $main(row).find('td').each((_, td) => {
          values.push($main(td).text().trim())
        })

        if (label.includes('매출액')) {
          data.revenue = values
        } else if (label.includes('영업이익') && !label.includes('률')) {
          data.operatingProfit = values
        } else if (label.includes('당기순이익')) {
          data.netIncome = values
        } else if (label.includes('영업이익률')) {
          data.operatingMargin = values
        }
      })

      // 최근 3년 데이터만 사용
      const recentYears = years.slice(0, 3)
      for (let i = 0; i < recentYears.length; i++) {
        financials.push({
          year: recentYears[i],
          revenue: formatFinancialValue(data.revenue[i]),
          operatingProfit: formatFinancialValue(data.operatingProfit[i]),
          netIncome: formatFinancialValue(data.netIncome[i]),
          operatingMargin: data.operatingMargin[i] || '-',
          netMargin: '-',
        })
      }
    }

    return financials
  } catch (error) {
    console.error('Scrape annual financials error:', error)
    return []
  }
}

/**
 * 재무 값 포맷팅 (억원 단위)
 */
function formatFinancialValue(value: string | undefined): string {
  if (!value || value === '-' || value === 'N/A') return '-'

  const numValue = parseFloat(value.replace(/,/g, ''))
  if (isNaN(numValue)) return value

  // 이미 억원 단위로 표시된 경우
  if (Math.abs(numValue) < 10000) {
    return `${numValue.toLocaleString('ko-KR')}억`
  }

  // 조원 단위로 변환
  const trillion = numValue / 10000
  return `${trillion.toFixed(1)}조`
}
