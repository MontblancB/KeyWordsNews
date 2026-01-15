'use client'

import { NewsItem } from '@/types/news'
import { formatDistanceToNow } from 'date-fns'

interface NewsCardProps {
  news: NewsItem
}

export default function NewsCard({ news }: NewsCardProps) {
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

  const timeAgo = getTimeAgo(new Date(news.publishedAt))

  return (
    <article className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <a
        href={news.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block p-4"
      >
        <div className="flex gap-3">
          <div className="flex-1 min-w-0">
            {news.isBreaking && (
              <span className="inline-block px-2 py-1 text-xs font-bold text-white bg-red-600 rounded mb-2">
                속보
              </span>
            )}
            <h3 className="font-bold text-sm md:text-base mb-2 line-clamp-2 text-gray-900">
              {news.title}
            </h3>
            <p className="text-xs md:text-sm text-gray-600 mb-2 line-clamp-2">
              {news.summary}
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span className="font-medium">{news.source}</span>
              <span>•</span>
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
    </article>
  )
}
