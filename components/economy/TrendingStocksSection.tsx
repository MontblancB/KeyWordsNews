'use client'

import { useState } from 'react'
import { FireIcon } from '@heroicons/react/24/outline'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'
import { useTrendingStocks } from '@/hooks/useTrendingStocks'
import { useColorTheme } from '@/hooks/useColorTheme'
import type { TrendingStockItem, TrendingCategory } from '@/types/trending-stock'

interface TrendingStocksSectionProps {
  onStockClick?: (code: string, name: string) => void
}

const SUB_TABS: { id: TrendingCategory; label: string }[] = [
  { id: 'volume', label: '거래대금' },
  { id: 'gainers', label: '상승' },
  { id: 'losers', label: '하락' },
]

function formatPrice(priceStr: string): string {
  return `${priceStr}원`
}

function formatTradingDate(dateStr: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = weekdays[date.getDay()]
  return `${month}/${day}(${weekday}) 종가 기준`
}

function StockRow({
  item,
  onClick,
}: {
  item: TrendingStockItem
  onClick?: (code: string, name: string) => void
}) {
  const isUp = item.changeType === 'up'
  const isDown = item.changeType === 'down'

  return (
    <button
      onClick={() => onClick?.(item.code, item.name)}
      className="w-full flex items-center gap-1.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 active:bg-gray-100 dark:active:bg-gray-700 transition-colors rounded-lg"
    >
      {/* 순위 */}
      <span className="w-5 text-xs font-bold text-gray-400 dark:text-gray-500 text-center shrink-0">
        {item.rank}
      </span>

      {/* 종목명 */}
      <span className="flex-1 text-sm font-medium text-gray-900 dark:text-gray-100 text-left truncate">
        {item.name}
      </span>

      {/* 현재가 */}
      <span className="text-xs font-semibold text-gray-900 dark:text-gray-100 tabular-nums shrink-0">
        {formatPrice(item.price)}
      </span>

      {/* 등락률 */}
      <span
        className={`w-14 text-right text-[11px] font-medium tabular-nums shrink-0 flex items-center justify-end gap-0.5 ${
          isUp
            ? 'text-red-500 dark:text-red-400'
            : isDown
              ? 'text-blue-500 dark:text-blue-400'
              : 'text-gray-500 dark:text-gray-400'
        }`}
      >
        {isUp && <ArrowUpIcon className="w-3 h-3" />}
        {isDown && <ArrowDownIcon className="w-3 h-3" />}
        {item.changePercent}%
      </span>

      {/* 거래대금 */}
      <span className="w-16 text-right text-[10px] text-gray-500 dark:text-gray-400 tabular-nums shrink-0">
        {item.tradingValue}
      </span>
    </button>
  )
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <div className="w-5 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="w-16 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="w-14 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  )
}

export default function TrendingStocksSection({ onStockClick }: TrendingStocksSectionProps) {
  const [activeCategory, setActiveCategory] = useState<TrendingCategory>('volume')
  const { data, isLoading, error } = useTrendingStocks()
  const { buttonClasses } = useColorTheme()

  const items: TrendingStockItem[] = data ? data[activeCategory] : []
  const isMarketClosed = data && !data.marketOpen
  const tradingDateLabel = data?.tradingDate ? formatTradingDate(data.tradingDate) : ''

  return (
    <section>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <FireIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            실시간 주요 종목
          </h2>
        </div>
        {/* 장 마감 시 거래일 표시 */}
        {isMarketClosed && tradingDateLabel && (
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            {tradingDateLabel}
          </span>
        )}
      </div>

      {/* 서브탭 */}
      <div className="flex gap-1.5 mb-2">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveCategory(tab.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeCategory === tab.id
                ? buttonClasses
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 리스트 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading && (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        )}

        {error && !data && (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            데이터를 불러올 수 없습니다
          </div>
        )}

        {items.length > 0 && (
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {items.map((item) => (
              <StockRow
                key={item.code}
                item={item}
                onClick={onStockClick}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && items.length === 0 && data && (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            데이터를 준비 중입니다. 장 시작 후 자동으로 업데이트됩니다.
          </div>
        )}
      </div>
    </section>
  )
}
