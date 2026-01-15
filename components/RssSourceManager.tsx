'use client'

import { useState } from 'react'
import { useRssSettings } from '@/hooks/useRssSettings'
import { CATEGORY_MAPPING } from '@/lib/rss/sources'

export default function RssSourceManager() {
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
  } = useRssSettings()

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  if (!isLoaded) {
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-sm">설정 불러오는 중...</p>
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
    <div className="bg-white">
      {/* 헤더 및 전체 제어 버튼 */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">
            RSS 소스 관리
          </h3>
          <span className="text-sm text-gray-600">
            {enabledCount} / {totalCount} 활성화
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={enableAll}
            className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
              enabledCount === totalCount
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            전체 ON
          </button>
          <button
            onClick={disableAll}
            className={`flex-1 px-3 py-2 text-sm rounded transition-colors ${
              enabledCount === 0
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            전체 OFF
          </button>
          <button
            onClick={reset}
            className="flex-1 px-3 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 카테고리별 RSS 소스 리스트 */}
      <div className="max-h-[500px] overflow-y-auto">
        {categories.map((category) => {
          const categoryName = CATEGORY_MAPPING[category] || category
          const sources = allSources.filter(s => s.category === category)
          const stats = getCategoryStats(category)
          const isExpanded = expandedCategories.has(category)

          return (
            <div key={category} className="border-b border-gray-200">
              {/* 카테고리 헤더 */}
              <div
                className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleCategoryExpand(category)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
                  <h4 className="font-bold text-gray-900">{categoryName}</h4>
                  <span className="text-sm text-gray-500">
                    ({stats.enabled} / {stats.total})
                  </span>
                </div>

                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => toggleCategory(category, true)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      stats.allEnabled
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ON
                  </button>
                  <button
                    onClick={() => toggleCategory(category, false)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      stats.noneEnabled
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    OFF
                  </button>
                </div>
              </div>

              {/* 카테고리 내 소스 리스트 */}
              {isExpanded && (
                <div className="bg-white">
                  {sources.map((source) => {
                    const isEnabled = settings[source.id] ?? source.enabled

                    return (
                      <label
                        key={source.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-t border-gray-100"
                      >
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleSource(source.id)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                        />
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">
                            {source.name}
                          </span>
                        </div>
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 안내 메시지 */}
      <div className="p-4 bg-blue-50 border-t border-blue-100">
        <p className="text-xs text-blue-800">
          💡 비활성화한 RSS 소스는 뉴스 수집 및 검색에서 제외됩니다.
        </p>
      </div>
    </div>
  )
}
