'use client'

import { useEffect, useRef } from 'react'
import { useInfiniteLatestNews } from '@/hooks/useNews'
import NewsCard from '@/components/NewsCard'
import BottomNav from '@/components/BottomNav'
import BreakingBanner from '@/components/BreakingBanner'

export default function HomePage() {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteLatestNews()

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 무한 스크롤: Intersection Observer
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
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-50">
        <div>
          <h1 className="text-xl font-bold">키워드뉴스</h1>
          <p className="text-sm opacity-90">실시간 뉴스 속보</p>
        </div>
      </header>

      <BreakingBanner />

      <main ref={scrollRef} className="pb-20">
        {isLoading && (
          <div className="p-8 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2">뉴스를 불러오는 중...</p>
          </div>
        )}

        {!isLoading && allNews.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>아직 수집된 뉴스가 없습니다.</p>
            <p className="text-sm mt-2">잠시 후 다시 시도해주세요.</p>
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
                <div className="text-center text-gray-500">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-sm">더 불러오는 중...</p>
                </div>
              )}
              {!hasNextPage && allNews.length > 0 && (
                <div className="text-center text-gray-400 text-sm">
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
