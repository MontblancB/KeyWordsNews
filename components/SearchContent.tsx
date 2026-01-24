'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useInfiniteNewsSearch } from '@/hooks/useNews'
import NewsCard from '@/components/NewsCard'
import KeywordInfoModal from '@/components/KeywordInfoModal'
import { MagnifyingGlassIcon, ArrowLeftIcon, LightBulbIcon } from '@heroicons/react/24/outline'

export default function SearchContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const queryParam = searchParams.get('q') || ''

  const [keyword, setKeyword] = useState(queryParam)
  const [searchQuery, setSearchQuery] = useState(queryParam)
  const [isKeywordInfoOpen, setIsKeywordInfoOpen] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteNewsSearch(searchQuery)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (keyword.trim()) {
      setSearchQuery(keyword.trim())
    }
  }

  // URL 쿼리 파라미터가 변경되면 자동으로 검색 실행
  useEffect(() => {
    if (queryParam) {
      setKeyword(queryParam)
      setSearchQuery(queryParam)
    }
  }, [queryParam])

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
      {queryParam ? (
        <header className="bg-blue-600 text-white p-4 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-blue-700 rounded-lg transition-colors"
              aria-label="뒤로가기"
            >
              <ArrowLeftIcon className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">뉴스 검색</h1>
          </div>
        </header>
      ) : (
        <header className="bg-blue-600 text-white p-4 sticky top-0 z-50">
          <h1 className="text-xl font-bold mb-3">뉴스 검색</h1>
          <form onSubmit={handleSearch}>
            <div className="flex gap-2">
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="검색어를 입력하세요..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                검색
              </button>
            </div>
          </form>
        </header>
      )}

      <main className="pb-20 bg-white dark:bg-gray-900 relative">
        {!searchQuery && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p>검색어를 입력하여 뉴스를 찾아보세요</p>
          </div>
        )}

        {/* 백그라운드 갱신 인디케이터 (캐시가 있을 때) */}
        {!isLoading && isFetching && searchQuery && data && (
          <div className="absolute top-2 right-2 z-10">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" title="백그라운드 갱신 중"></div>
          </div>
        )}

        {/* 캐시가 없을 때만 로딩 스피너 표시 */}
        {isLoading && !data && searchQuery && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p className="mt-2">검색 중...</p>
          </div>
        )}

        {searchQuery && data && (
          <>
            <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-bold text-blue-600 dark:text-blue-400">{searchQuery}</span>
                에 대한 검색 결과{' '}
                <span className="font-bold">{totalCount}건</span>
                {allNews.length > 0 && (
                  <span className="text-gray-400 dark:text-gray-500 ml-2">
                    (현재 {allNews.length}건 표시)
                  </span>
                )}
              </p>
            </div>

            {/* 키워드 정보 버튼 */}
            {queryParam && allNews.length > 0 && (
              <div className="p-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsKeywordInfoOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors font-medium"
                >
                  <LightBulbIcon className="w-5 h-5" />
                  키워드 정보
                </button>
              </div>
            )}

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

                {/* 무한 스크롤 트리거 영역 */}
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
      </main>

      {/* 키워드 정보 모달 */}
      <KeywordInfoModal
        isOpen={isKeywordInfoOpen}
        onClose={() => setIsKeywordInfoOpen(false)}
        keyword={searchQuery}
      />
    </>
  )
}
