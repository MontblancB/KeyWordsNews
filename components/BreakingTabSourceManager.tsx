'use client'

import { useState } from 'react'
import { useBreakingTabSettings } from '@/hooks/useBreakingTabSettings'
import { BoltIcon } from '@heroicons/react/24/outline'

export default function BreakingTabSourceManager() {
  const {
    settings,
    isLoaded,
    toggleSource,
    enableAll,
    disableAll,
    reset,
    enabledCount,
    totalCount,
    allSources
  } = useBreakingTabSettings()

  const [isExpanded, setIsExpanded] = useState(false)

  if (!isLoaded) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <BoltIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            종합 탭 소스 관리
          </h3>
        </div>
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 dark:border-red-400"></div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">설정 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 소스를 이름 순으로 정렬
  const sortedSources = [...allSources].sort((a, b) => a.name.localeCompare(b.name, 'ko'))

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      {/* 헤더 (클릭 가능) */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <BoltIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            종합 탭 소스 관리
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {enabledCount} / {totalCount}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* 본문 (폴딩 가능) */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* 전체 제어 버튼 */}
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                enableAll()
              }}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                enabledCount === totalCount
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              전체 ON
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                disableAll()
              }}
              className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                enabledCount === 0
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            >
              전체 OFF
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                reset()
              }}
              className="flex-1 px-3 py-2 text-xs font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors shadow-sm"
            >
              초기화
            </button>
          </div>

          {/* 뉴스 소스 리스트 (단순 리스트) */}
          <div className="max-h-[400px] overflow-y-auto bg-white dark:bg-gray-700 rounded-lg">
            {sortedSources.map((source) => {
              const isEnabled = settings[source.id] ?? true  // 기본값 true

              return (
                <label
                  key={source.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    checked={isEnabled}
                    onChange={() => toggleSource(source.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {source.name}
                  </span>
                </label>
              )
            })}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            종합 탭(메인 페이지)에 표시될 전체 뉴스 소스를 선택하세요
          </p>
        </div>
      )}
    </div>
  )
}
