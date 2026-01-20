'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline'
import StockSearch from './StockSearch'
import StockInfoCard from './StockInfoCard'
import { useStockInfo, useRecentStocks } from '@/hooks/useStock'
import type { StockSearchItem } from '@/types/stock'

export default function StockSection() {
  const [selectedStock, setSelectedStock] = useState<StockSearchItem | null>(null)
  const { recentStocks, addRecentStock, removeRecentStock } = useRecentStocks()
  const { data: stockInfo, isLoading, error } = useStockInfo(selectedStock?.code || null)

  // 종목 선택
  const handleSelectStock = (stock: StockSearchItem) => {
    setSelectedStock(stock)
    addRecentStock(stock)
  }

  // 최근 검색 종목 클릭
  const handleRecentClick = (stock: { code: string; name: string; market: 'KOSPI' | 'KOSDAQ' | 'KONEX' }) => {
    handleSelectStock(stock)
  }

  // 시장 배지 색상
  const getMarketBadgeClass = (market: string) => {
    switch (market) {
      case 'KOSPI':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'KOSDAQ':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  return (
    <div className="space-y-4">
      {/* 종목 검색 */}
      <StockSearch onSelect={handleSelectStock} />

      {/* 종목 정보 표시 */}
      {selectedStock && (
        <div className="space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 dark:border-green-400"></div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-center text-sm">
              종목 정보를 불러오는데 실패했습니다.
            </div>
          )}

          {stockInfo && <StockInfoCard stockInfo={stockInfo} />}
        </div>
      )}

      {/* 최근 검색 종목 */}
      {!selectedStock && recentStocks.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-2">
            <ClockIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              최근 검색
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentStocks.map((stock) => (
              <button
                key={stock.code}
                onClick={() => handleRecentClick(stock)}
                className="group flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {stock.name}
                </span>
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${getMarketBadgeClass(stock.market)}`}
                >
                  {stock.market}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    removeRecentStock(stock.code)
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-full transition-opacity"
                >
                  <XMarkIcon className="w-3 h-3 text-gray-500" />
                </button>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 안내 메시지 (종목 미선택 & 최근 검색 없음) */}
      {!selectedStock && recentStocks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 dark:text-gray-400">
          <MagnifyingGlassIcon className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-center text-sm">
            종목명 또는 종목코드를 입력하여
            <br />
            기업 정보와 재무제표를 확인하세요
          </p>
        </div>
      )}
    </div>
  )
}
