/**
 * 주식 관련 타입 정의
 */

import type { ChangeType } from './economy'

// 종목 검색 결과 아이템
export interface StockSearchItem {
  code: string // 종목코드 (005930)
  name: string // 종목명 (삼성전자)
  market: 'KOSPI' | 'KOSDAQ' | 'KONEX' // 시장구분
}

// 기본 주식 정보 (StockInfo.basic)
export interface StockBasicInfo {
  code: string // 종목코드
  name: string // 종목명
  market: 'KOSPI' | 'KOSDAQ' | 'KONEX' // 시장구분
  sector: string // 업종
  currentPrice: string // 현재가
  change: string // 변동값
  changePercent: string // 변동률
  changeType: ChangeType // 변동 방향
  marketCap: string // 시가총액
  volume: string // 거래량
  high52week: string // 52주 최고
  low52week: string // 52주 최저
}

// 투자 지표 (StockInfo.metrics)
export interface StockMetrics {
  per: string // PER (주가수익비율)
  pbr: string // PBR (주가순자산비율)
  roe: string // ROE (자기자본이익률)
  eps: string // EPS (주당순이익)
  bps: string // BPS (주당순자산)
  dividendYield: string // 배당수익률
}

// 재무제표 데이터 (StockInfo.financials)
export interface StockFinancialData {
  year: string // 연도 (2024, 2023, ...)
  revenue: string // 매출액
  operatingProfit: string // 영업이익
  netIncome: string // 당기순이익
  operatingMargin: string // 영업이익률
}

// 종목 전체 정보
export interface StockInfo {
  basic: StockBasicInfo
  metrics: StockMetrics
  financials: StockFinancialData[]
  lastUpdated: string
}

// API 응답 타입
export interface StockSearchResponse {
  success: boolean
  data: StockSearchItem[]
  error?: string
}

export interface StockInfoResponse {
  success: boolean
  data: StockInfo
  cached?: boolean
  error?: string
}

// 최근 검색 종목 (localStorage용)
export interface RecentStock {
  code: string
  name: string
  market: 'KOSPI' | 'KOSDAQ' | 'KONEX'
  searchedAt: string
}
