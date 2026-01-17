import type { Indicator } from '@/types/economy'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

interface IndicatorCardProps {
  indicator: Indicator
}

export default function IndicatorCard({ indicator }: IndicatorCardProps) {
  const isUp = indicator.changeType === 'up'
  const isDown = indicator.changeType === 'down'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">{indicator.name}</div>
      <div className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">{indicator.value}</div>
      <div className="flex items-center gap-0.5">
        {isUp && (
          <>
            <ArrowUpIcon className="w-4 h-4 text-red-500 dark:text-red-400" />
            <span className="text-xs font-medium text-red-500 dark:text-red-400">
              {indicator.change}
            </span>
            <span className="text-xs text-red-500 dark:text-red-400">
              ({indicator.changePercent}%)
            </span>
          </>
        )}
        {isDown && (
          <>
            <ArrowDownIcon className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span className="text-xs font-medium text-blue-500 dark:text-blue-400">
              {indicator.change}
            </span>
            <span className="text-xs text-blue-500 dark:text-blue-400">
              ({indicator.changePercent}%)
            </span>
          </>
        )}
        {!isUp && !isDown && (
          <span className="text-xs text-gray-500 dark:text-gray-400">변동 없음</span>
        )}
      </div>
    </div>
  )
}
