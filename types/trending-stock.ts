/**
 * 실시간 주목 종목 타입 정의
 */

import type { ChangeType } from './economy'

export interface TrendingStockItem {
  rank: number
  code: string          // "005930"
  name: string          // "삼성전자"
  price: string         // "81,200"
  change: string        // "+1,200"
  changePercent: string // "+1.50"
  changeType: ChangeType
  volume: string        // "12,345,678"
}

export type TrendingCategory = 'volume' | 'gainers' | 'losers'

export interface TrendingStocksData {
  volume: TrendingStockItem[]   // 거래량 상위 10
  gainers: TrendingStockItem[]  // 상승률 상위 10
  losers: TrendingStockItem[]   // 하락률 상위 10
  marketOpen: boolean           // 현재 장 운영 여부
  tradingDate: string           // 기준 거래일 (예: "2026-02-12")
  lastUpdated: string
}
