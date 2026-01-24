'use client'

import { useQuery } from '@tanstack/react-query'

interface Trend {
  id?: string
  keyword: string
  rank: number
  country: string
  collectedAt?: string
  createdAt?: string
  traffic?: string  // trendspyg 트래픽 정보 (예: "100+", "2000+")
  news_headline?: string  // trendspyg 뉴스 헤드라인
}

interface TrendsResponse {
  success: boolean
  data: Trend[]
  cached: boolean
  collectedAt: string
}

export function useTrends() {
  return useQuery<TrendsResponse>({
    queryKey: ['trends', 'pytrends'],
    queryFn: async () => {
      // Pytrends API 먼저 시도
      try {
        const res = await fetch('/api/trends/pytrends')
        if (res.ok) {
          const data = await res.json()
          if (data.success) {
            return data
          }
        }
      } catch (error) {
        console.warn('Pytrends API failed, falling back to local analysis')
      }

      // Fallback: 로컬 뉴스 분석
      const res = await fetch('/api/trends/google')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch trends')
      }
      return res.json()
    },
    staleTime: 60 * 60 * 1000, // 1시간
    gcTime: 2 * 60 * 60 * 1000, // 2시간
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
