'use client'

import { useFontSize } from '@/hooks/useFontSize'
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline'

export default function FontSizeControl() {
  const { fontSize, canIncrease, canDecrease, increase, decrease, reset } = useFontSize()

  const sizeLabel = () => {
    if (fontSize === 12) return '매우 작게'
    if (fontSize === 14) return '작게'
    if (fontSize === 16) return '보통'
    if (fontSize === 18) return '크게'
    if (fontSize === 20) return '매우 크게'
    return '보통'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
          폰트 크기
        </h3>
        <button
          onClick={reset}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          초기화
        </button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={decrease}
            disabled={!canDecrease}
            className={`p-2 rounded-lg ${
              canDecrease
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
            aria-label="폰트 크기 줄이기"
          >
            <MinusIcon className="w-5 h-5" />
          </button>

          <div className="text-center min-w-[80px]">
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {fontSize}px
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {sizeLabel()}
            </div>
          </div>

          <button
            onClick={increase}
            disabled={!canIncrease}
            className={`p-2 rounded-lg ${
              canIncrease
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
            }`}
            aria-label="폰트 크기 늘리기"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          실시간 적용
        </div>
      </div>
    </div>
  )
}
