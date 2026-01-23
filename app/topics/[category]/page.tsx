'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useInfiniteTopicNews } from '@/hooks/useNews'
import { getEnabledCategorySourceNames } from '@/lib/rss-settings'
import NewsCard from '@/components/NewsCard'
import BottomNav from '@/components/BottomNav'
import CategoryTabs from '@/components/CategoryTabs'
import { useParams } from 'next/navigation'
import { useColorTheme } from '@/hooks/useColorTheme'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator'
import { FEATURE_FLAGS } from '@/lib/feature-flags'
import InsightButton from '@/components/InsightButton'
import InsightModal from '@/components/InsightModal'
import SummarizeButton from '@/components/SummarizeButton'
import SummarizeModal from '@/components/SummarizeModal'
import BubbleButton from '@/components/KeywordBubbleMap/BubbleButton'
import BubbleModal from '@/components/KeywordBubbleMap/BubbleModal'

// 인사이트 데이터 타입
interface InsightData {
  insights: string
  keywords: string[]
}

// 종합 요약 데이터 타입
interface SummaryData {
  summary: string
  keywords: string[]
}

// 버블맵 데이터 타입
interface BubbleMapData {
  keywords: Array<{
    id: string
    text: string
    count: number
    value: number
    newsIds: string[]
  }>
  links: Array<{
    source: string
    target: string
    strength: number
  }>
  metadata: {
    totalNews: number
    totalKeywords: number
    generatedAt: string
  }
}

export default function TopicPage() {
  const { headerClasses } = useColorTheme()
  const queryClient = useQueryClient()
  const params = useParams()
  const category = params.category as string
  const sources = getEnabledCategorySourceNames(category)

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteTopicNews(category)

  const loadMoreRef = useRef<HTMLDivElement>(null)

  // ==========================================
  // InsightNow 기능 (Feature Flag로 제어)
  // ==========================================
  const [isInsightModalOpen, setIsInsightModalOpen] = useState(false)
  const [isInsightLoading, setIsInsightLoading] = useState(false)
  const [insightData, setInsightData] = useState<InsightData | null>(null)
  const [insightError, setInsightError] = useState<string | null>(null)

  // ==========================================
  // SummarizeNow 기능 (Feature Flag로 제어)
  // ==========================================
  const [isSummarizeModalOpen, setIsSummarizeModalOpen] = useState(false)
  const [isSummarizeLoading, setIsSummarizeLoading] = useState(false)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [summarizeError, setSummarizeError] = useState<string | null>(null)

  // ==========================================
  // BubbleNow 기능 (Feature Flag로 제어)
  // ==========================================
  const [isBubbleModalOpen, setIsBubbleModalOpen] = useState(false)
  const [isBubbleLoading, setIsBubbleLoading] = useState(false)
  const [bubbleData, setBubbleData] = useState<BubbleMapData | null>(null)
  const [bubbleError, setBubbleError] = useState<string | null>(null)

  // 인사이트 모달 열기 및 API 호출
  const handleOpenInsight = useCallback(async () => {
    if (!FEATURE_FLAGS.ENABLE_DAILY_INSIGHT) return

    const allNewsForInsight = data?.pages.flatMap((page) => page.data) || []
    if (allNewsForInsight.length < 5) return

    // 상태 초기화
    setIsInsightModalOpen(true)
    setIsInsightLoading(true)
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

      // 카테고리 정보를 함께 전달하여 전문가 관점의 인사이트 생성
      const response = await fetch('/api/insight/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsList: newsForApi, category }),
      })

      const result = await response.json()

      if (!response.ok) {
        // 상세 에러 정보가 있으면 함께 표시
        const errorMsg = result.details
          ? `${result.error}\n\n상세: ${result.details}`
          : (result.error || `HTTP ${response.status}`)
        throw new Error(errorMsg)
      }

      setInsightData(result.data)
    } catch (error) {
      setInsightError(error instanceof Error ? error.message : '알 수 없는 오류')
    } finally {
      setIsInsightLoading(false)
    }
  }, [data, category])

  // 인사이트 모달 닫기
  const handleCloseInsight = useCallback(() => {
    if (isInsightLoading) return // 로딩 중에는 닫지 않음
    setIsInsightModalOpen(false)
  }, [isInsightLoading])

  // 종합 요약 모달 열기 및 API 호출
  const handleOpenSummarize = useCallback(async () => {
    if (!FEATURE_FLAGS.ENABLE_DAILY_INSIGHT) return

    const allNewsForSummarize = data?.pages.flatMap((page) => page.data) || []
    if (allNewsForSummarize.length < 5) return

    // 상태 초기화
    setIsSummarizeModalOpen(true)
    setIsSummarizeLoading(true)
    setSummaryData(null)
    setSummarizeError(null)

    try {
      // 현재 로드된 모든 뉴스 사용
      const newsForApi = allNewsForSummarize.map((news) => ({
        title: news.title,
        summary: news.summary || '',
        source: news.source,
        category: news.category,
      }))

      const response = await fetch('/api/summarize/now', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsList: newsForApi }),
      })

      const result = await response.json()

      if (!response.ok) {
        // 상세 에러 정보가 있으면 함께 표시
        const errorMsg = result.details
          ? `${result.error}\n\n상세: ${result.details}`
          : (result.error || `HTTP ${response.status}`)
        throw new Error(errorMsg)
      }

      setSummaryData(result.data)
    } catch (error) {
      setSummarizeError(error instanceof Error ? error.message : '알 수 없는 오류')
    } finally {
      setIsSummarizeLoading(false)
    }
  }, [data])

  // 종합 요약 모달 닫기
  const handleCloseSummarize = useCallback(() => {
    if (isSummarizeLoading) return // 로딩 중에는 닫지 않음
    setIsSummarizeModalOpen(false)
  }, [isSummarizeLoading])

  // 버블맵 모달 열기 및 API 호출
  const handleOpenBubble = useCallback(async () => {
    if (!FEATURE_FLAGS.ENABLE_DAILY_INSIGHT) return

    // 현재 로드된 모든 뉴스 사용 (InsightNow, SummarizeNow와 동일)
    const allNewsForBubble = data?.pages.flatMap((page) => page.data) || []

    console.log(`[BubbleNow] 현재 로드된 뉴스 (${category}): ${allNewsForBubble.length}개`)

    if (allNewsForBubble.length < 5) return

    // 상태 초기화
    setIsBubbleModalOpen(true)
    setIsBubbleLoading(true)
    setBubbleData(null)
    setBubbleError(null)

    try {
      // 뉴스 전체 데이터 전송 (realtime-collector 모드 지원)
      const response = await fetch('/api/news/bubble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsList: allNewsForBubble, category }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`)
      }

      setBubbleData(result.data)
    } catch (error) {
      setBubbleError(error instanceof Error ? error.message : '알 수 없는 오류')
    } finally {
      setIsBubbleLoading(false)
    }
  }, [data, category])

  // 버블맵 모달 닫기
  const handleCloseBubble = useCallback(() => {
    if (isBubbleLoading) return // 로딩 중에는 닫지 않음
    setIsBubbleModalOpen(false)
  }, [isBubbleLoading])

  // Pull-to-Refresh: 쿼리 리셋으로 완전히 새로 가져오기
  const pullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      await queryClient.resetQueries({
        queryKey: ['news', 'topic-infinite', category, sources],
      })
    },
  })

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
    <div className="min-h-screen flex flex-col">
      {/* Pull-to-Refresh 인디케이터 */}
      <PullToRefreshIndicator {...pullToRefresh} />

      {/* 상단 고정 영역: 헤더 + 카테고리 탭 + InsightNow 버튼 */}
      <div className="sticky top-0 z-50">
        <header className={`${headerClasses} text-white p-4`}>
          <h1 className="text-xl font-bold">
            {categoryNames[category] || category} 뉴스
          </h1>
        </header>

        <CategoryTabs />

        {/* InsightNow & SummarizeNow & BubbleNow 버튼 (Feature Flag로 제어) */}
        {FEATURE_FLAGS.ENABLE_DAILY_INSIGHT && allNews.length >= 5 && (
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-3 overflow-x-auto">
              <InsightButton
                onClick={handleOpenInsight}
                isLoading={isInsightLoading}
                disabled={allNews.length < 5}
              />
              <SummarizeButton
                onClick={handleOpenSummarize}
                isLoading={isSummarizeLoading}
                disabled={allNews.length < 5}
              />
              <BubbleButton
                onClick={handleOpenBubble}
                isLoading={isBubbleLoading}
                disabled={allNews.length < 5}
              />
            </div>
          </div>
        )}
      </div>

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
                  모든 뉴스를 불러왔습니다.
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav />

      {/* InsightNow 모달 (Feature Flag로 제어) */}
      {FEATURE_FLAGS.ENABLE_DAILY_INSIGHT && (
        <InsightModal
          isOpen={isInsightModalOpen}
          onClose={handleCloseInsight}
          isLoading={isInsightLoading}
          insightData={insightData}
          error={insightError}
          newsCount={allNews.length}
        />
      )}

      {/* SummarizeNow 모달 (Feature Flag로 제어) */}
      {FEATURE_FLAGS.ENABLE_DAILY_INSIGHT && (
        <SummarizeModal
          isOpen={isSummarizeModalOpen}
          onClose={handleCloseSummarize}
          isLoading={isSummarizeLoading}
          summaryData={summaryData}
          error={summarizeError}
          newsCount={allNews.length}
        />
      )}

      {/* BubbleNow 모달 (Feature Flag로 제어) */}
      {FEATURE_FLAGS.ENABLE_DAILY_INSIGHT && (
        <BubbleModal
          isOpen={isBubbleModalOpen}
          onClose={handleCloseBubble}
          keywords={bubbleData?.keywords}
          links={bubbleData?.links}
          metadata={bubbleData?.metadata}
          isLoading={isBubbleLoading}
          error={bubbleError}
        />
      )}
    </div>
  )
}
