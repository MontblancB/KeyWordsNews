// 주식 종목 검색 결과
export interface StockSearchResult {
  code: string // 종목 코드 (예: 005930)
  name: string // 종목명 (예: 삼성전자)
  market: 'KOSPI' | 'KOSDAQ' // 시장 구분
}

// 주식 기본 정보
export interface StockBasicInfo {
  code: string // 종목 코드
  name: string // 종목명
  market: 'KOSPI' | 'KOSDAQ' // 시장 구분
  sector: string // 업종
  currentPrice: string // 현재가
  change: string // 전일 대비 변동
  changePercent: string // 변동률
  changeType: 'up' | 'down' | 'unchanged' // 변동 방향
  marketCap: string // 시가총액
  volume: string // 거래량
  high52week: string // 52주 최고
  low52week: string // 52주 최저
}

// 재무제표 데이터 (연간)
export interface FinancialStatement {
  year: string // 연도 (예: 2024)
  revenue: string // 매출액
  operatingProfit: string // 영업이익
  netIncome: string // 당기순이익
  operatingMargin: string // 영업이익률
  netMargin: string // 순이익률
}

// 투자 지표
export interface InvestmentMetrics {
  per: string // PER (주가수익비율)
  pbr: string // PBR (주가순자산비율)
  eps: string // EPS (주당순이익)
  bps: string // BPS (주당순자산)
  dividendYield: string // 배당수익률
  roe: string // ROE (자기자본이익률)
}

// 주식 전체 정보
export interface StockInfo {
  basic: StockBasicInfo
  financials: FinancialStatement[]
  metrics: InvestmentMetrics
  lastUpdated: string
}

// API 응답 타입
export interface StockSearchResponse {
  success: boolean
  data: StockSearchResult[]
  error?: string
}

export interface StockInfoResponse {
  success: boolean
  data: StockInfo | null
  error?: string
}
