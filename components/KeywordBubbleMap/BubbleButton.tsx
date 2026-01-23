'use client'

import { CircleStackIcon } from '@heroicons/react/24/outline'

interface BubbleButtonProps {
  onClick: () => void
  isLoading: boolean
  disabled?: boolean
}

/**
 * BubbleButton
 *
 * "BubbleNow" 버튼 컴포넌트입니다.
 * 현재 로드된 뉴스들의 키워드를 추출하여 버블맵으로 시각화합니다.
 */
export default function BubbleButton({
  onClick,
  isLoading,
  disabled = false,
}: BubbleButtonProps) {
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
            : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-sm hover:shadow'
        }
      `}
      title={disabled ? '뉴스가 5개 이상 필요합니다' : '키워드 버블맵을 생성합니다'}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>분석 중...</span>
        </>
      ) : (
        <>
          <CircleStackIcon className="w-4 h-4" />
          <span>BubbleNow</span>
        </>
      )}
    </button>
  )
}
