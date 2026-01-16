'use client'

import { useEffect, useRef } from 'react'
import { useInfiniteTopicNews } from '@/hooks/useNews'
import NewsCard from '@/components/NewsCard'
import BottomNav from '@/components/BottomNav'
import CategoryTabs from '@/components/CategoryTabs'
import { useParams } from 'next/navigation'

export default function TopicPage() {
  const params = useParams()
  const category = params.category as string

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteTopicNews(category)

  const loadMoreRef = useRef<HTMLDivElement>(null)

  const categoryNames: Record<string, string> = {
    general: '종합',
    politics: '정치',
    economy: '경제',
    society: '사회',
    world: '국제',
    tech: 'IT/과학',
    sports: '스포츠',
    entertainment: '연예',
    culture: '문화',
  }

  // 무한 스크롤
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const allNews = data?.pages.flatMap((page) => page.data) || []

  return (
    <>
      <header className="bg-blue-600 dark:bg-blue-700 text-white p-4">
        <h1 className="text-xl font-bold">
          {categoryNames[category] || category} 뉴스
        </h1>
      </header>

      <CategoryTabs />

      <main className="pb-20 bg-white dark:bg-gray-900">
        {isLoading && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-2">뉴스를 불러오는 중...</p>
          </div>
        )}

        {!isLoading && allNews.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p>아직 수집된 뉴스가 없습니다.</p>
          </div>
        )}

        {allNews.length > 0 && (
          <>
            <div>
              {allNews.map((item) => (
                <NewsCard key={item.id} news={item} />
              ))}
            </div>

            {/* 무한 스크롤 트리거 */}
            <div ref={loadMoreRef} className="p-4">
              {isFetchingNextPage && (
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
                  <p className="mt-2 text-sm">더 불러오는 중...</p>
                </div>
              )}
              {!hasNextPage && allNews.length > 0 && (
                <div className="text-center text-gray-400 dark:text-gray-500 text-sm">
                  모든 뉴스를 불러왔습니다.
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </>
  )
}
