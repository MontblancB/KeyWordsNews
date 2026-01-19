'use client'

import { useState } from 'react'
import { LightBulbIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { LightBulbIcon as LightBulbIconSolid } from '@heroicons/react/24/solid'

interface NewsInsightProps {
  newsId: string
  url: string
  title: string
  summary: string
  category: string
  initialInsight?: string | null
  initialExpert?: string | null
  initialProvider?: string | null
}

interface InsightData {
  insight: string
  expert: string
  provider: string
  cached?: boolean
}

export default function NewsInsight({
  newsId,
  url,
  title,
  summary,
  category,
  initialInsight,
  initialExpert,
  initialProvider,
}: NewsInsightProps) {
  const [insightData, setInsightData] = useState<InsightData | null>(
    initialInsight
      ? {
          insight: initialInsight,
          expert: initialExpert || '',
          provider: initialProvider || 'unknown',
          cached: true,
        }
      : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(!!initialInsight)

  const handleGetInsight = async () => {
    setLoading(true)
    setError(null)
    setIsExpanded(true)

    try {
      const response = await fetch('/api/news/insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newsId,
          url,
          title,
          summary,
          category,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (data.success) {
        setInsightData({
          insight: data.data.insight,
          expert: data.data.expert,
          provider: data.provider,
          cached: data.cached,
        })
      } else {
        throw new Error(data.error || '전문가 의견 생성에 실패했습니다.')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('Insight error:', err)
    } finally {
      setLoading(false)
    }
  }

  // 인사이트 내용 파싱 및 렌더링
  const renderInsight = (insight: string) => {
    const lines = insight.split('\n').filter((line) => line.trim())

    return (
      <div className="space-y-3">
        {lines.map((line, index) => {
          // 섹션 헤더 (📌, 📊, ⚡, 🔮 등)
          if (line.match(/^[📌📊⚡🔮💡]/)) {
            return (
              <div key={index} className="font-semibold text-amber-700 dark:text-amber-300 text-sm">
                {line.replace(/\*\*/g, '')}
              </div>
            )
          }
          // 불릿 포인트
          if (line.startsWith('•')) {
            return (
              <div key={index} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span className="text-amber-500 dark:text-amber-400 font-bold flex-shrink-0">•</span>
                <span className="leading-relaxed">{line.replace('•', '').trim()}</span>
              </div>
            )
          }
          // 일반 텍스트
          return (
            <p key={index} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {line}
            </p>
          )
        })}
      </div>
    )
  }

  // 완료된 인사이트 표시
  if (insightData) {
    return (
      <div className="mt-2">
        {/* 토글 버튼 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full px-3 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <LightBulbIconSolid className="w-4 h-4" />
            <span>전문가 의견</span>
            {insightData.expert && (
              <span className="text-xs text-amber-500 dark:text-amber-400">
                ({insightData.expert})
              </span>
            )}
            {insightData.cached && (
              <span className="text-xs text-amber-500 dark:text-amber-400">(캐시)</span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>

        {/* 인사이트 내용 (토글) */}
        {isExpanded && (
          <div className="mt-2 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            {/* 전문가 배지 */}
            {insightData.expert && (
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-amber-200 dark:border-amber-700">
                <LightBulbIconSolid className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  {insightData.expert}의 분석
                </span>
              </div>
            )}

            {/* 인사이트 내용 */}
            {renderInsight(insightData.insight)}

            {/* Provider 정보 (디버그용) */}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 pt-2 border-t border-amber-200 dark:border-amber-700">
                AI: {insightData.provider}
                {insightData.cached && ' (cached)'}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // 인사이트 버튼
  return (
    <div className="mt-2">
      <button
        onClick={handleGetInsight}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-amber-600 dark:border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>전문가 의견 생성 중...</span>
          </>
        ) : (
          <>
            <LightBulbIcon className="w-4 h-4" />
            <span>전문가 의견</span>
          </>
        )}
      </button>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  )
}
