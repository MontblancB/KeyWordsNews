'use client'

import { useState, useEffect, useRef } from 'react'
import { useInfiniteNewsSearch } from '@/hooks/useNews'
import NewsCard from '@/components/NewsCard'
import BottomNav from '@/components/BottomNav'
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function SearchPage() {
  const [keyword, setKeyword] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    isRefetching,
  } = useInfiniteNewsSearch(searchQuery)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (keyword.trim()) {
      setSearchQuery(keyword.trim())
    }
  }

  // 무한 스크롤: Intersection Observer 사용
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

  // 모든 페이지의 뉴스를 하나의 배열로 합침
  const allNews = data?.pages.flatMap((page) => page.data) || []
  const totalCount = data?.pages[0]?.total || 0

  return (
    <>
      <header className="bg-blue-600 text-white p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold">뉴스 검색</h1>
          {searchQuery && (
            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2 hover:bg-blue-700 rounded-full transition-colors disabled:opacity-50"
              title="새로고침"
            >
              <ArrowPathIcon className={`w-5 h-5 ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="검색어를 입력하세요..."
              className="w-full px-4 py-2 pr-12 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          </div>
        </form>
      </header>

      <main className="pb-20">
        {!searchQuery && (
          <div className="p-8 text-center text-gray-500">
            <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p>검색어를 입력하여 뉴스를 찾아보세요</p>
          </div>
        )}

        {isLoading && searchQuery && (
          <div className="p-8 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2">검색 중...</p>
          </div>
        )}

        {searchQuery && data && (
          <>
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                <span className="font-bold text-blue-600">{searchQuery}</span>
                에 대한 검색 결과{' '}
                <span className="font-bold">{totalCount}건</span>
                {allNews.length > 0 && (
                  <span className="text-gray-400 ml-2">
                    (현재 {allNews.length}건 표시)
                  </span>
                )}
              </p>
            </div>

            {allNews.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p>검색 결과가 없습니다.</p>
              </div>
            ) : (
              <>
                <div>
                  {allNews.map((item) => (
                    <NewsCard key={item.id} news={item} />
                  ))}
                </div>

                {/* 무한 스크롤 트리거 영역 */}
                <div ref={loadMoreRef} className="p-4">
                  {isFetchingNextPage && (
                    <div className="text-center text-gray-500">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <p className="mt-2 text-sm">더 불러오는 중...</p>
                    </div>
                  )}
                  {!hasNextPage && allNews.length > 0 && (
                    <div className="text-center text-gray-400 text-sm">
                      모든 검색 결과를 불러왔습니다.
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </>
  )
}
