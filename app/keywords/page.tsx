// app/keywords/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useInfiniteNewsSearch } from '@/hooks/useNews'
import { useKeywords } from '@/hooks/useKeywords'
import NewsCard from '@/components/NewsCard'
import BottomNav from '@/components/BottomNav'
import KeywordTabs from '@/components/KeywordTabs'
import KeywordManager from '@/components/KeywordManager'
import { useColorTheme } from '@/hooks/useColorTheme'
import { useQueryClient } from '@tanstack/react-query'
import { getEnabledRssSourceNames } from '@/lib/rss-settings'

export default function KeywordsPage() {
  const { headerClasses } = useColorTheme()
  const { keywords, addKeyword, deleteKeyword, moveKeywordUp, moveKeywordDown, hasKeywords } = useKeywords()
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  // 첫 번째 키워드를 자동 선택
  useEffect(() => {
    if (keywords.length > 0 && !activeKeyword) {
      setActiveKeyword(keywords[0].keyword)
    }
  }, [keywords, activeKeyword])

  // 선택된 키워드로 뉴스 검색
  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteNewsSearch(activeKeyword || '')

  // 전략적 프리페칭: 속보 + 모든 카테고리 + 경제지표 (동적 순차)
  useEffect(() => {
    if (!isLoading && data && activeKeyword) {
      const sources = getEnabledRssSourceNames()
      const allCategories = ['politics', 'economy', 'society', 'world', 'tech', 'sports', 'entertainment', 'culture']

      // 500ms 후 동적 순차 프리페칭 시작
      setTimeout(async () => {
        // 1. 속보 프리페칭
        await queryClient.prefetchQuery({
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

        // 최소 간격 보장
        await new Promise(resolve => setTimeout(resolve, 100))

        // 2. 모든 카테고리 동적 순차 프리페칭
        for (const cat of allCategories) {
          const start = Date.now()

          await queryClient.prefetchInfiniteQuery({
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

          // 최소 100ms 간격 보장
          const elapsed = Date.now() - start
          if (elapsed < 100) {
            await new Promise(resolve => setTimeout(resolve, 100 - elapsed))
          }
        }

        // 3. 경제지표 프리페칭
        await queryClient.prefetchQuery({
          queryKey: ['economy-indicators'],
          queryFn: async () => {
            const res = await fetch('/api/economy/indicators')
            if (!res.ok) throw new Error('Failed to prefetch economy indicators')
            return res.json()
          },
          staleTime: 5 * 60 * 1000,
        })
      }, 500)
    }
  }, [isLoading, data, activeKeyword, queryClient])

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
  const totalCount = data?.pages[0]?.total || 0

  return (
    <>
      {/* 헤더 */}
      <header className={`${headerClasses} text-white p-4 sticky top-0 z-50`}>
        <h1 className="text-xl font-bold">키워드 뉴스</h1>
      </header>

      {/* 키워드 관리 UI */}
      <KeywordManager
        keywords={keywords}
        onAdd={addKeyword}
        onDelete={deleteKeyword}
        onMoveUp={moveKeywordUp}
        onMoveDown={moveKeywordDown}
      />

      <main className="pb-20 bg-white dark:bg-gray-900">
        {/* 키워드가 없을 때 */}
        {!hasKeywords && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p className="mb-2">등록된 키워드가 없습니다.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              상단에서 관심있는 키워드를 추가해보세요.
            </p>
          </div>
        )}

        {/* 키워드 탭 */}
        {hasKeywords && (
          <>
            <KeywordTabs
              keywords={keywords}
              activeKeyword={activeKeyword}
              onSelectKeyword={setActiveKeyword}
            />

            {/* 백그라운드 갱신 인디케이터 (캐시가 있을 때) */}
            {!isLoading && isFetching && activeKeyword && data && (
              <div className="absolute top-2 right-2 z-10">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="백그라운드 갱신 중"></div>
              </div>
            )}

            {/* 캐시가 없을 때만 로딩 스피너 표시 */}
            {isLoading && !data && activeKeyword && (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
                <p className="mt-2">검색 중...</p>
              </div>
            )}

            {/* 뉴스 리스트 */}
            {activeKeyword && data && (
              <>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-bold text-blue-600 dark:text-blue-400">{activeKeyword}</span>
                    에 대한 검색 결과{' '}
                    <span className="font-bold">{totalCount}건</span>
                    {allNews.length > 0 && (
                      <span className="text-gray-400 dark:text-gray-500 ml-2">
                        (현재 {allNews.length}건 표시)
                      </span>
                    )}
                  </p>
                </div>

                {allNews.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <p>검색 결과가 없습니다.</p>
                  </div>
                ) : (
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
                          모든 검색 결과를 불러왔습니다.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </>
  )
}
