'use client'

import { DocumentTextIcon } from '@heroicons/react/24/outline'

interface SummarizeButtonProps {
  onClick: () => void
  isLoading: boolean
  disabled?: boolean
}

/**
 * SummarizeButton
 *
 * "SummarizeNow" 버튼 컴포넌트입니다.
 * 현재 로드된 뉴스들을 AI로 종합 정리합니다.
 *
 * @feature ENABLE_DAILY_INSIGHT
 */
export default function SummarizeButton({
  onClick,
  isLoading,
  disabled = false,
}: SummarizeButtonProps) {
  const isDisabled = disabled || isLoading

  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium
        transition-all duration-200
        ${
          isDisabled
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            : 'bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white shadow-sm hover:shadow'
        }
      `}
      title={disabled ? '뉴스가 5개 이상 필요합니다' : '현재 뉴스들을 AI로 종합 정리합니다'}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>요약 중...</span>
        </>
      ) : (
        <>
          <DocumentTextIcon className="w-4 h-4" />
          <span>SummarizeNow</span>
        </>
      )}
    </button>
  )
}
