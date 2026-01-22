/**
 * 주식 관련 타입 정의
 */

import type { ChangeType } from './economy'

// 종목 검색 결과 아이템
export interface StockSearchItem {
  code: string // 종목코드 (005930 또는 AAPL)
  name: string // 종목명 (삼성전자 또는 Apple Inc.)
  market: 'KOSPI' | 'KOSDAQ' | 'KONEX' | 'NASDAQ' | 'NYSE' | 'AMEX' | 'US' // 시장구분
  symbol?: string // 전체 심볼 (AAPL, 005930.KS)
}

// 주식 시세 정보
export interface StockPrice {
  current: string // 현재가
  change: string // 변동값
  changePercent: string // 변동률
  changeType: ChangeType // 변동 방향
  high: string // 고가
  low: string // 저가
  open: string // 시가
  volume: string // 거래량
  prevClose: string // 전일 종가
}

// 기업 정보
export interface CompanyInfo {
  industry: string // 업종
  ceo: string // 대표자
  establishedDate: string // 설립일
  fiscalMonth: string // 결산월
  employees: string // 직원수
  marketCap: string // 시가총액
  headquarters: string // 본사 소재지
  website: string // 홈페이지
  // 추가 정보
  faceValue: string // 액면가
  listedDate: string // 상장일
  listedShares: string // 상장주식수
  foreignOwnership: string // 외국인 지분율
  capital: string // 자본금
}

// 투자 지표
export interface InvestmentIndicators {
  per: string // PER (주가수익비율)
  pbr: string // PBR (주가순자산비율)
  eps: string // EPS (주당순이익)
  bps: string // BPS (주당순자산)
  roe: string // ROE (자기자본이익률)
  dividendYield: string // 배당수익률
  // 추가 지표
  week52High: string // 52주 최고가
  week52Low: string // 52주 최저가
  psr: string // PSR (주가매출비율)
  dps: string // DPS (주당배당금)
}

// 재무제표 데이터
export interface FinancialData {
  period: string // 기간 (2024.3Q, 2024)
  periodType: 'quarterly' | 'annual' // 분기/연간
  revenue: string // 매출액
  operatingProfit: string // 영업이익
  netIncome: string // 당기순이익
  operatingMargin: string // 영업이익률
  netMargin: string // 순이익률
  // 추가 재무 지표
  totalAssets: string // 자산총계
  totalLiabilities: string // 부채총계
  totalEquity: string // 자본총계
  debtRatio: string // 부채비율
}

// 종목 전체 정보
export interface StockInfo {
  code: string
  name: string
  market: 'KOSPI' | 'KOSDAQ' | 'KONEX' | 'NASDAQ' | 'NYSE' | 'AMEX' | 'US'
  symbol?: string // 전체 심볼 (AAPL, 005930.KS)
  price: StockPrice
  company: CompanyInfo
  indicators: InvestmentIndicators
  financials: FinancialData[]
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
  market: 'KOSPI' | 'KOSDAQ' | 'KONEX' | 'NASDAQ' | 'NYSE' | 'AMEX' | 'US'
  symbol?: string
  searchedAt: string
}
