'use client'

import { useState } from 'react'
import { SparklesIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid'

interface AISummaryProps {
  newsId: string
  url: string
  title: string
  summary: string
  initialSummary?: string | null
  initialKeywords?: string[]
  initialProvider?: string | null
}

interface SummaryData {
  summary: string
  keywords: string[]
  provider: string
  cached?: boolean
}

export default function AISummary({
  newsId,
  url,
  title,
  summary,
  initialSummary,
  initialKeywords,
  initialProvider,
}: AISummaryProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(
    initialSummary
      ? {
          summary: initialSummary,
          keywords: initialKeywords || [],
          provider: initialProvider || 'unknown',
          cached: true,
        }
      : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(!!initialSummary)

  const handleSummarize = async () => {
    setLoading(true)
    setError(null)
    setIsExpanded(true)

    try {
      const response = await fetch('/api/news/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newsId,
          url,
          title,
          summary,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`)
      }

      if (data.success) {
        setSummaryData({
          summary: data.data.summary,
          keywords: data.data.keywords,
          provider: data.data.provider,
          cached: data.data.cached,
        })
      } else {
        throw new Error(data.error || '요약 생성에 실패했습니다.')
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('Summarization error:', err)
    } finally {
      setLoading(false)
    }
  }

  // 완료된 요약 표시
  if (summaryData) {
    return (
      <>
        {/* 버튼 (order: 1) */}
        <div style={{ order: 1 }}>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
          >
            <SparklesIconSolid className="w-4 h-4" />
            <span>AI 요약</span>
            {summaryData.cached && (
              <span className="text-xs text-purple-500 dark:text-purple-400">(캐시)</span>
            )}
            {isExpanded ? (
              <ChevronUpIcon className="w-4 h-4" />
            ) : (
              <ChevronDownIcon className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* 내용 (order: 3, AI 요약이 먼저) */}
        {isExpanded && (
          <div style={{ order: 3 }} className="w-full">
            <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              {/* 키워드 배지 */}
              {summaryData.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {summaryData.keywords.map((keyword, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-300 rounded-full"
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              )}

              {/* AI 요약 */}
              <div className="flex items-start gap-2">
                <SparklesIconSolid className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  {/* 불릿 포인트 리스트로 렌더링 */}
                  {summaryData.summary.includes('•') ? (
                    <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                      {summaryData.summary
                        .split('\n')
                        .filter((line) => line.includes('•'))
                        .map((line, index) => (
                          <li key={index} className="flex items-start gap-1.5">
                            <span className="text-purple-500 dark:text-purple-400 font-bold flex-shrink-0 mt-0.5">
                              •
                            </span>
                            <span className="leading-relaxed">
                              {line.replace('•', '').trim()}
                            </span>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    // 구 형식 호환성 (불릿 포인트 없는 경우)
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {summaryData.summary}
                    </p>
                  )}

                  {/* Provider 정보 (디버그용) */}
                  {process.env.NODE_ENV === 'development' && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      AI: {summaryData.provider}
                      {summaryData.cached && ' (cached)'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // 요약 버튼
  return (
    <>
      {/* 버튼 (order: 1) */}
      <div style={{ order: 1 }}>
        <button
          onClick={handleSummarize}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-purple-600 dark:border-purple-400 border-t-transparent rounded-full animate-spin" />
              <span>AI 요약 생성 중...</span>
            </>
          ) : (
            <>
              <SparklesIcon className="w-4 h-4" />
              <span>AI 요약</span>
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
    </>
  )
}
