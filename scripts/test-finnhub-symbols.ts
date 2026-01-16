/**
 * Finnhub API 심볼 테스트
 * 다양한 심볼 형식을 시도하여 무료 플랜에서 지원하는 형식 찾기
 */

const API_KEY = 'd5kv8vhr01qt47mfomh0d5kv8vhr01qt47mfomhg'
const BASE_URL = 'https://finnhub.io/api/v1'

interface TestResult {
  symbol: string
  status: number
  success: boolean
  data?: any
  error?: string
}

async function testSymbol(symbol: string): Promise<TestResult> {
  try {
    const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${API_KEY}`
    const response = await fetch(url)

    const data = await response.json()

    return {
      symbol,
      status: response.status,
      success: response.ok && data.c !== 0,
      data: response.ok ? data : undefined,
      error: !response.ok ? JSON.stringify(data) : undefined,
    }
  } catch (error) {
    return {
      symbol,
      status: 0,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

async function testAllSymbols() {
  console.log('🔍 Finnhub API 심볼 테스트 시작...\n')
  console.log(`API Key: ${API_KEY.substring(0, 10)}...\n`)

  // 주식 지수 심볼 후보들
  const indexSymbols = [
    // Yahoo Finance 형식
    '^GSPC', // S&P 500
    '^IXIC', // NASDAQ
    '^DJI', // Dow Jones
    '^N225', // Nikkei

    // US Exchanges
    'SPY', // S&P 500 ETF
    'QQQ', // NASDAQ ETF
    'DIA', // Dow Jones ETF

    // 심볼 코드만
    'GSPC',
    'IXIC',
    'DJI',
    'N225',
  ]

  // 암호화폐 심볼 후보들
  const cryptoSymbols = [
    'BINANCE:BTCUSDT',
    'BINANCE:ETHUSDT',
    'BINANCE:XRPUSDT',
    'BINANCE:ADAUSDT',
    'BTCUSDT',
    'ETHUSDT',
    'BTC-USD',
    'ETH-USD',
  ]

  console.log('📊 주식 지수 테스트:\n')
  for (const symbol of indexSymbols) {
    const result = await testSymbol(symbol)
    if (result.success) {
      console.log(
        `✅ ${symbol.padEnd(20)} → ${result.data.c} (${result.status})`
      )
    } else {
      console.log(
        `❌ ${symbol.padEnd(20)} → ${result.status} ${result.error?.substring(0, 50)}`
      )
    }
    // Rate limit 방지
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log('\n₿ 암호화폐 테스트:\n')
  for (const symbol of cryptoSymbols) {
    const result = await testSymbol(symbol)
    if (result.success) {
      console.log(
        `✅ ${symbol.padEnd(25)} → $${result.data.c} (${result.status})`
      )
    } else {
      console.log(
        `❌ ${symbol.padEnd(25)} → ${result.status} ${result.error?.substring(0, 50)}`
      )
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  // 일반 주식도 테스트 (무료 플랜 확인용)
  console.log('\n🔍 일반 주식 테스트 (무료 플랜 확인):\n')
  const stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA']
  for (const symbol of stockSymbols) {
    const result = await testSymbol(symbol)
    if (result.success) {
      console.log(
        `✅ ${symbol.padEnd(10)} → $${result.data.c} (${result.status})`
      )
    } else {
      console.log(
        `❌ ${symbol.padEnd(10)} → ${result.status} ${result.error?.substring(0, 50)}`
      )
    }
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log('\n✨ 테스트 완료!')
}

testAllSymbols()
