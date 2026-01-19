'use client'

import type { Indicator } from '@/types/economy'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'
import { ChartBarIcon } from '@heroicons/react/24/outline'
import { isChartSupported } from '@/lib/tradingview/symbols'

interface IndicatorCardProps {
  indicator: Indicator
  onClick?: (indicator: Indicator) => void
}

export default function IndicatorCard({ indicator, onClick }: IndicatorCardProps) {
  const isUp = indicator.changeType === 'up'
  const isDown = indicator.changeType === 'down'
  const isFearGreed = indicator.name === '공포·탐욕 지수'
  const hasChart = isChartSupported(indicator.name)

  const handleClick = () => {
    if (onClick) {
      onClick(indicator)
    }
  }

  return (
    <div
      onClick={handleClick}
      className={`bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700 shadow-sm ${
        onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98] transition-all' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] text-gray-500 dark:text-gray-400">{indicator.name}</div>
        {hasChart && onClick && (
          <ChartBarIcon className="w-3 h-3 text-gray-400 dark:text-gray-500" />
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="text-base font-bold text-gray-900 dark:text-gray-100">{indicator.value}</div>
        <div className="flex items-center gap-0.5">
          {isFearGreed ? (
            // 공포·탐욕 지수는 분류 텍스트 표시
            <span
              className={`text-[10px] font-medium ${
                isUp
                  ? 'text-red-500 dark:text-red-400'
                  : 'text-blue-500 dark:text-blue-400'
              }`}
            >
              {indicator.change}
            </span>
          ) : (
            <>
              {isUp && (
                <>
                  <ArrowUpIcon className="w-3 h-3 text-red-500 dark:text-red-400" />
                  <span className="text-[10px] font-medium text-red-500 dark:text-red-400">
                    {indicator.changePercent}%
                  </span>
                </>
              )}
              {isDown && (
                <>
                  <ArrowDownIcon className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                  <span className="text-[10px] font-medium text-blue-500 dark:text-blue-400">
                    {indicator.changePercent}%
                  </span>
                </>
              )}
              {!isUp && !isDown && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400">-</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
