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
  return useQuery({
    queryKey: ['news', 'breaking'],
    queryFn: async () => {
      const sources = getEnabledRssSourceNames()
      const url = sources ? `/api/news/breaking?sources=${encodeURIComponent(sources)}` : '/api/news/breaking'
      const res = await fetch(url, { cache: 'no-store' }) // 캐시 방지
      if (!res.ok) throw new Error('Failed to fetch breaking news')
      const data: NewsResponse = await res.json()
      return data.data
    },
    refetchInterval: 30 * 1000, // 30초마다 자동 갱신
    staleTime: 0, // 항상 최신 데이터 가져오기
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
  return useQuery({
    queryKey: ['news', 'topic', category],
    queryFn: async () => {
      const sources = getEnabledRssSourceNames()
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
  return useQuery({
    queryKey: ['news', 'search', keyword, page],
    queryFn: async () => {
      const sources = getEnabledRssSourceNames()
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
  return useInfiniteQuery({
    queryKey: ['news', 'search-infinite', keyword],
    queryFn: async ({ pageParam = 1 }) => {
      const sources = getEnabledRssSourceNames()
      const url = sources
        ? `/api/news/search?q=${encodeURIComponent(keyword)}&page=${pageParam}&sources=${encodeURIComponent(sources)}`
        : `/api/news/search?q=${encodeURIComponent(keyword)}&page=${pageParam}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to search news')
      const data: SearchResponse = await res.json()
      return data
    },
    getNextPageParam: (lastPage) => {
      // 다음 페이지가 있으면 페이지 번호 반환, 없으면 undefined
      if (lastPage.page < lastPage.totalPages) {
        return lastPage.page + 1
      }
      return undefined
    },
    initialPageParam: 1,
    enabled: keyword.length > 0,
    refetchInterval: 2 * 60 * 1000, // 2분마다 자동 갱신
    staleTime: 1 * 60 * 1000, // 1분 후 stale로 간주
  })
}

// 무한 스크롤용 최신 뉴스 훅
export function useInfiniteLatestNews() {
  return useInfiniteQuery({
    queryKey: ['news', 'latest-infinite'],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch(`/api/news/latest?limit=20&offset=${pageParam}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch latest news')
      const data = await res.json()
      return data
    },
    getNextPageParam: (lastPage, allPages) => {
      // hasMore가 true이면 다음 offset 반환
      if (lastPage.hasMore) {
        return allPages.length * 20
      }
      return undefined
    },
    initialPageParam: 0,
    refetchInterval: 2 * 60 * 1000, // 2분마다 자동 갱신
    staleTime: 1 * 60 * 1000, // 1분 후 stale로 간주
  })
}

// 무한 스크롤용 토픽 뉴스 훅
export function useInfiniteTopicNews(category: string) {
  return useInfiniteQuery({
    queryKey: ['news', 'topic-infinite', category],
    queryFn: async ({ pageParam = 0 }) => {
      const sources = getEnabledRssSourceNames()
      const url = sources
        ? `/api/news/topics/${category}?limit=20&offset=${pageParam}&sources=${encodeURIComponent(sources)}`
        : `/api/news/topics/${category}?limit=20&offset=${pageParam}`
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Failed to fetch ${category} news`)
      const data = await res.json()
      return data
    },
    getNextPageParam: (lastPage, allPages) => {
      // hasMore가 true이면 다음 offset 반환
      if (lastPage.hasMore) {
        return allPages.length * 20
      }
      return undefined
    },
    initialPageParam: 0,
    enabled: !!category,
    refetchInterval: 3 * 60 * 1000, // 3분마다 자동 갱신
    staleTime: 1 * 60 * 1000, // 1분 후 stale로 간주
  })
}
