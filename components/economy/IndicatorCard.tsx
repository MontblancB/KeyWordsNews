import type { Indicator } from '@/types/economy'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'

interface IndicatorCardProps {
  indicator: Indicator
}

export default function IndicatorCard({ indicator }: IndicatorCardProps) {
  const isUp = indicator.changeType === 'up'
  const isDown = indicator.changeType === 'down'

  return (
    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
      <div className="text-xs text-gray-500 mb-1">{indicator.name}</div>
      <div className="text-2xl font-bold mb-2">{indicator.value}</div>
      <div className="flex items-center gap-2">
        {isUp && (
          <>
            <ArrowUpIcon className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium text-red-500">
              {indicator.change}
            </span>
            <span className="text-sm text-red-500">
              ({indicator.changePercent}%)
            </span>
          </>
        )}
        {isDown && (
          <>
            <ArrowDownIcon className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-500">
              {indicator.change}
            </span>
            <span className="text-sm text-blue-500">
              ({indicator.changePercent}%)
            </span>
          </>
        )}
        {!isUp && !isDown && (
          <span className="text-sm text-gray-500">변동 없음</span>
        )}
      </div>
    </div>
  )
}
