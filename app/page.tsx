'use client'

import { useEffect, useRef } from 'react'
import { useInfiniteLatestNews } from '@/hooks/useNews'
import NewsCard from '@/components/NewsCard'
import BottomNav from '@/components/BottomNav'
import BreakingBanner from '@/components/BreakingBanner'
import { useColorTheme } from '@/hooks/useColorTheme'
import { useQueryClient } from '@tanstack/react-query'
import { getEnabledRssSourceNames } from '@/lib/rss-settings'

export default function HomePage() {
  const { headerClasses } = useColorTheme()
  const queryClient = useQueryClient()
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteLatestNews()

  const loadMoreRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 첫 5개 로드 후 자동으로 나머지 페이지 로드 (백그라운드)
  useEffect(() => {
    if (!isLoading && data && data.pages.length === 1 && hasNextPage && !isFetchingNextPage) {
      // 첫 페이지만 로드된 상태에서 자동으로 다음 3페이지(총 20개)를 백그라운드에서 로드
      const timer = setTimeout(() => {
        fetchNextPage()
      }, 500) // 500ms 후 자동 로드 시작

      return () => clearTimeout(timer)
    }
  }, [isLoading, data, hasNextPage, isFetchingNextPage, fetchNextPage])

  // 모든 카테고리 순차적으로 프리페칭 (백그라운드에서 실행)
  useEffect(() => {
    const allCategories = [
      'politics',      // 정치
      'economy',       // 경제
      'society',       // 사회
      'world',         // 국제
      'tech',          // IT
      'sports',        // 스포츠
      'entertainment', // 연예
      'culture',       // 문화
    ]
    const sources = getEnabledRssSourceNames()

    // 순차적으로 프리페칭 (500ms 간격)
    allCategories.forEach((category, index) => {
      setTimeout(() => {
        queryClient.prefetchInfiniteQuery({
          queryKey: ['news', 'topic-infinite', category, sources],
          queryFn: async ({ pageParam = 0 }) => {
            // 첫 요청은 10개
            const limit = pageParam === 0 ? 10 : 15
            const offset = pageParam === 0 ? 0 : 10 + (pageParam - 1) * 15

            const url = sources
              ? `/api/news/topics/${category}?limit=${limit}&offset=${offset}&sources=${encodeURIComponent(sources)}`
              : `/api/news/topics/${category}?limit=${limit}&offset=${offset}`
            const res = await fetch(url)
            return res.json()
          },
          initialPageParam: 0,
          getNextPageParam: (lastPage, allPages) => {
            if (lastPage.hasMore) {
              return allPages.length
            }
            return undefined
          },
          pages: 1, // 첫 페이지만 프리페칭
        })
      }, index * 500) // 500ms 간격으로 순차 실행
    })
  }, [queryClient])

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
      <header className={`${headerClasses} text-white p-4 sticky top-0 z-50`}>
        <div>
          <h1 className="text-xl font-bold">키워드뉴스</h1>
          <p className="text-sm opacity-90">실시간 뉴스 속보</p>
        </div>
      </header>

      <BreakingBanner />

      <main ref={scrollRef} className="pb-20 bg-white dark:bg-gray-900 relative">
        {/* 백그라운드 갱신 인디케이터 (캐시가 있을 때) */}
        {!isLoading && isFetching && (
          <div className="absolute top-2 right-2 z-10">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="백그라운드 갱신 중"></div>
          </div>
        )}

        {/* 캐시가 없을 때만 로딩 스피너 표시 */}
        {isLoading && !data && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-2">뉴스를 불러오는 중...</p>
          </div>
        )}

        {!isLoading && allNews.length === 0 && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
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
