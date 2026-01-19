/**
 * TradingView 심볼 매핑
 * 각 경제지표에 해당하는 TradingView 심볼 정의
 */

export interface TradingViewSymbol {
  symbol: string
  name: string
  exchange?: string
  description?: string
}

// 지표 이름 → TradingView 심볼 매핑
export const TRADINGVIEW_SYMBOLS: Record<string, TradingViewSymbol> = {
  // 국내 지수
  'KOSPI': {
    symbol: 'KRX:KOSPI',
    name: 'KOSPI',
    exchange: 'KRX',
    description: '한국종합주가지수',
  },
  '코스피': {
    symbol: 'KRX:KOSPI',
    name: 'KOSPI',
    exchange: 'KRX',
    description: '한국종합주가지수',
  },
  'KOSDAQ': {
    symbol: 'KRX:KOSDAQ',
    name: 'KOSDAQ',
    exchange: 'KRX',
    description: '코스닥지수',
  },
  '코스닥': {
    symbol: 'KRX:KOSDAQ',
    name: 'KOSDAQ',
    exchange: 'KRX',
    description: '코스닥지수',
  },

  // 해외 지수
  'S&P 500': {
    symbol: 'FOREXCOM:SPXUSD',
    name: 'S&P 500',
    exchange: 'FOREXCOM',
    description: '미국 S&P 500 지수',
  },
  'NASDAQ': {
    symbol: 'NASDAQ:IXIC',
    name: 'NASDAQ',
    exchange: 'NASDAQ',
    description: '미국 나스닥 종합지수',
  },
  '나스닥': {
    symbol: 'NASDAQ:IXIC',
    name: 'NASDAQ',
    exchange: 'NASDAQ',
    description: '미국 나스닥 종합지수',
  },
  'Dow Jones': {
    symbol: 'FOREXCOM:DJI',
    name: 'Dow Jones',
    exchange: 'FOREXCOM',
    description: '미국 다우존스 산업평균지수',
  },
  '다우존스': {
    symbol: 'FOREXCOM:DJI',
    name: 'Dow Jones',
    exchange: 'FOREXCOM',
    description: '미국 다우존스 산업평균지수',
  },
  'Nikkei 225': {
    symbol: 'TVC:NI225',
    name: 'Nikkei 225',
    exchange: 'TVC',
    description: '일본 니케이 225 지수',
  },
  '니케이225': {
    symbol: 'TVC:NI225',
    name: 'Nikkei 225',
    exchange: 'TVC',
    description: '일본 니케이 225 지수',
  },
  '니케이': {
    symbol: 'TVC:NI225',
    name: 'Nikkei 225',
    exchange: 'TVC',
    description: '일본 니케이 225 지수',
  },

  // 환율
  'USD/KRW': {
    symbol: 'FX_IDC:USDKRW',
    name: 'USD/KRW',
    exchange: 'FX_IDC',
    description: '미국 달러/원화 환율',
  },
  '달러/원': {
    symbol: 'FX_IDC:USDKRW',
    name: 'USD/KRW',
    exchange: 'FX_IDC',
    description: '미국 달러/원화 환율',
  },
  'JPY(100)/KRW': {
    symbol: 'FX_IDC:JPYKRW',
    name: 'JPY/KRW',
    exchange: 'FX_IDC',
    description: '일본 엔/원화 환율 (100엔)',
  },
  'JPY/KRW': {
    symbol: 'FX_IDC:JPYKRW',
    name: 'JPY/KRW',
    exchange: 'FX_IDC',
    description: '일본 엔/원화 환율 (100엔)',
  },
  '엔/원': {
    symbol: 'FX_IDC:JPYKRW',
    name: 'JPY/KRW',
    exchange: 'FX_IDC',
    description: '일본 엔/원화 환율 (100엔)',
  },
  'EUR/KRW': {
    symbol: 'FX_IDC:EURKRW',
    name: 'EUR/KRW',
    exchange: 'FX_IDC',
    description: '유로/원화 환율',
  },
  '유로/원': {
    symbol: 'FX_IDC:EURKRW',
    name: 'EUR/KRW',
    exchange: 'FX_IDC',
    description: '유로/원화 환율',
  },
  'CNY/KRW': {
    symbol: 'FX_IDC:CNYKRW',
    name: 'CNY/KRW',
    exchange: 'FX_IDC',
    description: '중국 위안/원화 환율',
  },
  '위안/원': {
    symbol: 'FX_IDC:CNYKRW',
    name: 'CNY/KRW',
    exchange: 'FX_IDC',
    description: '중국 위안/원화 환율',
  },

  // 금시세
  '국제 금': {
    symbol: 'TVC:GOLD',
    name: 'Gold',
    exchange: 'TVC',
    description: '국제 금 시세 (USD/oz)',
  },
  'Gold': {
    symbol: 'TVC:GOLD',
    name: 'Gold',
    exchange: 'TVC',
    description: '국제 금 시세 (USD/oz)',
  },

  // 암호화폐
  'Bitcoin (BTC)': {
    symbol: 'BINANCE:BTCUSDT',
    name: 'Bitcoin',
    exchange: 'BINANCE',
    description: '비트코인/USDT',
  },
  'Bitcoin': {
    symbol: 'BINANCE:BTCUSDT',
    name: 'Bitcoin',
    exchange: 'BINANCE',
    description: '비트코인/USDT',
  },
  '비트코인': {
    symbol: 'BINANCE:BTCUSDT',
    name: 'Bitcoin',
    exchange: 'BINANCE',
    description: '비트코인/USDT',
  },
  'BTC': {
    symbol: 'BINANCE:BTCUSDT',
    name: 'Bitcoin',
    exchange: 'BINANCE',
    description: '비트코인/USDT',
  },
  'Ethereum (ETH)': {
    symbol: 'BINANCE:ETHUSDT',
    name: 'Ethereum',
    exchange: 'BINANCE',
    description: '이더리움/USDT',
  },
  'Ethereum': {
    symbol: 'BINANCE:ETHUSDT',
    name: 'Ethereum',
    exchange: 'BINANCE',
    description: '이더리움/USDT',
  },
  '이더리움': {
    symbol: 'BINANCE:ETHUSDT',
    name: 'Ethereum',
    exchange: 'BINANCE',
    description: '이더리움/USDT',
  },
  'ETH': {
    symbol: 'BINANCE:ETHUSDT',
    name: 'Ethereum',
    exchange: 'BINANCE',
    description: '이더리움/USDT',
  },

  // 암호화폐 도미넌스
  'BTC 도미넌스': {
    symbol: 'CRYPTOCAP:BTC.D',
    name: 'BTC Dominance',
    exchange: 'CRYPTOCAP',
    description: '비트코인 시장 점유율',
  },
  'ETH 도미넌스': {
    symbol: 'CRYPTOCAP:ETH.D',
    name: 'ETH Dominance',
    exchange: 'CRYPTOCAP',
    description: '이더리움 시장 점유율',
  },

  // 글로벌 암호화폐 시장
  '전체 시가총액': {
    symbol: 'CRYPTOCAP:TOTAL',
    name: 'Total Crypto Market Cap',
    exchange: 'CRYPTOCAP',
    description: '전체 암호화폐 시가총액',
  },
  '시가총액': {
    symbol: 'CRYPTOCAP:TOTAL',
    name: 'Total Crypto Market Cap',
    exchange: 'CRYPTOCAP',
    description: '전체 암호화폐 시가총액',
  },
}

/**
 * 지표 이름으로 TradingView 심볼 조회
 */
export function getTradingViewSymbol(indicatorName: string): TradingViewSymbol | null {
  // 직접 매핑 확인
  if (TRADINGVIEW_SYMBOLS[indicatorName]) {
    return TRADINGVIEW_SYMBOLS[indicatorName]
  }

  // 부분 매칭 시도
  const lowerName = indicatorName.toLowerCase()

  for (const [key, value] of Object.entries(TRADINGVIEW_SYMBOLS)) {
    if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
      return value
    }
  }

  return null
}

/**
 * 차트 지원 여부 확인
 * 공포탐욕지수는 TradingView에서 지원하지 않음
 */
export function isChartSupported(indicatorName: string): boolean {
  const unsupportedIndicators = [
    '공포·탐욕 지수',
    '공포탐욕',
  ]

  return !unsupportedIndicators.some(
    (name) => indicatorName.includes(name) || name.includes(indicatorName)
  )
}
