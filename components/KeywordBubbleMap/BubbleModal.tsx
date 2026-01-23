'use client'

import { useEffect } from 'react'
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import BubbleMapVisualization from './BubbleMapVisualization'

interface KeywordNode {
  id: string
  text: string
  count: number
  value: number
  newsIds: string[]
}

interface KeywordLink {
  source: string
  target: string
  strength: number
}

interface BubbleModalProps {
  isOpen: boolean
  onClose: () => void
  keywords?: KeywordNode[]
  links?: KeywordLink[]
  metadata?: {
    totalNews: number
    totalKeywords: number
    generatedAt: string
  }
  isLoading?: boolean
  error?: string | null
  onKeywordClick?: (keyword: KeywordNode) => void
}

/**
 * BubbleModal
 *
 * BubbleNow 전체 화면 모달
 * 키워드 버블맵을 전체 화면으로 표시합니다.
 */
export default function BubbleModal({
  isOpen,
  onClose,
  keywords = [],
  links = [],
  metadata,
  isLoading = false,
  error = null,
  onKeywordClick,
}: BubbleModalProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // CSV 다운로드
  const downloadCSV = () => {
    const csvHeader = 'Keyword,Count,Value,RelatedNews\n'
    const csvRows = keywords
      .map(
        (kw) =>
          `"${kw.text}",${kw.count},${kw.value.toFixed(1)},${kw.newsIds.length}`
      )
      .join('\n')

    const csv = csvHeader + csvRows
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `keyword-map-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative w-full h-full flex flex-col bg-white dark:bg-gray-900">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🗺️ 키워드 버블맵
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {metadata && (
                <>
                  총 <span className="font-semibold">{keywords.length}개</span> 키워드
                  {' | '}
                  <span className="font-semibold">{metadata.totalNews}개</span> 뉴스 분석
                </>
              )}
              {!metadata && '키워드 분석 중...'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* CSV 다운로드 버튼 */}
            <button
              onClick={downloadCSV}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              CSV 다운로드
            </button>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="닫기"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 버블맵 영역 */}
        <div className="flex-1 p-6 overflow-hidden">
          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md px-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  키워드 분석 실패
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* 로딩 중 */}
          {!error && isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 dark:border-orange-400"></div>
              <p className="text-gray-600 dark:text-gray-400">
                키워드를 분석하고 있습니다...
              </p>
            </div>
          )}

          {/* 버블맵 */}
          {!error && !isLoading && keywords.length > 0 && (
            <BubbleMapVisualization
              keywords={keywords}
              links={links}
              onKeywordClick={onKeywordClick}
            />
          )}
        </div>

        {/* 푸터 안내 */}
        {!isLoading && !error && metadata && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
              <div>
                💡 <span className="font-semibold">드래그</span>하여 위치 조정,{' '}
                <span className="font-semibold">휠</span>로 줌 조절,{' '}
                <span className="font-semibold">클릭</span>하여 관련 뉴스 확인
              </div>
              <div>
                생성 시간:{' '}
                {new Date(metadata.generatedAt).toLocaleString('ko-KR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  )
}
