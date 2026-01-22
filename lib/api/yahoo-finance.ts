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

/**
 * Lightweight Charts용 OHLC 데이터
 */
export interface OHLCData {
  time: number // Unix timestamp (seconds)
  open: number
  high: number
  low: number
  close: number
  volume?: number
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

/**
 * 은 시세 가져오기 (Yahoo Finance) - 원화/g 단위로 변환
 *
 * 변환 공식:
 * - 1 troy ounce = 31.1035 grams
 * - KRW/g = (USD/oz * USD_KRW_rate) / 31.1035
 */
export async function fetchSilverPrice(): Promise<Indicator> {
  try {
    // 은 가격(USD/oz)과 환율(USD/KRW)을 병렬로 가져오기
    const [silverQuote, usdKrwQuote] = await Promise.all([
      fetchYahooQuote('SI=F'),      // Silver Futures (USD/oz)
      fetchYahooQuote('KRW=X'),     // USD/KRW 환율
    ])

    if (!silverQuote || !usdKrwQuote) {
      return {
        name: '국제 은',
        value: '데이터 없음',
        change: '0',
        changePercent: '0',
        changeType: 'unchanged',
      }
    }

    // USD/oz → KRW/g 변환
    const TROY_OUNCE_TO_GRAM = 31.1035
    const usdKrwRate = usdKrwQuote.regularMarketPrice

    // 현재가 변환
    const priceKrwPerGram = (silverQuote.regularMarketPrice * usdKrwRate) / TROY_OUNCE_TO_GRAM

    // 변동값 변환 (어제 환율과 오늘 환율 차이는 무시하고 현재 환율로 계산)
    const changeKrwPerGram = (silverQuote.regularMarketChange * usdKrwRate) / TROY_OUNCE_TO_GRAM

    const value = Math.round(priceKrwPerGram).toLocaleString('ko-KR')
    const change = Math.abs(Math.round(changeKrwPerGram)).toLocaleString('ko-KR')
    const changePercent = Math.abs(silverQuote.regularMarketChangePercent).toFixed(2)
    const changeType = getChangeType(silverQuote.regularMarketChange)

    return {
      name: '국제 은',
      value: `${value}원/g`,
      change: silverQuote.regularMarketChange >= 0 ? `+${change}` : `-${change}`,
      changePercent: silverQuote.regularMarketChangePercent >= 0 ? `+${changePercent}` : `-${changePercent}`,
      changeType,
    }
  } catch (error) {
    console.error('Error fetching silver price:', error)
    return {
      name: '국제 은',
      value: '데이터 없음',
      change: '0',
      changePercent: '0',
      changeType: 'unchanged',
    }
  }
}

/**
 * 개별 종목 과거 데이터 가져오기
 * Lightweight Charts용 OHLC 데이터
 */
export async function fetchStockHistory(
  stockCode: string,
  market: 'KOSPI' | 'KOSDAQ' | 'US' = 'KOSPI',
  range: '1d' | '5d' | '1mo' | '3mo' | '1y' | '2y' | '5y' = '3mo',
  intervalParam?: string
): Promise<OHLCData[]> {
  try {
    // Yahoo Finance 심볼
    let symbol: string
    if (market === 'US') {
      // 미국 주식은 그대로 사용
      symbol = stockCode
    } else {
      // 한국 주식: {종목코드}.KS (KOSPI) or {종목코드}.KQ (KOSDAQ)
      const suffix = market === 'KOSPI' ? '.KS' : '.KQ'
      symbol = `${stockCode}${suffix}`
    }

    // interval 결정
    let interval: string
    if (intervalParam) {
      switch (intervalParam) {
        case '1m':
          interval = '1m'
          break
        case '5m':
          interval = '5m'
          break
        case '15m':
          interval = '15m'
          break
        case '30m':
          interval = '30m'
          break
        case '1h':
          interval = '1h'
          break
        case '1d':
          interval = '1d'
          break
        case '1w':
          interval = '1wk'
          break
        default:
          interval = '1d'
      }
    } else {
      // range 기반 interval 결정
      switch (range) {
        case '1d':
          interval = '5m'
          break
        case '5d':
          interval = '15m'
          break
        case '1mo':
          interval = '1h'
          break
        case '3mo':
        case '1y':
        case '2y':
          interval = '1d'
          break
        case '5y':
          interval = '1wk'
          break
        default:
          interval = '1d'
      }
    }

    console.log(`[Yahoo Finance] Fetching ${symbol} history: range=${range}, interval=${interval}`)

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`

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
      console.warn(`No chart data for ${symbol}`)
      return []
    }

    const timestamps = result.timestamp || []
    const quote = result.indicators?.quote?.[0]

    if (!quote || !timestamps.length) {
      console.warn(`No OHLC data for ${symbol}`)
      return []
    }

    const { open, high, low, close, volume } = quote

    // OHLC 데이터 변환
    const ohlcData: OHLCData[] = []
    for (let i = 0; i < timestamps.length; i++) {
      // null 값 체크
      if (
        open[i] != null &&
        high[i] != null &&
        low[i] != null &&
        close[i] != null
      ) {
        ohlcData.push({
          time: timestamps[i],
          open: open[i],
          high: high[i],
          low: low[i],
          close: close[i],
          volume: volume?.[i] ?? undefined,
        })
      }
    }

    console.log(`[Yahoo Finance] ✅ Fetched ${ohlcData.length} candles for ${symbol}`)
    return ohlcData
  } catch (error) {
    console.error(`Error fetching ${stockCode} history:`, error)
    return []
  }
}

/**
 * 국내 지수 (KOSPI/KOSDAQ) 과거 데이터 가져오기
 * Lightweight Charts용 OHLC 데이터
 */
export async function fetchKoreanIndexHistory(
  indexCode: 'KOSPI' | 'KOSDAQ',
  range: '1d' | '5d' | '1mo' | '3mo' | '1y' | '2y' | '5y' = '3mo',
  intervalParam?: string
): Promise<OHLCData[]> {
  try {
    // Yahoo Finance 심볼
    const symbol = indexCode === 'KOSPI' ? '^KS11' : '^KQ11'

    // interval 결정 (파라미터가 있으면 사용, 없으면 range 기반)
    let interval: string
    if (intervalParam) {
      // 파라미터로 받은 interval을 Yahoo Finance 형식으로 변환
      switch (intervalParam) {
        case '1m':
          interval = '1m'
          break
        case '5m':
          interval = '5m'
          break
        case '15m':
          interval = '15m'
          break
        case '30m':
          interval = '30m'
          break
        case '1h':
          interval = '1h'
          break
        case '4h':
          // Yahoo Finance는 4h를 공식 지원하지 않음 → 1d로 폴백
          console.warn('[Yahoo Finance] 4h interval not supported, falling back to 1d')
          interval = '1d'
          break
        case '1d':
          interval = '1d'
          break
        case '1w':
          interval = '1wk'
          break
        default:
          interval = '1d'
      }
    } else {
      // range 기반 interval 결정 (폴백)
      switch (range) {
        case '1d':
          interval = '5m'
          break
        case '5d':
          interval = '15m'
          break
        case '1mo':
          interval = '1h'
          break
        case '3mo':
        case '1y':
        case '2y':
          interval = '1d'
          break
        case '5y':
          interval = '1wk'
          break
        default:
          interval = '1d'
      }
    }

    console.log(`[Yahoo Finance] Fetching ${symbol} history: range=${range}, interval=${interval}`)

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`

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
      console.warn(`No chart data for ${symbol}`)
      return []
    }

    const timestamps = result.timestamp || []
    const quote = result.indicators?.quote?.[0]

    if (!quote || !timestamps.length) {
      console.warn(`No OHLC data for ${symbol}`)
      return []
    }

    const { open, high, low, close, volume } = quote

    // OHLC 데이터 변환
    const ohlcData: OHLCData[] = []
    for (let i = 0; i < timestamps.length; i++) {
      // null 값 체크
      if (
        open[i] != null &&
        high[i] != null &&
        low[i] != null &&
        close[i] != null
      ) {
        ohlcData.push({
          time: timestamps[i],
          open: open[i],
          high: high[i],
          low: low[i],
          close: close[i],
          volume: volume?.[i] ?? undefined,
        })
      }
    }

    console.log(`[Yahoo Finance] ✅ Fetched ${ohlcData.length} candles for ${symbol}`)
    return ohlcData
  } catch (error) {
    console.error(`Error fetching ${indexCode} history:`, error)
    return []
  }
}
