'use client'

import { useEffect, useRef } from 'react'
import { useInfiniteTopicNews } from '@/hooks/useNews'
import NewsCard from '@/components/NewsCard'
import BottomNav from '@/components/BottomNav'
import CategoryTabs from '@/components/CategoryTabs'
import { useParams } from 'next/navigation'
import { useColorTheme } from '@/hooks/useColorTheme'
import { useQueryClient } from '@tanstack/react-query'
import { getEnabledRssSourceNames, getTopKeywords } from '@/lib/rss-settings'

export default function TopicPage() {
  const { headerClasses } = useColorTheme()
  const params = useParams()
  const category = params.category as string
  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    isFetching,
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

  // 전략적 프리페칭: 속보 + 모든 카테고리 + 경제지표 + 키워드
  useEffect(() => {
    if (!isLoading && data) {
      const sources = getEnabledRssSourceNames()
      const allCategories = ['politics', 'economy', 'society', 'world', 'tech', 'sports', 'entertainment', 'culture']

      // 500ms 후 프리페칭 시작
      setTimeout(() => {
        // 1. 속보 프리페칭
        queryClient.prefetchQuery({
          queryKey: ['news', 'breaking', sources],
          queryFn: async () => {
            const url = sources
              ? `/api/news/breaking?sources=${encodeURIComponent(sources)}`
              : '/api/news/breaking'
            const res = await fetch(url)
            if (!res.ok) throw new Error('Failed to prefetch breaking news')
            const data = await res.json()
            return data.data
          },
        })

        // 2. 모든 카테고리 순차 프리페칭 (1000ms부터 500ms 간격)
        setTimeout(() => {
          allCategories.forEach((cat, index) => {
            // 현재 카테고리는 이미 로드되었으므로 스킵
            if (cat === category) return

            setTimeout(() => {
              queryClient.prefetchInfiniteQuery({
                queryKey: ['news', 'topic-infinite', cat, sources],
                queryFn: async ({ pageParam = 0 }) => {
                  const limit = pageParam === 0 ? 10 : 15
                  const offset = pageParam === 0 ? 0 : 10 + (pageParam - 1) * 15

                  const url = sources
                    ? `/api/news/topics/${cat}?limit=${limit}&offset=${offset}&sources=${encodeURIComponent(sources)}`
                    : `/api/news/topics/${cat}?limit=${limit}&offset=${offset}`
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
                pages: 1,
              })
            }, index * 500) // 500ms 간격으로 순차 실행
          })
        }, 500)

        // 3. 경제지표 프리페칭 (5500ms = 500 + 500 + 8개 * 500)
        setTimeout(() => {
          queryClient.prefetchQuery({
            queryKey: ['economy-indicators'],
            queryFn: async () => {
              const res = await fetch('/api/economy/indicators')
              if (!res.ok) throw new Error('Failed to prefetch economy indicators')
              return res.json()
            },
            staleTime: 5 * 60 * 1000,
          })

          // 4. 키워드 프리페칭 (6000ms)
          setTimeout(() => {
            const topKeywords = getTopKeywords(3)

            topKeywords.forEach((keyword, index) => {
              setTimeout(() => {
                queryClient.prefetchInfiniteQuery({
                  queryKey: ['news', 'search-infinite', keyword, sources],
                  queryFn: async ({ pageParam = 1 }) => {
                    const url = sources
                      ? `/api/news/search?q=${encodeURIComponent(keyword)}&page=${pageParam}&sources=${encodeURIComponent(sources)}`
                      : `/api/news/search?q=${encodeURIComponent(keyword)}&page=${pageParam}`
                    const res = await fetch(url)
                    if (!res.ok) throw new Error('Failed to prefetch keyword search')
                    return res.json()
                  },
                  initialPageParam: 1,
                  getNextPageParam: (lastPage) => {
                    if (lastPage.page < lastPage.totalPages) {
                      return lastPage.page + 1
                    }
                    return undefined
                  },
                  pages: 1,
                })
              }, index * 300)
            })
          }, 500)
        }, 5000)
      }, 500)
    }
  }, [isLoading, data, category, queryClient])

  // 첫 10개 로드 후 자동으로 나머지 페이지 로드 (백그라운드)
  useEffect(() => {
    if (!isLoading && data && data.pages.length === 1 && hasNextPage && !isFetchingNextPage) {
      const timer = setTimeout(() => {
        fetchNextPage()
      }, 500) // 500ms 후 자동 로드 시작

      return () => clearTimeout(timer)
    }
  }, [isLoading, data, hasNextPage, isFetchingNextPage, fetchNextPage])

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
      <header className={`${headerClasses} text-white p-4`}>
        <h1 className="text-xl font-bold">
          {categoryNames[category] || category} 뉴스
        </h1>
      </header>

      <CategoryTabs />

      <main className="pb-20 bg-white dark:bg-gray-900 relative">
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
