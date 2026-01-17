import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { NewsItem } from '@/types/news'
import { getEnabledRssSourceNames } from '@/lib/rss-settings'

interface NewsResponse {
  success: boolean
  data: NewsItem[]
  source?: string
}

interface SearchResponse extends NewsResponse {
  keyword: string
  page: number
  totalPages: number
  total: number
}

export function useBreakingNews() {
  const sources = getEnabledRssSourceNames()
  return useQuery({
    queryKey: ['news', 'breaking', sources],
    queryFn: async () => {
      const url = sources ? `/api/news/breaking?sources=${encodeURIComponent(sources)}` : '/api/news/breaking'
      const res = await fetch(url)  // cache: 'no-store' 제거 (React Query가 캐싱 관리)
      if (!res.ok) throw new Error('Failed to fetch breaking news')
      const data: NewsResponse = await res.json()
      return data.data
    },
    staleTime: 30 * 1000,              // 0 → 30초 (30초간 캐시 활용)
    gcTime: 2 * 60 * 1000,             // 2분 (메모리 캐시 유지)
    refetchInterval: 60 * 1000,        // 30초 → 1분 (서버 부하 감소)
    refetchOnMount: true,              // 마운트 시 백그라운드 갱신
    refetchOnWindowFocus: true,        // 속보는 포커스 시에도 갱신
  })
}

export function useLatestNews() {
  return useQuery({
    queryKey: ['news', 'latest'],
    queryFn: async () => {
      const res = await fetch('/api/news/latest')
      if (!res.ok) throw new Error('Failed to fetch latest news')
      const data: NewsResponse = await res.json()
      return data.data
    },
    refetchInterval: 5 * 60 * 1000, // 5분마다
  })
}

export function useTopicNews(category: string) {
  const sources = getEnabledRssSourceNames()
  return useQuery({
    queryKey: ['news', 'topic', category, sources], // sources를 키에 포함
    queryFn: async () => {
      const url = sources
        ? `/api/news/topics/${category}?sources=${encodeURIComponent(sources)}`
        : `/api/news/topics/${category}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch ${category} news`)
      const data: NewsResponse = await res.json()
      return data.data
    },
    refetchInterval: 10 * 60 * 1000, // 10분마다
    enabled: !!category,
  })
}

export function useNewsSearch(keyword: string, page: number = 1) {
  const sources = getEnabledRssSourceNames()
  return useQuery({
    queryKey: ['news', 'search', keyword, page, sources], // sources를 키에 포함
    queryFn: async () => {
      const url = sources
        ? `/api/news/search?q=${encodeURIComponent(keyword)}&page=${page}&sources=${encodeURIComponent(sources)}`
        : `/api/news/search?q=${encodeURIComponent(keyword)}&page=${page}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to search news')
      const data: SearchResponse = await res.json()
      return data
    },
    enabled: keyword.length > 0,
  })
}

// 무한 스크롤용 검색 훅
export function useInfiniteNewsSearch(keyword: string) {
  const sources = getEnabledRssSourceNames()
  return useInfiniteQuery({
    queryKey: ['news', 'search-infinite', keyword, sources],
    queryFn: async ({ pageParam = 1 }) => {
      const url = sources
        ? `/api/news/search?q=${encodeURIComponent(keyword)}&page=${pageParam}&sources=${encodeURIComponent(sources)}`
        : `/api/news/search?q=${encodeURIComponent(keyword)}&page=${pageParam}`
      const res = await fetch(url)  // cache: 'no-store' 제거
      if (!res.ok) throw new Error('Failed to search news')
      const data: SearchResponse = await res.json()
      return data
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    enabled: keyword.length > 0,
    staleTime: 3 * 60 * 1000,         // 5분 → 3분
    gcTime: 10 * 60 * 1000,           // 10분 (메모리 캐시 유지)
    refetchInterval: false,           // 제거 (2분 → false, 불필요한 자동 갱신 제거)
    refetchOnMount: true,             // 마운트 시 백그라운드 갱신
    refetchOnWindowFocus: false,      // 명시적으로 false
  })
}

// 무한 스크롤용 최신 뉴스 훅
export function useInfiniteLatestNews() {
  const sources = getEnabledRssSourceNames()
  return useInfiniteQuery({
    queryKey: ['news', 'latest-infinite', sources],
    queryFn: async ({ pageParam = 0 }) => {
      // 첫 요청은 10개, 이후는 15개씩
      const limit = pageParam === 0 ? 10 : 15
      const offset = pageParam === 0 ? 0 : 10 + (pageParam - 1) * 15

      const url = sources
        ? `/api/news/latest?limit=${limit}&offset=${offset}&sources=${encodeURIComponent(sources)}`
        : `/api/news/latest?limit=${limit}&offset=${offset}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch latest news')
      const data = await res.json()
      return data
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length  // 페이지 번호 (0, 1, 2, 3...)
      }
      return undefined
    },
    initialPageParam: 0,
    staleTime: 3 * 60 * 1000,  // 5분 → 3분
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
}

// 무한 스크롤용 토픽 뉴스 훅
export function useInfiniteTopicNews(category: string) {
  const sources = getEnabledRssSourceNames()
  return useInfiniteQuery({
    queryKey: ['news', 'topic-infinite', category, sources],
    queryFn: async ({ pageParam = 0 }) => {
      // 첫 요청은 10개, 이후는 15개씩
      const limit = pageParam === 0 ? 10 : 15
      const offset = pageParam === 0 ? 0 : 10 + (pageParam - 1) * 15

      const url = sources
        ? `/api/news/topics/${category}?limit=${limit}&offset=${offset}&sources=${encodeURIComponent(sources)}`
        : `/api/news/topics/${category}?limit=${limit}&offset=${offset}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch ${category} news`)
      const data = await res.json()
      return data
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.hasMore) {
        return allPages.length  // 페이지 번호 (0, 1, 2, 3...)
      }
      return undefined
    },
    initialPageParam: 0,
    enabled: !!category,
    staleTime: 3 * 60 * 1000,  // 5분 → 3분
    gcTime: 10 * 60 * 1000,
    refetchInterval: false,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  })
}
