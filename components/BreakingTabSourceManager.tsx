'use client'

import { useState } from 'react'
import { useBreakingTabSettings } from '@/hooks/useBreakingTabSettings'
import { CATEGORY_MAPPING } from '@/lib/rss/sources'
import { BoltIcon } from '@heroicons/react/24/outline'

export default function BreakingTabSourceManager() {
  const {
    settings,
    isLoaded,
    toggleSource,
    enableAll,
    disableAll,
    toggleCategory,
    reset,
    enabledCount,
    totalCount,
    getCategoryStats,
    allSources
  } = useBreakingTabSettings()

  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  if (!isLoaded) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <BoltIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            속보 탭 소스 관리
          </h3>
        </div>
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 dark:border-red-400"></div>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">설정 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 카테고리 토글
  const toggleCategoryExpand = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  // 카테고리별로 그룹화 (토픽 순서와 동일하게)
  const categoryOrder = [
    'breaking',    // 속보
    'general',     // 종합
    'politics',    // 정치
    'economy',     // 경제
    'society',     // 사회
    'world',       // 국제
    'tech',        // IT/과학
    'sports',      // 스포츠
    'entertainment', // 연예
    'culture',     // 문화
  ]

  // 존재하는 카테고리만 정렬된 순서로 가져오기
  const uniqueCategories = Array.from(new Set(allSources.map(s => s.category)))
  const categories = categoryOrder.filter(cat => uniqueCategories.includes(cat))

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      {/* 헤더 (클릭 가능) */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <BoltIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            속보 탭 소스 관리
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
                  ? 'bg-red-600 text-white shadow-sm'
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
                  ? 'bg-red-600 text-white shadow-sm'
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

          {/* 카테고리별 뉴스 소스 리스트 */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
        {categories.map((category) => {
          const categoryName = CATEGORY_MAPPING[category] || category
          const sources = allSources.filter(s => s.category === category)
          const stats = getCategoryStats(category)
          const isCategoryExpanded = expandedCategories.has(category)

          return (
            <div key={category} className="bg-white dark:bg-gray-700 rounded-lg overflow-hidden">
              {/* 카테고리 헤더 */}
              <div
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                onClick={() => toggleCategoryExpand(category)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm">{isCategoryExpanded ? '▼' : '▶'}</span>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{categoryName}</h4>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({stats.enabled} / {stats.total})
                  </span>
                </div>

                <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleCategory(category, true)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      stats.allEnabled
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    ON
                  </button>
                  <button
                    onClick={() => toggleCategory(category, false)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      stats.noneEnabled
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                    }`}
                  >
                    OFF
                  </button>
                </div>
              </div>

              {/* 카테고리 내 소스 리스트 */}
              {isCategoryExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-600">
                  {sources.map((source) => {
                    const isEnabled = settings[source.id] ?? true  // 기본값 true

                    return (
                      <label
                        key={source.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors border-t border-gray-100 dark:border-gray-600 first:border-t-0"
                      >
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleSource(source.id)}
                          className="w-4 h-4 text-red-600 rounded focus:ring-2 focus:ring-red-500 cursor-pointer"
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
            속보 탭(메인 페이지)에 표시될 뉴스 소스를 선택하세요
          </p>
        </div>
      )}
    </div>
  )
}
