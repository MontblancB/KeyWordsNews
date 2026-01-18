'use client'

import { useEffect, useCallback } from 'react'
import {
  XMarkIcon,
  LightBulbIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  TagIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

interface InsightData {
  insights: string
  keywords: string[]
}

interface InsightModalProps {
  isOpen: boolean
  onClose: () => void
  isStreaming: boolean
  streamingContent: string
  insightData: InsightData | null
  error: string | null
  newsCount: number
}

/**
 * InsightModal
 *
 * InsightNow를 표시하는 풀스크린 모달 컴포넌트입니다.
 * SSE 스트리밍을 통해 실시간으로 인사이트가 생성되는 것을 보여줍니다.
 *
 * @feature ENABLE_DAILY_INSIGHT
 */
export default function InsightModal({
  isOpen,
  onClose,
  isStreaming,
  streamingContent,
  insightData,
  error,
  newsCount,
}: InsightModalProps) {
  // ESC 키로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isStreaming) {
        onClose()
      }
    },
    [onClose, isStreaming]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // 스크롤 방지
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  // 표시할 콘텐츠 결정
  const displayContent = insightData?.insights || streamingContent

  // Heroicons outline SVG (인라인)
  const chartBarIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="inline-block w-5 h-5 mr-1 text-amber-600 dark:text-amber-400 align-text-bottom"><path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>`

  const lightBulbIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="inline-block w-5 h-5 mr-1 text-amber-600 dark:text-amber-400 align-text-bottom"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>`

  // 마크다운 스타일 텍스트를 HTML로 변환 (간단한 변환)
  const formatContent = (text: string) => {
    return text
      .replace(/📊/g, chartBarIconSvg) // 📊 → ChartBarIcon
      .replace(/💡/g, lightBulbIconSvg) // 💡 → LightBulbIcon
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // **bold**
      .replace(/\n/g, '<br />') // 줄바꿈
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isStreaming && onClose()}
      />

      {/* 모달 박스 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] mx-4 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-amber-500 to-orange-500">
          <div className="flex items-center gap-2">
            <LightBulbIcon className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">InsightNow</h2>
          </div>
          <span className="text-sm text-white/80">{newsCount}개 뉴스 분석</span>
        </div>

        {/* 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* 에러 상태 */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <ExclamationCircleIcon className="w-5 h-5 text-red-500 dark:text-red-400" />
                <p className="text-red-600 dark:text-red-400 text-sm font-medium">
                  오류가 발생했습니다
                </p>
              </div>
              <p className="text-red-600 dark:text-red-400 text-sm ml-7">
                {error}
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-2 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg text-sm hover:bg-red-200 dark:hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                닫기
              </button>
            </div>
          )}

          {/* 스트리밍/완료 상태 */}
          {!error && (
            <>
              {/* 인사이트 콘텐츠 */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {displayContent ? (
                  <div
                    className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: formatContent(displayContent),
                    }}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <SparklesIcon className="w-5 h-5 text-amber-500 animate-pulse" />
                    <span>AI가 뉴스를 분석하고 있습니다...</span>
                  </div>
                )}

                {/* 스트리밍 중 커서 */}
                {isStreaming && displayContent && (
                  <span className="inline-block w-2 h-4 bg-amber-500 animate-pulse ml-0.5" />
                )}
              </div>

              {/* 키워드 배지 (완료 후) */}
              {insightData?.keywords && insightData.keywords.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TagIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      핵심 키워드
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {insightData.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 푸터 (완료 후) */}
        {!isStreaming && !error && insightData && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <CheckIcon className="w-5 h-5" />
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
