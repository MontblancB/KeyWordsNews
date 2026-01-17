'use client'

import { useState } from 'react'
import { useFontSize } from '@/hooks/useFontSize'
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { DocumentTextIcon } from '@heroicons/react/24/solid'

export default function FontSizeControl() {
  const { fontSize, canIncrease, canDecrease, increase, decrease, reset } = useFontSize()
  const [isExpanded, setIsExpanded] = useState(false)

  const sizeLabel = () => {
    if (fontSize === 12) return '매우 작게'
    if (fontSize === 14) return '작게'
    if (fontSize === 16) return '보통'
    if (fontSize === 18) return '크게'
    if (fontSize === 20) return '매우 크게'
    return '보통'
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      {/* 헤더 (클릭 가능) */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <DocumentTextIcon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            폰트 크기
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {sizeLabel()}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* 확장된 내용 */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                현재: {sizeLabel()}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  reset()
                }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                초기화
              </button>
            </div>

            {/* 조절 버튼 (오른쪽 배치) */}
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  decrease()
                }}
                disabled={!canDecrease}
                className={`p-2 rounded-lg ${
                  canDecrease
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                }`}
                aria-label="폰트 크기 줄이기"
              >
                <MinusIcon className="w-5 h-5" />
              </button>

              <div className="text-center min-w-[60px]">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {fontSize}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  px
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation()
                  increase()
                }}
                disabled={!canIncrease}
                className={`p-2 rounded-lg ${
                  canIncrease
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
                }`}
                aria-label="폰트 크기 늘리기"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            텍스트 크기만 변경됩니다 (레이아웃 유지)
          </p>
        </div>
      )}
    </div>
  )
}
