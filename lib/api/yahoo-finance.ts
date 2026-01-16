import type { Indicator, ChangeType } from '@/types/economy'

/**
 * Yahoo Finance API 클라이언트
 * 해외 주식 지수 데이터 수집 (무료)
 */

interface YahooQuote {
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketPreviousClose: number
}

interface YahooResponse {
  quoteResponse: {
    result: Array<{
      symbol: string
      regularMarketPrice: number
      regularMarketChange: number
      regularMarketChangePercent: number
      regularMarketPreviousClose: number
    }>
    error: null
  }
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
 * Yahoo Finance Quote API 호출
 */
async function fetchYahooQuote(symbol: string): Promise<YahooQuote | null> {
  try {
    // Yahoo Finance v8 API (공개 엔드포인트)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    })

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`)
    }

    const data = await response.json()

    // 데이터 추출
    const result = data.chart?.result?.[0]
    if (!result) {
      console.warn(`No data for ${symbol}`)
      return null
    }

    const meta = result.meta
    const regularMarketPrice = meta.regularMarketPrice
    const previousClose = meta.chartPreviousClose || meta.previousClose

    if (!regularMarketPrice || !previousClose) {
      console.warn(`Invalid data for ${symbol}`)
      return null
    }

    const change = regularMarketPrice - previousClose
    const changePercent = (change / previousClose) * 100

    return {
      regularMarketPrice,
      regularMarketChange: change,
      regularMarketChangePercent: changePercent,
      regularMarketPreviousClose: previousClose,
    }
  } catch (error) {
    console.error(`Error fetching ${symbol} from Yahoo Finance:`, error)
    return null
  }
}

/**
 * Quote 데이터를 Indicator로 변환
 */
function quoteToIndicator(
  name: string,
  quote: YahooQuote | null
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

  // 지수 값은 소수점 2자리까지 표시
  const value = quote.regularMarketPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const change = Math.abs(quote.regularMarketChange).toFixed(2)
  const changePercent = Math.abs(quote.regularMarketChangePercent).toFixed(2)
  const changeType = getChangeType(quote.regularMarketChange)

  return {
    name,
    value: value,
    change: quote.regularMarketChange >= 0 ? `+${change}` : `-${change}`,
    changePercent: quote.regularMarketChangePercent >= 0 ? `+${changePercent}` : `-${changePercent}`,
    changeType,
  }
}

/**
 * 해외 주식 지수 가져오기 (실제 지수 값)
 */
export async function fetchInternationalIndices() {
  // Yahoo Finance 지수 심볼
  const symbols = {
    sp500: '^GSPC',    // S&P 500 지수
    nasdaq: '^IXIC',   // NASDAQ Composite 지수
    dow: '^DJI',       // Dow Jones Industrial Average 지수
    nikkei: '^N225',   // Nikkei 225 지수
  }

  const [sp500Quote, nasdaqQuote, dowQuote, nikkeiQuote] = await Promise.all([
    fetchYahooQuote(symbols.sp500),
    fetchYahooQuote(symbols.nasdaq),
    fetchYahooQuote(symbols.dow),
    fetchYahooQuote(symbols.nikkei),
  ])

  return {
    sp500: quoteToIndicator('S&P 500', sp500Quote),
    nasdaq: quoteToIndicator('NASDAQ', nasdaqQuote),
    dow: quoteToIndicator('Dow Jones', dowQuote),
    nikkei: quoteToIndicator('Nikkei 225', nikkeiQuote),
  }
}
