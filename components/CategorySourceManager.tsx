'use client'

import { useState } from 'react'
import { useAllCategorySettings } from '@/hooks/useCategorySettings'
import { NewspaperIcon, ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function CategorySourceManager() {
  const {
    settingsMap,
    isLoaded,
    toggleSource,
    enableAll,
    disableAll,
    reset,
    getStats,
    getSourcesByCategory,
    categories
  } = useAllCategorySettings()

  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const toggleCategoryExpanded = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  if (!isLoaded) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <NewspaperIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            토픽 탭 소스 관리
          </h3>
        </div>
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">설정 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 전체 통계 계산
  const totalStats = categories.reduce(
    (acc, cat) => {
      const stats = getStats(cat.id)
      return {
        enabled: acc.enabled + stats.enabled,
        total: acc.total + stats.total
      }
    },
    { enabled: 0, total: 0 }
  )

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      {/* 헤더 (클릭 가능) */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <NewspaperIcon className="w-5 h-5 text-green-500 dark:text-green-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            토픽 탭 소스 관리
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {totalStats.enabled} / {totalStats.total}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* 본문 (폴딩 가능) */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* 카테고리별 설정 */}
          <div className="max-h-[500px] overflow-y-auto space-y-2">
            {categories.map((category) => {
              const stats = getStats(category.id)
              const sources = getSourcesByCategory(category.id)
              const categorySettings = settingsMap[category.id] || {}
              const isCategoryExpanded = expandedCategories.has(category.id)

              return (
                <div
                  key={category.id}
                  className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden"
                >
                  {/* 카테고리 헤더 */}
                  <div
                    className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600"
                    onClick={() => toggleCategoryExpanded(category.id)}
                  >
                    <div className="flex items-center gap-2">
                      {isCategoryExpanded ? (
                        <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {category.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({stats.enabled}/{stats.total})
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          enableAll(category.id)
                        }}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                          stats.enabled === stats.total
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                        }`}
                      >
                        ON
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          disableAll(category.id)
                        }}
                        className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                          stats.enabled === 0
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                        }`}
                      >
                        OFF
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          reset(category.id)
                        }}
                        className="px-2 py-1 text-xs font-medium bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                      >
                        초기화
                      </button>
                    </div>
                  </div>

                  {/* 카테고리 소스 목록 */}
                  {isCategoryExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-600">
                      {sources.sort((a, b) => a.name.localeCompare(b.name, 'ko')).map((source) => {
                        const isEnabled = categorySettings[source.id] ?? source.enabled

                        return (
                          <label
                            key={source.id}
                            className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-600 last:border-b-0"
                          >
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => toggleSource(category.id, source.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {source.name}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            토픽 탭(정치/경제/사회 등)의 각 카테고리별로 표시될 뉴스 소스를 선택하세요
          </p>
        </div>
      )}
    </div>
  )
}
