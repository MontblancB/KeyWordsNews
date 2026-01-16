/**
 * 경제 지표 타입 정의
 */

// 지수 변동 타입
export type ChangeType = 'up' | 'down' | 'unchanged'

// 개별 지표 데이터
export interface Indicator {
  name: string
  value: string
  change: string
  changePercent: string
  changeType: ChangeType
}

// 국내 지수
export interface DomesticIndices {
  kospi: Indicator
  kosdaq: Indicator
}

// 해외 지수
export interface InternationalIndices {
  sp500: Indicator
  nasdaq: Indicator
  dow: Indicator
  nikkei: Indicator
}

// 환율
export interface ExchangeRates {
  usdKrw: Indicator
  jpyKrw: Indicator
  eurKrw: Indicator
  cnyKrw: Indicator
}

// 금시세
export interface GoldPrice {
  international: Indicator
}

// 전체 경제 지표 데이터
export interface EconomyData {
  domestic: DomesticIndices
  international: InternationalIndices
  exchange: ExchangeRates
  gold: GoldPrice
  lastUpdated: string
}
