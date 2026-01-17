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

  // 스트리밍 상태
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)

  const handleSummarize = async () => {
    setLoading(true)
    setError(null)
    setIsStreaming(true)
    setStreamingContent('')
    setIsExpanded(true)

    try {
      const response = await fetch('/api/news/summarize/stream', {
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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // 캐시된 응답 처리 (JSON)
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const data = await response.json()
        if (data.cached) {
          setSummaryData(data.data)
          setLoading(false)
          setIsStreaming(false)
          return
        }
      }

      // 스트림 읽기 (SSE)
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('스트림을 읽을 수 없습니다.')
      }

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE 메시지 파싱 (data: {...}\n\n)
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'token') {
                // 실시간으로 토큰 추가
                setStreamingContent((prev) => prev + data.content)
              } else if (data.type === 'done') {
                // 완료
                setSummaryData({
                  summary: data.result.summary,
                  keywords: data.result.keywords,
                  provider: 'groq',
                  cached: false,
                })
                setStreamingContent('')
                setIsStreaming(false)
              } else if (data.type === 'error') {
                throw new Error(data.error)
              }
            } catch (parseError) {
              console.error('SSE 파싱 에러:', parseError)
            }
          }
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      setError(errorMessage)
      console.error('Summarization error:', err)
      setIsStreaming(false)
      setStreamingContent('')
    } finally {
      setLoading(false)
    }
  }

  // 스트리밍 중 UI
  if (isStreaming && streamingContent) {
    return (
      <div className="mt-3">
        <div className="flex items-center justify-between w-full px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
          <div className="flex items-center gap-1.5">
            <SparklesIconSolid className="w-4 h-4 animate-pulse" />
            <span>AI 요약 생성 중...</span>
          </div>
        </div>

        <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          {/* 실시간 스트리밍 콘텐츠 */}
          <div className="flex items-start gap-2">
            <SparklesIconSolid className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-mono">
                {streamingContent}
                <span className="inline-block w-1.5 h-4 bg-purple-500 animate-pulse ml-0.5" />
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 완료된 요약 표시
  if (summaryData) {
    return (
      <div className="mt-3">
        {/* 토글 버튼 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full px-3 py-1.5 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <SparklesIconSolid className="w-4 h-4" />
            <span>AI 요약</span>
            {summaryData.cached && (
              <span className="text-xs text-purple-500 dark:text-purple-400">(캐시)</span>
            )}
          </div>
          {isExpanded ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </button>

        {/* 요약 내용 (토글) */}
        {isExpanded && (
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
            <span>AI 요약 보기</span>
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
