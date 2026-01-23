'use client'

import { useEffect, useState } from 'react'
import { XMarkIcon, NewspaperIcon } from '@heroicons/react/24/outline'

interface NewsItem {
  id: string
  title: string
  url: string
  summary: string
  source: string
  publishedAt: string
  aiSummary?: string | null
  aiKeywords?: string[]
}

interface KeywordNewsModalProps {
  isOpen: boolean
  onClose: () => void
  keyword: string
  newsIds: string[]
}

/**
 * KeywordNewsModal
 *
 * 버블맵에서 키워드 클릭 시 관련 뉴스 목록을 표시하는 모달
 */
export default function KeywordNewsModal({
  isOpen,
  onClose,
  keyword,
  newsIds,
}: KeywordNewsModalProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // 뉴스 데이터 로드
  useEffect(() => {
    if (!isOpen || newsIds.length === 0) return

    const fetchNews = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/news/by-ids', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: newsIds }),
        })

        if (!response.ok) {
          throw new Error('뉴스 데이터를 불러오는데 실패했습니다.')
        }

        const data = await response.json()
        setNews(data.data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [isOpen, newsIds])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="absolute inset-4 sm:inset-8 md:inset-16 bg-white dark:bg-gray-900 rounded-lg shadow-2xl flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 truncate">
              <NewspaperIcon className="w-6 h-6 text-blue-500 flex-shrink-0" />
              <span className="truncate">"{keyword}" 관련 뉴스</span>
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              총 <span className="font-semibold">{newsIds.length}개</span> 기사
            </p>
          </div>

          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="닫기"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* 뉴스 목록 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 에러 메시지 */}
          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md px-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  뉴스 로드 실패
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {error}
                </p>
              </div>
            </div>
          )}

          {/* 로딩 중 */}
          {!error && isLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <p className="text-gray-600 dark:text-gray-400">
                뉴스를 불러오는 중...
              </p>
            </div>
          )}

          {/* 뉴스 카드 목록 */}
          {!error && !isLoading && news.length > 0 && (
            <div className="space-y-4">
              {news.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* 제목 */}
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 leading-snug">
                    {item.title}
                  </h3>

                  {/* 메타 정보 */}
                  <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-3">
                    <span className="font-medium">{item.source}</span>
                    <span>•</span>
                    <span>
                      {new Date(item.publishedAt).toLocaleString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* AI 요약 (있으면) */}
                  {item.aiSummary && (
                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-500">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                          AI 요약
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {item.aiSummary}
                      </div>

                      {/* AI 키워드 */}
                      {item.aiKeywords && item.aiKeywords.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {item.aiKeywords.map((kw, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 rounded"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 원문 요약 */}
                  {!item.aiSummary && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                      {item.summary}
                    </p>
                  )}

                  {/* 링크 버튼 */}
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                  >
                    원문 보기
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          )}

          {/* 뉴스 없음 */}
          {!error && !isLoading && news.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md px-6">
                <div className="text-6xl mb-4">📰</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  뉴스를 찾을 수 없습니다
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  해당 키워드와 관련된 뉴스가 없습니다.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
