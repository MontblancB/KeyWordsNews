'use client'

import { useAISummarySettings } from '@/hooks/useAISummarySettings'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid'

export default function AISummaryToggle() {
  const { isEnabled, isLoaded, toggleEnabled } = useAISummarySettings()

  if (!isLoaded) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SparklesIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              AI 뉴스 요약
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
            <SparklesIconSolid className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          ) : (
            <SparklesIcon className="w-5 h-5 text-gray-400" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            AI 뉴스 요약
          </span>
        </div>

        {/* iOS 스타일 토글 스위치 */}
        <button
          onClick={toggleEnabled}
          className={`
            relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ease-in-out
            ${isEnabled ? 'bg-purple-500' : 'bg-gray-300'}
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
