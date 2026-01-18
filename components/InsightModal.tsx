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

  // 마크다운 스타일 텍스트를 HTML로 변환 (간단한 변환)
  const formatContent = (text: string) => {
    return text
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
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/80">{newsCount}개 뉴스 분석</span>
            <button
              onClick={onClose}
              disabled={isStreaming}
              className={`p-1 rounded-full transition-colors ${
                isStreaming
                  ? 'text-white/40 cursor-not-allowed'
                  : 'text-white/80 hover:text-white hover:bg-white/20'
              }`}
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
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
