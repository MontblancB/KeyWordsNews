'use client'

import { useState } from 'react'
import { ArrowUpOnSquareIcon } from '@heroicons/react/24/outline'

interface ShareButtonProps {
  title: string
  url: string
}

export default function ShareButton({ title, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const shareData = {
      title: title,
      url: url,
    }

    // Web Share API 지원 여부 확인
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (error) {
        // 사용자가 공유를 취소한 경우 무시
        if ((error as Error).name !== 'AbortError') {
          console.error('공유 실패:', error)
          fallbackCopyToClipboard()
        }
      }
    } else {
      // Web Share API 미지원 시 클립보드 복사
      fallbackCopyToClipboard()
    }
  }

  const fallbackCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('클립보드 복사 실패:', error)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors relative"
      aria-label="공유하기"
      title="공유하기"
    >
      <ArrowUpOnSquareIcon className="w-5 h-5" />

      {/* 복사 완료 피드백 */}
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 text-xs bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 rounded whitespace-nowrap">
          링크 복사됨
        </span>
      )}
    </button>
  )
}
