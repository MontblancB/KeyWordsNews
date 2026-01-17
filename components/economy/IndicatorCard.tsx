import type { Indicator } from '@/types/economy'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

interface IndicatorCardProps {
  indicator: Indicator
}

export default function IndicatorCard({ indicator }: IndicatorCardProps) {
  const isUp = indicator.changeType === 'up'
  const isDown = indicator.changeType === 'down'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <div className="text-[10px] text-gray-500 dark:text-gray-400">{indicator.name}</div>
        <div className="flex items-center gap-0.5">
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
        </div>
      </div>
      <div className="text-base font-bold text-gray-900 dark:text-gray-100">{indicator.value}</div>
    </div>
  )
}
