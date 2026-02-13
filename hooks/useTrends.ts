'use client'

import { useQuery } from '@tanstack/react-query'

interface Trend {
  id?: string
  keyword: string
  rank: number
  country: string
  traffic?: string  // Google Trends RSS 트래픽 정보 (예: "100+", "500+")
  state?: string    // 상태: n=신규, +=상승, s=유지 (Signal.bz)
  collectedAt?: string
  createdAt?: string
}

interface TrendsResponse {
  success: boolean
  data: Trend[]
  cached: boolean
  collectedAt: string
  source?: string  // 'signal_bz' | 'google_trends_rss' | 'local_analysis'
}

export function useTrends() {
  return useQuery<TrendsResponse>({
    queryKey: ['trends', 'google'],
    queryFn: async () => {
      const res = await fetch('/api/trends/google')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to fetch trends')
      }
      return res.json()
    },
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 20 * 60 * 1000, // 20분
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
