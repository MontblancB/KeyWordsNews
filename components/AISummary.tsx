'use client'

import { useState } from 'react'
import { SparklesIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
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
  oneLiner?: string  // 한 줄 정리
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
  const [isExpanded, setIsExpanded] = useState(!!initialSummary) // 초기값이 있으면 펼쳐진 상태

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
      setIsExpanded(true) // 요약 생성 후 자동으로 펼치기
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
      <div className="mt-3">
        {/* 토글 버튼 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full px-3 py-1.5 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <SparklesIconSolid className="w-4 h-4" />
            <span>AI 요약</span>
          </div>
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>

        {/* 요약 내용 (토글) */}
        {isExpanded && (
          <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
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
                {/* 불릿 포인트 리스트로 렌더링 */}
                {summaryData.summary.includes('•') ? (
                  <ul className="space-y-1.5 text-sm text-gray-700">
                    {summaryData.summary
                      .split('\n')
                      .filter((line) => line.includes('•'))
                      .map((line, index) => (
                        <li key={index} className="flex items-start gap-1.5">
                          <span className="text-purple-500 font-bold flex-shrink-0 mt-0.5">
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
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {summaryData.summary}
                  </p>
                )}

                {/* 한 줄 정리 */}
                {summaryData.oneLiner && (
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <p className="text-sm font-semibold text-purple-700 leading-relaxed">
                      💡 {summaryData.oneLiner}
                    </p>
                  </div>
                )}

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
        )}
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
