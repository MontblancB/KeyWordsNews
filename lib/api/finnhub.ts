import type { Indicator, ChangeType } from '@/types/economy'

/**
 * Finnhub API 클라이언트
 * 해외 주식 지수 및 암호화폐 데이터 수집
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
