import { QueryClient } from '@tanstack/react-query'
import { getEnabledRssSourceNames, getTopKeywords } from './rss-settings'

/**
 * 글로벌 프리페칭 서비스
 *
 * 특징:
 * - 앱 로드 후 백그라운드에서 모든 주요 데이터 프리페칭
 * - requestIdleCallback 사용으로 사용자 경험 영향 최소화
 * - 사용자 인터랙션 감지 시 자동 일시 중지
 * - 네트워크 대역폭 제한 (순차 실행)
 */

let isPrefetching = false
let isPaused = false
let pauseTimer: NodeJS.Timeout | null = null

/**
 * 사용자 활동 감지 (스크롤, 터치, 클릭)
 */
function setupActivityDetection() {
  const pausePrefetching = () => {
    isPaused = true

    // 기존 타이머 제거
    if (pauseTimer) {
      clearTimeout(pauseTimer)
    }

    // 2초 후 재개
    pauseTimer = setTimeout(() => {
      isPaused = false
    }, 2000)
  }

  // 사용자 활동 이벤트 감지
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', pausePrefetching, { passive: true })
    window.addEventListener('touchstart', pausePrefetching, { passive: true })
    window.addEventListener('click', pausePrefetching)
  }
}

/**
 * 유휴 시간에 실행 (requestIdleCallback 또는 setTimeout fallback)
 */
function runWhenIdle(callback: () => Promise<void>) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    window.requestIdleCallback(async () => {
      if (!isPaused) {
        await callback()
      }
    }, { timeout: 2000 })
  } else {
    // fallback: setTimeout
    setTimeout(async () => {
      if (!isPaused) {
        await callback()
      }
    }, 100)
  }
}

/**
 * 지연 실행 (프리페칭 간 간격 보장)
 */
async function delay(ms: number) {
  return new Promise(resolve => {
    runWhenIdle(async () => {
      await new Promise(r => setTimeout(r, ms))
      resolve(undefined)
    })
  })
}

/**
 * 속보 프리페칭
 */
async function prefetchBreakingNews(queryClient: QueryClient, sources: string) {
  if (isPaused) {
    await new Promise(resolve => setTimeout(resolve, 100))
    return prefetchBreakingNews(queryClient, sources)
  }

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
}

/**
 * 카테고리 프리페칭
 */
async function prefetchCategory(
  queryClient: QueryClient,
  category: string,
  sources: string
) {
  if (isPaused) {
    await new Promise(resolve => setTimeout(resolve, 100))
    return prefetchCategory(queryClient, category, sources)
  }

  await queryClient.prefetchInfiniteQuery({
    queryKey: ['news', 'topic-infinite', category, sources],
    queryFn: async ({ pageParam = 0 }) => {
      const limit = pageParam === 0 ? 10 : 15
      const offset = pageParam === 0 ? 0 : 10 + (pageParam - 1) * 15

      const url = sources
        ? `/api/news/topics/${category}?limit=${limit}&offset=${offset}&sources=${encodeURIComponent(sources)}`
        : `/api/news/topics/${category}?limit=${limit}&offset=${offset}`
      const res = await fetch(url)
      return res.json()
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage: any) => {
      if (lastPage.hasMore) {
        return lastPage.pages?.length || 1
      }
      return undefined
    },
    pages: 1, // 첫 페이지만
  })
}

/**
 * 경제지표 프리페칭
 */
async function prefetchEconomyIndicators(queryClient: QueryClient) {
  if (isPaused) {
    await new Promise(resolve => setTimeout(resolve, 100))
    return prefetchEconomyIndicators(queryClient)
  }

  await queryClient.prefetchQuery({
    queryKey: ['economy-indicators'],
    queryFn: async () => {
      const res = await fetch('/api/economy/indicators')
      if (!res.ok) throw new Error('Failed to prefetch economy indicators')
      return res.json()
    },
  })
}

/**
 * 키워드 프리페칭
 */
async function prefetchKeyword(
  queryClient: QueryClient,
  keyword: string,
  sources: string
) {
  if (isPaused) {
    await new Promise(resolve => setTimeout(resolve, 100))
    return prefetchKeyword(queryClient, keyword, sources)
  }

  await queryClient.prefetchInfiniteQuery({
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
    getNextPageParam: (lastPage: any) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    },
    pages: 1,
  })
}

/**
 * 모든 데이터 프리페칭 (글로벌 실행)
 */
export async function prefetchAllData(queryClient: QueryClient) {
  // 이미 실행 중이면 중복 실행 방지
  if (isPrefetching) {
    console.log('[Prefetch] Already running, skipping...')
    return
  }

  isPrefetching = true
  console.log('[Prefetch] 🚀 Starting global prefetch service...')

  // 사용자 활동 감지 설정
  setupActivityDetection()

  const sources = getEnabledRssSourceNames()
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

  try {
    // 1초 후 시작 (현재 페이지 로딩 완료 대기)
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Priority 1: 속보 (가장 중요)
    console.log('[Prefetch] 📰 Prefetching breaking news...')
    await prefetchBreakingNews(queryClient, sources)
    await delay(150)

    // Priority 2: 모든 카테고리 (순차 실행)
    console.log('[Prefetch] 📂 Prefetching categories...')
    for (const category of allCategories) {
      await prefetchCategory(queryClient, category, sources)
      await delay(150) // 150ms 간격 보장 (사용자 경험 보호)
    }

    // Priority 3: 경제지표
    console.log('[Prefetch] 💹 Prefetching economy indicators...')
    await prefetchEconomyIndicators(queryClient)
    await delay(150)

    // Priority 4: 상위 키워드
    console.log('[Prefetch] 🔍 Prefetching keywords...')
    const topKeywords = getTopKeywords(3)
    for (const keyword of topKeywords) {
      await prefetchKeyword(queryClient, keyword, sources)
      await delay(150)
    }

    console.log('[Prefetch] ✅ Global prefetch completed!')
  } catch (error) {
    console.error('[Prefetch] ❌ Error during prefetch:', error)
  } finally {
    isPrefetching = false
  }
}

/**
 * 프리페칭 상태 초기화 (테스트용)
 */
export function resetPrefetchState() {
  isPrefetching = false
  isPaused = false
  if (pauseTimer) {
    clearTimeout(pauseTimer)
    pauseTimer = null
  }
}
