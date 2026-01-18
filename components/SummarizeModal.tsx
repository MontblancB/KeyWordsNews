'use client'

import { useEffect, useCallback } from 'react'
import {
  DocumentTextIcon,
  ExclamationCircleIcon,
  SparklesIcon,
  TagIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'

interface SummaryData {
  summary: string
  keywords: string[]
}

interface SummarizeModalProps {
  isOpen: boolean
  onClose: () => void
  isLoading: boolean
  summaryData: SummaryData | null
  error: string | null
  newsCount: number
}

/**
 * SummarizeModal
 *
 * SummarizeNow 결과를 표시하는 풀스크린 모달 컴포넌트입니다.
 *
 * @feature ENABLE_DAILY_INSIGHT
 */
export default function SummarizeModal({
  isOpen,
  onClose,
  isLoading,
  summaryData,
  error,
  newsCount,
}: SummarizeModalProps) {
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

  // Heroicons outline SVG (인라인) - 종합 요약에 맞는 아이콘들
  // 📋 주요 뉴스 종합 - ClipboardDocumentListIcon
  const clipboardIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="inline-block w-5 h-5 mr-1 text-teal-600 dark:text-teal-400 align-text-bottom"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>`

  // 💡 핵심 포인트 - LightBulbIcon
  const lightBulbIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="inline-block w-5 h-5 mr-1 text-teal-600 dark:text-teal-400 align-text-bottom"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>`

  // 📊 전체 요약 - GlobeAltIcon
  const globeIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="inline-block w-5 h-5 mr-1 text-teal-600 dark:text-teal-400 align-text-bottom"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" /></svg>`

  // 마크다운 스타일 텍스트를 HTML로 변환 (간단한 변환)
  const formatContent = (text: string) => {
    return text
      .replace(/📋/g, clipboardIconSvg) // 📋 → ClipboardDocumentListIcon
      .replace(/💡/g, lightBulbIconSvg) // 💡 → LightBulbIcon
      .replace(/📊/g, globeIconSvg) // 📊 → GlobeAltIcon
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
            <DocumentTextIcon className="w-6 h-6 text-white" />
            <h2 className="text-lg font-bold text-white">SummarizeNow</h2>
          </div>
          <span className="text-sm text-white/80">{newsCount}개 뉴스 종합</span>
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
                AI가 뉴스를 종합 정리하고 있습니다...
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
                잠시만 기다려주세요
              </p>
            </div>
          )}

          {/* 결과 표시 */}
          {!error && !isLoading && summaryData && (
            <>
              {/* 종합 요약 콘텐츠 */}
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div
                  className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: formatContent(summaryData.summary),
                  }}
                />
              </div>

              {/* 핵심 키워드 배지 */}
              {summaryData.keywords && summaryData.keywords.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-1.5 mb-2">
                    <TagIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      핵심 키워드
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {summaryData.keywords.map((keyword, index) => (
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
        {!isLoading && !error && summaryData && (
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
