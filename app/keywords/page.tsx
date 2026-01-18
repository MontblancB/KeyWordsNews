// app/keywords/page.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useInfiniteNewsSearch } from '@/hooks/useNews'
import { getEnabledBreakingTabSourceNames } from '@/lib/rss-settings'
import { useKeywords } from '@/hooks/useKeywords'
import NewsCard from '@/components/NewsCard'
import BottomNav from '@/components/BottomNav'
import KeywordTabs from '@/components/KeywordTabs'
import KeywordManager from '@/components/KeywordManager'
import { useColorTheme } from '@/hooks/useColorTheme'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import InsightButton from '@/components/InsightButton'
import InsightModal from '@/components/InsightModal'

// 인사이트 데이터 타입
interface InsightData {
  insights: string
  keywords: string[]
}

export default function KeywordsPage() {
  const { headerClasses } = useColorTheme()
  const queryClient = useQueryClient()
  const sources = getEnabledBreakingTabSourceNames()
  const { keywords, addKeyword, deleteKeyword, moveKeywordUp, moveKeywordDown, hasKeywords } = useKeywords()
  const [activeKeyword, setActiveKeyword] = useState<string | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

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

  // ==========================================
  // InsightNow 기능 (Feature Flag로 제어)
  // ==========================================
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false)
  const [isInsightLoading, setIsInsightLoading] = useState(false)
  const [isInsightStreaming, setIsInsightStreaming] = useState(false)
  const [insightStreamingContent, setInsightStreamingContent] = useState('')
  const [insightData, setInsightData] = useState<InsightData | null>(null)
  const [insightError, setInsightError] = useState<string | null>(null)

  // 인사이트 모달 열기 및 API 호출
  const handleOpenInsight = useCallback(async () => {
    if (!FEATURE_FLAGS.ENABLE_DAILY_INSIGHT) return

    const allNewsForInsight = data?.pages.flatMap((page) => page.data) || []
    if (allNewsForInsight.length < 5) return

    // 상태 초기화
    setIsInsightModalOpen(true)
    setIsInsightLoading(true)
    setIsInsightStreaming(true)
    setInsightStreamingContent('')
    setInsightData(null)
    setInsightError(null)

    try {
      // 현재 로드된 모든 뉴스 사용
      const newsForApi = allNewsForInsight.map((news) => ({
        title: news.title,
        summary: news.summary || '',
        source: news.source,
        category: news.category,
      }))

      const response = await fetch('/api/insight/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsList: newsForApi }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      setIsInsightLoading(false)

      // SSE 스트리밍 처리
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              if (data.type === 'token') {
                setInsightStreamingContent((prev) => prev + data.content)
              } else if (data.type === 'done') {
                setInsightData(data.result)
                setIsInsightStreaming(false)
              } else if (data.type === 'error') {
                setInsightError(data.error)
                setIsInsightStreaming(false)
              }
            } catch {
              // JSON 파싱 실패 무시
            }
          }
        }
      }
    } catch (error) {
      setInsightError(error instanceof Error ? error.message : '알 수 없는 오류')
      setIsInsightLoading(false)
      setIsInsightStreaming(false)
    }
  }, [data])

  // 인사이트 모달 닫기
  const handleCloseInsight = useCallback(() => {
    if (isInsightStreaming) return // 스트리밍 중에는 닫지 않음
    setIsInsightModalOpen(false)
  }, [isInsightStreaming])

  // Pull-to-Refresh: 쿼리 리셋으로 완전히 새로 가져오기
  const pullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      if (activeKeyword) {
        await queryClient.resetQueries({
          queryKey: ['news', 'search-infinite', activeKeyword, sources],
        })
      }
    },
  })

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
    <div className="min-h-screen flex flex-col">
      {/* Pull-to-Refresh 인디케이터 */}
      <PullToRefreshIndicator {...pullToRefresh} />

      {/* 상단 고정 영역: 헤더 + 키워드 관리 + 키워드 탭 + InsightNow 버튼 */}
      <div className="sticky top-0 z-50">
        <header className={`${headerClasses} text-white p-4`}>
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

        {/* 키워드 탭 (키워드가 있을 때만) */}
        {hasKeywords && (
          <KeywordTabs
            keywords={keywords}
            activeKeyword={activeKeyword}
            onSelectKeyword={setActiveKeyword}
          />
        )}

        {/* InsightNow 버튼 (Feature Flag로 제어) */}
        {FEATURE_FLAGS.ENABLE_DAILY_INSIGHT && hasKeywords && activeKeyword && allNews.length >= 5 && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-3 overflow-x-auto">
              <InsightButton
                onClick={handleOpenInsight}
                isLoading={isInsightLoading}
                disabled={allNews.length < 5}
              />
            </div>
          </div>
        )}
      </div>

      <main className="pb-20 bg-white dark:bg-gray-900 relative">
        {/* 키워드가 없을 때 */}
        {!hasKeywords && (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            <p className="mb-2">등록된 키워드가 없습니다.</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              상단에서 관심있는 키워드를 추가해보세요.
            </p>
          </div>
        )}

        {/* 키워드가 있을 때 */}
        {hasKeywords && (
          <>
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
                        <NewsCard key={item.id} news={item} hideSource />
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

      {/* InsightNow 모달 (Feature Flag로 제어) */}
      {FEATURE_FLAGS.ENABLE_DAILY_INSIGHT && (
        <InsightModal
          isOpen={isInsightModalOpen}
          onClose={handleCloseInsight}
          isStreaming={isInsightStreaming}
          streamingContent={insightStreamingContent}
          insightData={insightData}
          error={insightError}
          newsCount={allNews.length}
        />
      )}
    </div>
  )
}
