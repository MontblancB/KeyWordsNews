'use client'

import { useState } from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { SparklesIcon as SparklesIconSolid } from '@heroicons/react/24/solid'

interface AISummaryProps {
  newsId: string
  url: string  // ⭐️ 추가
  title: string  // ⭐️ 추가
  summary: string  // ⭐️ 추가
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
  url,  // ⭐️ 추가
  title,  // ⭐️ 추가
  summary,  // ⭐️ 추가
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

  const handleSummarize = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/news/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newsId,
          url,      // ⭐️ 추가
          title,    // ⭐️ 추가
          summary   // ⭐️ 추가
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || '요약 생성에 실패했습니다.')
      }

      setSummaryData(data.data)
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('Summarization error:', err)
    } finally {
      setLoading(false)
    }
  }

  // 이미 요약이 있으면 표시
  if (summaryData) {
    return (
      <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
        {/* 키워드 배지 */}
        {summaryData.keywords.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {summaryData.keywords.map((keyword, index) => (
              <span
                key={index}
                className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full"
              >
                #{keyword}
              </span>
            ))}
          </div>
        )}

        {/* AI 요약 */}
        <div className="flex items-start gap-2">
          <SparklesIconSolid className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-700 leading-relaxed">
              {summaryData.summary}
            </p>
            {/* Provider 정보 (디버그용) */}
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-gray-400 mt-1">
                AI: {summaryData.provider}
                {summaryData.cached && ' (cached)'}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // 요약 버튼
  return (
    <div className="mt-3">
      <button
        onClick={handleSummarize}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span>AI 요약 생성 중...</span>
          </>
        ) : (
          <>
            <SparklesIcon className="w-4 h-4" />
            <span>AI 요약 보기</span>
          </>
        )}
      </button>

      {/* 에러 메시지 */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
          {error}
        </div>
      )}
    </div>
  )
}
