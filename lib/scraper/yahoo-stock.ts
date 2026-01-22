import type {
  StockPrice,
  CompanyInfo,
  InvestmentIndicators,
  FinancialData,
} from '@/types/stock'
import type { ChangeType } from '@/types/economy'

/**
 * 미국 주식 스크래퍼 (Yahoo Finance API)
 */

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/**
 * 변동 타입 판단
 */
function getChangeType(value: number): ChangeType {
  if (value > 0) return 'up'
  if (value < 0) return 'down'
  return 'unchanged'
}

/**
 * 숫자 포맷팅 (억/조 단위)
 */
function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}조`
  }
  if (value >= 100_000_000) {
    return `${(value / 100_000_000).toFixed(0)}억`
  }
  return value.toLocaleString()
}

/**
 * 미국 주식 시세 조회 (Yahoo Finance Quote API)
 */
export async function scrapeUSStockPrice(symbol: string): Promise<StockPrice | null> {
  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch US stock price: ${response.statusText}`)
    }

    const data = await response.json()
    const result = data?.chart?.result?.[0]

    if (!result) {
      throw new Error('No data from Yahoo Finance')
    }

    const meta = result.meta
    const currentPrice = meta.regularMarketPrice || 0
    const prevClose = meta.chartPreviousClose || meta.previousClose || 0
    const change = currentPrice - prevClose
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0

    // 당일 고가/저가/시가
    const quote = result.indicators?.quote?.[0]
    const high = quote?.high?.[0] || meta.regularMarketDayHigh || 0
    const low = quote?.low?.[0] || meta.regularMarketDayLow || 0
    const open = quote?.open?.[0] || meta.regularMarketOpen || 0
    const volume = quote?.volume?.[0] || meta.regularMarketVolume || 0

    const changeType = getChangeType(change)
    const sign = changeType === 'up' ? '+' : changeType === 'down' ? '-' : ''

    return {
      current: currentPrice.toFixed(2),
      change: sign + Math.abs(change).toFixed(2),
      changePercent: sign + Math.abs(changePercent).toFixed(2),
      changeType,
      high: high.toFixed(2),
      low: low.toFixed(2),
      open: open.toFixed(2),
      volume: volume.toLocaleString(),
      prevClose: prevClose.toFixed(2),
    }
  } catch (error) {
    console.error('US stock price scraping error:', error)
    return null
  }
}

/**
 * 미국 주식 기업 정보 조회 (Yahoo Finance Quote Summary API)
 */
export async function scrapeUSCompanyInfo(symbol: string): Promise<CompanyInfo | null> {
  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=assetProfile,summaryDetail,defaultKeyStatistics`

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch US company info: ${response.statusText}`)
    }

    const data = await response.json()
    const result = data?.quoteSummary?.result?.[0]

    if (!result) {
      throw new Error('No company data from Yahoo Finance')
    }

    const profile = result.assetProfile || {}
    const summaryDetail = result.summaryDetail || {}

    return {
      industry: profile.industry || '-',
      ceo: profile.companyOfficers?.[0]?.name || '-',
      establishedDate: '-',
      fiscalMonth: '-',
      employees: profile.fullTimeEmployees?.toLocaleString() || '-',
      marketCap: formatLargeNumber(summaryDetail.marketCap?.raw || 0),
      headquarters: `${profile.city || ''}, ${profile.country || ''}`.trim() || '-',
      website: profile.website || '-',
      // 추가 정보
      faceValue: '-',
      listedDate: '-',
      listedShares: formatLargeNumber(summaryDetail.sharesOutstanding?.raw || 0),
      foreignOwnership: '-',
      capital: '-',
    }
  } catch (error) {
    console.error('US company info scraping error:', error)
    return null
  }
}

/**
 * 미국 주식 투자 지표 조회
 */
export async function scrapeUSInvestmentIndicators(
  symbol: string
): Promise<InvestmentIndicators | null> {
  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=defaultKeyStatistics,summaryDetail,financialData`

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch US indicators: ${response.statusText}`)
    }

    const data = await response.json()
    const result = data?.quoteSummary?.result?.[0]

    if (!result) {
      throw new Error('No indicators data from Yahoo Finance')
    }

    const keyStats = result.defaultKeyStatistics || {}
    const summaryDetail = result.summaryDetail || {}
    const financialData = result.financialData || {}

    return {
      per: keyStats.trailingPE?.raw?.toFixed(2) || '-',
      pbr: keyStats.priceToBook?.raw?.toFixed(2) || '-',
      eps: keyStats.trailingEps?.raw?.toFixed(2) || '-',
      bps: keyStats.bookValue?.raw?.toFixed(2) || '-',
      roe: financialData.returnOnEquity?.raw
        ? (financialData.returnOnEquity.raw * 100).toFixed(2) + '%'
        : '-',
      dividendYield: summaryDetail.dividendYield?.raw
        ? (summaryDetail.dividendYield.raw * 100).toFixed(2) + '%'
        : '-',
      // 추가 지표
      week52High: keyStats.fiftyTwoWeekHigh?.raw?.toFixed(2) || '-',
      week52Low: keyStats.fiftyTwoWeekLow?.raw?.toFixed(2) || '-',
      psr: keyStats.priceToSalesTrailing12Months?.raw?.toFixed(2) || '-',
      dps: summaryDetail.dividendRate?.raw?.toFixed(2) || '-',
    }
  } catch (error) {
    console.error('US investment indicators scraping error:', error)
    return null
  }
}

/**
 * 미국 주식 재무제표 조회
 */
export async function scrapeUSFinancialData(symbol: string): Promise<FinancialData[]> {
  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${symbol}?modules=incomeStatementHistory,balanceSheetHistory,financialData`

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch US financial data: ${response.statusText}`)
    }

    const data = await response.json()
    const result = data?.quoteSummary?.result?.[0]

    if (!result) {
      throw new Error('No financial data from Yahoo Finance')
    }

    const incomeStatements = result.incomeStatementHistory?.incomeStatementHistory || []
    const balanceSheets = result.balanceSheetHistory?.balanceSheetStatements || []
    const financialData = result.financialData || {}

    const financials: FinancialData[] = []

    // 최근 3년 재무제표
    for (let i = 0; i < Math.min(3, incomeStatements.length); i++) {
      const income = incomeStatements[i]
      const balance = balanceSheets[i] || {}

      const revenue = income.totalRevenue?.raw || 0
      const operatingIncome = income.operatingIncome?.raw || 0
      const netIncome = income.netIncome?.raw || 0
      const totalAssets = balance.totalAssets?.raw || 0
      const totalLiabilities = balance.totalLiab?.raw || 0
      const totalEquity = balance.totalStockholderEquity?.raw || 0

      const operatingMargin = revenue > 0 ? (operatingIncome / revenue) * 100 : 0
      const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0
      const debtRatio = totalEquity > 0 ? (totalLiabilities / totalEquity) * 100 : 0

      // 날짜 파싱
      const date = new Date(income.endDate?.fmt || '')
      const year = date.getFullYear()

      financials.push({
        period: `${year}`,
        periodType: 'annual',
        revenue: formatLargeNumber(revenue),
        operatingProfit: formatLargeNumber(operatingIncome),
        netIncome: formatLargeNumber(netIncome),
        operatingMargin: operatingMargin.toFixed(2) + '%',
        netMargin: netMargin.toFixed(2) + '%',
        totalAssets: formatLargeNumber(totalAssets),
        totalLiabilities: formatLargeNumber(totalLiabilities),
        totalEquity: formatLargeNumber(totalEquity),
        debtRatio: debtRatio.toFixed(2) + '%',
      })
    }

    return financials
  } catch (error) {
    console.error('US financial data scraping error:', error)
    return []
  }
}

/**
 * 시장 구분 (심볼로부터 자동 판별)
 */
export function getUSStockMarket(symbol: string): 'NASDAQ' | 'NYSE' | 'AMEX' | 'US' {
  // 일반적으로 심볼만으로는 정확히 판별하기 어려움
  // Yahoo Finance API에서 exchange 정보를 가져와야 함
  return 'US'
}
