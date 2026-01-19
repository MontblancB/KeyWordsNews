'use client'

import { useNewsInsightSettings } from '@/hooks/useNewsInsightSettings'
import { LightBulbIcon } from '@heroicons/react/24/outline'
import { LightBulbIcon as LightBulbIconSolid } from '@heroicons/react/24/solid'

export default function NewsInsightToggle() {
  const { isEnabled, isLoaded, toggleEnabled } = useNewsInsightSettings()

  if (!isLoaded) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LightBulbIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              전문가 의견
            </span>
          </div>
          <div className="w-12 h-7 bg-gray-300 rounded-full animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isEnabled ? (
            <LightBulbIconSolid className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          ) : (
            <LightBulbIcon className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              전문가 의견
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              뉴스 카테고리에 맞는 전문가 분석
            </p>
          </div>
        </div>

        {/* iOS 스타일 토글 스위치 */}
        <button
          onClick={toggleEnabled}
          className={`
            relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ease-in-out
            ${isEnabled ? 'bg-amber-500' : 'bg-gray-300'}
          `}
          role="switch"
          aria-checked={isEnabled}
        >
          <span
            className={`
              inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ease-in-out
              ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    </div>
  )
}
