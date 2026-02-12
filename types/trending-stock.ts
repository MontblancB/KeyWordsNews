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
  lastUpdated: string
}
