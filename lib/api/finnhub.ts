import type { Indicator, ChangeType } from '@/types/economy'
import type { FinancialData } from '@/types/stock'

/**
 * Finnhub API 클라이언트
 * 해외 주식 지수, 암호화폐, 미국 주식 재무제표 수집
 */

const FINNHUB_API_KEY =
  process.env.FINNHUB_API_KEY || 'd5kv8vhr01qt47mfomh0d5kv8vhr01qt47mfomhg'
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1'

interface FinnhubQuote {
  c: number // Current price
  d: number // Change
  dp: number // Percent change
  h: number // High price of the day
  l: number // Low price of the day
  o: number // Open price of the day
  pc: number // Previous close price
}

/**
 * 변동 타입 판단 (변동값 기준)
 */
function getChangeType(change: number): ChangeType {
  if (change > 0) return 'up'
  if (change < 0) return 'down'
  return 'unchanged'
}

/**
 * Finnhub Quote API 호출
 */
async function fetchQuote(symbol: string): Promise<FinnhubQuote | null> {
  try {
    const url = `${FINNHUB_BASE_URL}/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`)
    }

    const data: FinnhubQuote = await response.json()

    // 데이터 검증 (0이거나 undefined면 잘못된 심볼)
    if (
      data.c === 0 ||
      data.c === undefined ||
      data.c === null ||
      (data.c === 0 && data.pc === 0)
    ) {
      console.warn(`Invalid data for ${symbol}:`, data)
      return null
    }

    return data
  } catch (error) {
    console.error(`Error fetching ${symbol} from Finnhub:`, error)
    return null
  }
}

/**
 * Quote 데이터를 Indicator로 변환
 */
function quoteToIndicator(
  name: string,
  quote: FinnhubQuote | null,
  valuePrefix: string = ''
): Indicator {
  if (!quote) {
    return {
      name,
      value: '데이터 없음',
      change: '0',
      changePercent: '0',
      changeType: 'unchanged',
    }
  }

  const value = quote.c.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  const change = quote.d.toFixed(2)
  const changePercent = quote.dp.toFixed(2)
  const changeType = getChangeType(quote.d)

  return {
    name,
    value: `${valuePrefix}${value}`,
    change: quote.d >= 0 ? `+${change}` : change,
    changePercent: quote.dp >= 0 ? `+${changePercent}` : changePercent,
    changeType,
  }
}

/**
 * 해외 주식 지수 가져오기
 * 무료 플랜에서는 지수 직접 지원 안함 → ETF로 대체
 */
export async function fetchInternationalIndices() {
  // Finnhub 무료 플랜: ETF 사용 (지수 추적 ETF)
  const symbols = {
    sp500: 'SPY', // S&P 500 ETF
    nasdaq: 'QQQ', // NASDAQ-100 ETF
    dow: 'DIA', // Dow Jones ETF
    nikkei: 'EWJ', // Japan ETF (닛케이 추적)
  }

  const [sp500Quote, nasdaqQuote, dowQuote, nikkeiQuote] = await Promise.all([
    fetchQuote(symbols.sp500),
    fetchQuote(symbols.nasdaq),
    fetchQuote(symbols.dow),
    fetchQuote(symbols.nikkei),
  ])

  return {
    sp500: quoteToIndicator('S&P 500', sp500Quote, '$'),
    nasdaq: quoteToIndicator('NASDAQ', nasdaqQuote, '$'),
    dow: quoteToIndicator('Dow Jones', dowQuote, '$'),
    nikkei: quoteToIndicator('Nikkei 225', nikkeiQuote, '$'),
  }
}

/**
 * 암호화폐 가격 가져오기
 */
export async function fetchCryptoPrices() {
  // Finnhub 암호화폐 심볼 (Binance 기준)
  const symbols = {
    bitcoin: 'BINANCE:BTCUSDT',
    ethereum: 'BINANCE:ETHUSDT',
    ripple: 'BINANCE:XRPUSDT',
    cardano: 'BINANCE:ADAUSDT',
  }

  const [bitcoinQuote, ethereumQuote, rippleQuote, cardanoQuote] =
    await Promise.all([
      fetchQuote(symbols.bitcoin),
      fetchQuote(symbols.ethereum),
      fetchQuote(symbols.ripple),
      fetchQuote(symbols.cardano),
    ])

  return {
    bitcoin: quoteToIndicator('Bitcoin (BTC)', bitcoinQuote, '$'),
    ethereum: quoteToIndicator('Ethereum (ETH)', ethereumQuote, '$'),
    ripple: quoteToIndicator('Ripple (XRP)', rippleQuote, '$'),
    cardano: quoteToIndicator('Cardano (ADA)', cardanoQuote, '$'),
  }
}

/**
 * 모든 Finnhub 데이터 가져오기 (병렬 처리)
 */
export async function fetchAllFinnhubData() {
  const [international, crypto] = await Promise.all([
    fetchInternationalIndices(),
    fetchCryptoPrices(),
  ])

  return {
    international,
    crypto,
  }
}

/**
 * 미국 주식 재무제표 가져오기 (Finnhub Financial Statements API)
 * https://finnhub.io/docs/api/financials-reported
 */
export async function fetchUSFinancialStatements(symbol: string): Promise<FinancialData[]> {
  try {
    const url = `${FINNHUB_BASE_URL}/stock/financials-reported?symbol=${symbol}&token=${FINNHUB_API_KEY}`

    console.log(`[Finnhub] Fetching financial statements for ${symbol}`)

    const response = await fetch(url)

    if (!response.ok) {
      console.error(`[Finnhub] API error: ${response.status}`)
      return []
    }

    const data = await response.json()

    if (data.error) {
      console.error(`[Finnhub] API error: ${data.error}`)
      return []
    }

    if (!data.data || data.data.length === 0) {
      console.log(`[Finnhub] No financial data for ${symbol}`)
      return []
    }

    console.log(`[Finnhub] Found ${data.data.length} reports for ${symbol}`)

    // 최근 연간 보고서 3개 추출 (10-K)
    const annualReports = data.data
      .filter((report: any) => report.form === '10-K')
      .slice(0, 3)

    const financials: FinancialData[] = []

    for (const report of annualReports) {
      const { year, report: financialReport } = report

      if (!financialReport) continue

      // 손익계산서 (Income Statement)
      const ic = financialReport.ic || []
      const revenue = findConceptValue(ic, [
        'us-gaap_RevenueFromContractWithCustomerExcludingAssessedTax',
        'us-gaap_Revenues',
        'us-gaap_SalesRevenueNet',
      ])
      const costOfRevenue = findConceptValue(ic, [
        'us-gaap_CostOfGoodsAndServicesSold',
        'us-gaap_CostOfRevenue',
      ])
      const grossProfit = findConceptValue(ic, ['us-gaap_GrossProfit'])
      const operatingIncome = findConceptValue(ic, [
        'us-gaap_OperatingIncomeLoss',
        'us-gaap_IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest',
      ])
      const netIncome = findConceptValue(ic, [
        'us-gaap_NetIncomeLoss',
        'us-gaap_ProfitLoss',
      ])

      // 재무상태표 (Balance Sheet)
      const bs = financialReport.bs || []
      const totalAssets = findConceptValue(bs, ['us-gaap_Assets'])
      const totalLiabilities = findConceptValue(bs, ['us-gaap_Liabilities'])
      const totalEquity = findConceptValue(bs, [
        'us-gaap_StockholdersEquity',
        'us-gaap_StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
      ])

      // 현금흐름표 (Cash Flow Statement)
      const cf = financialReport.cf || []
      const operatingCashFlow = findConceptValue(cf, [
        'us-gaap_NetCashProvidedByUsedInOperatingActivities',
      ])
      const investingCashFlow = findConceptValue(cf, [
        'us-gaap_NetCashProvidedByUsedInInvestingActivities',
      ])

      // 비율 계산
      const revenueNum = parseFloat(revenue.replace(/,/g, '')) || 0
      const grossProfitNum = parseFloat(grossProfit.replace(/,/g, '')) || 0
      const operatingIncomeNum = parseFloat(operatingIncome.replace(/,/g, '')) || 0
      const netIncomeNum = parseFloat(netIncome.replace(/,/g, '')) || 0
      const totalAssetsNum = parseFloat(totalAssets.replace(/,/g, '')) || 0
      const totalLiabilitiesNum = parseFloat(totalLiabilities.replace(/,/g, '')) || 0
      const totalEquityNum = parseFloat(totalEquity.replace(/,/g, '')) || 0
      const operatingCashFlowNum = parseFloat(operatingCashFlow.replace(/,/g, '')) || 0
      const investingCashFlowNum = parseFloat(investingCashFlow.replace(/,/g, '')) || 0

      const grossMargin =
        revenueNum > 0 && grossProfitNum > 0
          ? ((grossProfitNum / revenueNum) * 100).toFixed(2) + '%'
          : '-'
      const operatingMargin =
        revenueNum > 0 && operatingIncomeNum !== 0
          ? ((operatingIncomeNum / revenueNum) * 100).toFixed(2) + '%'
          : '-'
      const netMargin =
        revenueNum > 0 && netIncomeNum !== 0
          ? ((netIncomeNum / revenueNum) * 100).toFixed(2) + '%'
          : '-'
      const debtRatio =
        totalEquityNum > 0 && totalLiabilitiesNum > 0
          ? ((totalLiabilitiesNum / totalEquityNum) * 100).toFixed(2) + '%'
          : '-'
      const freeCashFlow =
        operatingCashFlowNum !== 0 && investingCashFlowNum !== 0
          ? formatValue(operatingCashFlowNum + investingCashFlowNum)
          : '-'

      const financial: FinancialData = {
        period: year.toString(),
        periodType: 'annual',
        // 손익계산서
        revenue,
        costOfRevenue,
        grossProfit,
        grossMargin,
        operatingProfit: operatingIncome,
        operatingMargin,
        netIncome,
        netMargin,
        ebitda: '-', // Finnhub 데이터에 EBITDA 없음 (계산 필요)
        // 재무상태표
        totalAssets,
        totalLiabilities,
        totalEquity,
        debtRatio,
        // 현금흐름표
        operatingCashFlow,
        freeCashFlow,
      }

      financials.push(financial)
    }

    console.log(`[Finnhub] Parsed ${financials.length} financial periods for ${symbol}`)
    return financials
  } catch (error) {
    console.error(`[Finnhub] Error fetching financials for ${symbol}:`, error)
    return []
  }
}

/**
 * GAAP concept에서 값 찾기 (fallback 지원)
 */
function findConceptValue(items: any[], concepts: string[]): string {
  for (const concept of concepts) {
    const item = items.find((i: any) => i.concept === concept)
    if (item && item.value !== undefined) {
      return formatValue(item.value)
    }
  }
  return '-'
}

/**
 * 숫자 포맷팅 (단위: 달러, 억 달러 변환)
 */
function formatValue(value: number): string {
  if (value === 0) return '0'
  if (!value) return '-'

  // 억 달러 단위로 변환 (100,000,000 = 1억)
  const inHundredMillions = value / 100000000

  return inHundredMillions.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}
