'use client'

import { useEffect, useCallback } from 'react'
import {
  ArrowTrendingUpIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  TagIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

interface TrendData {
  trends: string
  keywords: string[]
}

interface TrendModalProps {
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
  trendData: TrendData | null
  error: string | null
  newsCount: number
}

/**
 * TrendModal
 *
 * TrendNow를 표시하는 풀스크린 모달 컴포넌트입니다.
 *
 * @feature ENABLE_DAILY_INSIGHT
 */
export default function TrendModal({
  isOpen,
  onClose,
  isLoading,
  trendData,
  error,
  newsCount,
}: TrendModalProps) {
  // ESC 키로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose()
      }
    },
    [onClose, isLoading]
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

  // Heroicons outline SVG (인라인)
  const trendUpIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="inline-block w-5 h-5 mr-1 text-teal-600 dark:text-teal-400 align-text-bottom"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>`

  const fireIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="inline-block w-5 h-5 mr-1 text-teal-600 dark:text-teal-400 align-text-bottom"><path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.468 5.99 5.99 0 0 0-1.925 3.547 5.975 5.975 0 0 1-2.133-1.001A3.75 3.75 0 0 0 12 18Z" /></svg>`

  // 마크다운 스타일 텍스트를 HTML로 변환 (간단한 변환)
  const formatContent = (text: string) => {
    return text
      .replace(/📈/g, trendUpIconSvg) // 📈 → ArrowTrendingUpIcon
      .replace(/🔥/g, fireIconSvg) // 🔥 → FireIcon
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // **bold**
      .replace(/\n/g, '<br />') // 줄바꿈
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !isLoading && onClose()}
      />

      {/* 모달 박스 */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] mx-4 flex flex-col overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-teal-500 to-cyan-500">
          <div className="flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">TrendNow</h2>
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
                닫기
              </button>
            </div>
          )}

          {/* 로딩 상태 */}
          {!error && isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <SparklesIcon className="w-12 h-12 text-teal-500 animate-pulse mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-center">
                AI가 트렌드를 분석하고 있습니다...
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                잠시만 기다려주세요
              </p>
            </div>
          )}

          {/* 결과 표시 */}
          {!error && !isLoading && trendData && (
            <>
              {/* 트렌드 콘텐츠 */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div
                  className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: formatContent(trendData.trends),
                  }}
                />
              </div>

              {/* 키워드 배지 */}
              {trendData.keywords && trendData.keywords.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TagIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      트렌드 키워드
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {trendData.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-full text-sm font-medium"
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
        {!isLoading && !error && trendData && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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
