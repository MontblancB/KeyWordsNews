import type { Indicator, ChangeType } from '@/types/economy'

/**
 * CoinGecko API 클라이언트
 * 암호화폐 가격 및 글로벌 시장 데이터 수집
 * API Key 불필요 (무료 플랜)
 */

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3'

/**
 * 변동 타입 판단 (변동률 기준)
 */
function getChangeType(changePercent: number): ChangeType {
  if (changePercent > 0) return 'up'
  if (changePercent < 0) return 'down'
  return 'unchanged'
}

/**
 * 숫자 포맷팅 (USD)
 */
function formatUSD(value: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * 큰 숫자 포맷팅 (조 단위)
 */
function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000_000) {
    // 조 단위
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`
  } else if (value >= 1_000_000_000) {
    // 십억 단위
    return `$${(value / 1_000_000_000).toFixed(2)}B`
  } else if (value >= 1_000_000) {
    // 백만 단위
    return `$${(value / 1_000_000).toFixed(2)}M`
  }
  return `$${value.toLocaleString('en-US')}`
}

/**
 * 퍼센트 포맷팅
 */
function formatPercent(value: number): string {
  return value.toFixed(2)
}

/**
 * CoinGecko Simple Price API
 * 암호화폐 가격 정보 가져오기
 */
export async function fetchCryptoPrices() {
  try {
    const ids = 'bitcoin,ethereum,ripple,cardano'
    const url = `${COINGECKO_BASE_URL}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`)
    }

    const data = await response.json()

    // 데이터 검증
    if (!data.bitcoin || !data.ethereum || !data.ripple || !data.cardano) {
      throw new Error('Invalid CoinGecko response')
    }

    return {
      bitcoin: {
        name: 'Bitcoin (BTC)',
        value: `$${formatUSD(data.bitcoin.usd)}`,
        change: '0', // CoinGecko는 변동폭을 제공하지 않음
        changePercent: formatPercent(data.bitcoin.usd_24h_change || 0),
        changeType: getChangeType(data.bitcoin.usd_24h_change || 0),
      },
      ethereum: {
        name: 'Ethereum (ETH)',
        value: `$${formatUSD(data.ethereum.usd)}`,
        change: '0',
        changePercent: formatPercent(data.ethereum.usd_24h_change || 0),
        changeType: getChangeType(data.ethereum.usd_24h_change || 0),
      },
      ripple: {
        name: 'Ripple (XRP)',
        value: `$${formatUSD(data.ripple.usd)}`,
        change: '0',
        changePercent: formatPercent(data.ripple.usd_24h_change || 0),
        changeType: getChangeType(data.ripple.usd_24h_change || 0),
      },
      cardano: {
        name: 'Cardano (ADA)',
        value: `$${formatUSD(data.cardano.usd)}`,
        change: '0',
        changePercent: formatPercent(data.cardano.usd_24h_change || 0),
        changeType: getChangeType(data.cardano.usd_24h_change || 0),
      },
    }
  } catch (error) {
    console.error('Error fetching crypto prices from CoinGecko:', error)
    throw error
  }
}

/**
 * CoinGecko Global API
 * 글로벌 암호화폐 시장 데이터 가져오기
 */
export async function fetchGlobalCryptoData() {
  try {
    const url = `${COINGECKO_BASE_URL}/global`

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`CoinGecko Global API error: ${response.status}`)
    }

    const result = await response.json()
    const data = result.data

    // 시가총액 변동률 계산
    const marketCapChangePercent =
      data.market_cap_change_percentage_24h_usd || 0

    return {
      totalMarketCap: {
        name: '전체 시가총액',
        value: formatLargeNumber(data.total_market_cap.usd),
        change: '0',
        changePercent: formatPercent(marketCapChangePercent),
        changeType: getChangeType(marketCapChangePercent),
      },
      btcDominance: {
        name: 'BTC 도미넌스',
        value: `${data.market_cap_percentage.btc.toFixed(2)}%`,
        change: '0',
        changePercent: '0',
        changeType: 'unchanged' as ChangeType,
      },
      ethDominance: {
        name: 'ETH 도미넌스',
        value: `${data.market_cap_percentage.eth.toFixed(2)}%`,
        change: '0',
        changePercent: '0',
        changeType: 'unchanged' as ChangeType,
      },
    }
  } catch (error) {
    console.error('Error fetching global crypto data from CoinGecko:', error)
    throw error
  }
}

/**
 * Alternative.me Fear & Greed Index API
 * 공포 및 탐욕 지수 가져오기
 */
export async function fetchFearGreedIndex() {
  try {
    const url = 'https://api.alternative.me/fng/?limit=1'

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Fear & Greed Index API error: ${response.status}`)
    }

    const result = await response.json()
    const data = result.data[0]

    const value = parseInt(data.value)
    let classification = ''
    let changeType: ChangeType = 'unchanged'

    // 분류 및 색상 결정
    if (value >= 75) {
      classification = '극단적 탐욕'
      changeType = 'up' // 빨간색
    } else if (value >= 50) {
      classification = '탐욕'
      changeType = 'up'
    } else if (value >= 25) {
      classification = '공포'
      changeType = 'down' // 파란색
    } else {
      classification = '극단적 공포'
      changeType = 'down'
    }

    return {
      name: '공포·탐욕 지수',
      value: `${value}`,
      change: classification,
      changePercent: '0',
      changeType,
    }
  } catch (error) {
    console.error('Error fetching Fear & Greed Index:', error)
    throw error
  }
}

/**
 * 모든 CoinGecko + Alternative.me 데이터 가져오기 (병렬 처리)
 */
export async function fetchAllCoinGeckoData() {
  const [cryptoPrices, globalData, fearGreed] = await Promise.all([
    fetchCryptoPrices(),
    fetchGlobalCryptoData(),
    fetchFearGreedIndex(),
  ])

  return {
    crypto: cryptoPrices,
    global: globalData,
    fearGreed,
  }
}
