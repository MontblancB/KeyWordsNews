'use client'

import { NewsItem } from '@/types/news'
import { useState, useEffect } from 'react'
import AISummary from './AISummary'
import NewsInsight from './NewsInsight'
import { useAISummarySettings } from '@/hooks/useAISummarySettings'
import { useNewsInsightSettings } from '@/hooks/useNewsInsightSettings'

interface NewsCardProps {
  news: NewsItem
  hideSource?: boolean
}

export default function NewsCard({ news, hideSource = false }: NewsCardProps) {
  const { isEnabled: isAISummaryEnabled } = useAISummarySettings()
  const { isEnabled: isNewsInsightEnabled } = useNewsInsightSettings()

  // 간단한 시간 표시 함수
  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '방금 전'
    if (minutes < 60) return `${minutes}분 전`
    if (hours < 24) return `${hours}시간 전`
    return `${days}일 전`
  }

  // 시간을 상태로 관리하여 자동 업데이트
  const [timeAgo, setTimeAgo] = useState(getTimeAgo(new Date(news.publishedAt)))

  useEffect(() => {
    // 1분마다 시간 업데이트
    const interval = setInterval(() => {
      setTimeAgo(getTimeAgo(new Date(news.publishedAt)))
    }, 60000) // 60초마다

    return () => clearInterval(interval)
  }, [news.publishedAt])

  const hasAIFeatures = isAISummaryEnabled || isNewsInsightEnabled

  return (
    <article className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <a
        href={news.url}
        target="_blank"
        rel="noopener noreferrer"
        className={`block p-4 ${hasAIFeatures ? 'pb-0' : 'pb-4'}`}
      >
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm md:text-base mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">
              {news.title}
            </h3>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {news.summary}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              {!hideSource && (
                <>
                  <span className="font-medium">{news.source}</span>
                  <span>•</span>
                </>
              )}
              <time>{timeAgo}</time>
            </div>
          </div>
          {news.imageUrl && (
            <div className="flex-shrink-0">
              <img
                src={news.imageUrl}
                alt=""
                className="w-20 h-20 md:w-24 md:h-24 object-cover rounded"
                loading="lazy"
              />
            </div>
          )}
        </div>
      </a>

      {/* AI 기능 (링크 밖에 배치) */}
      {hasAIFeatures && news.id && (
        <div className="px-4 pb-4">
          {/* AI 버튼들을 가로로 배치, 내용은 아래에 순서대로 */}
          <div className="flex flex-wrap gap-2 mt-3">
            {/* AI 요약 */}
            {isAISummaryEnabled && (
              <AISummary
                newsId={news.id}
                url={news.url}
                title={news.title}
                summary={news.summary}
                initialSummary={news.aiSummary}
                initialKeywords={news.aiKeywords}
                initialProvider={news.aiProvider}
              />
            )}

            {/* 전문가 의견 */}
            {isNewsInsightEnabled && (
              <NewsInsight
                newsId={news.id}
                url={news.url}
                title={news.title}
                summary={news.summary}
                category={news.category}
                initialInsight={news.aiInsight}
                initialExpert={news.aiInsightExpert}
                initialProvider={news.aiInsightProvider}
              />
            )}
          </div>
        </div>
      )}
    </article>
  )
}
