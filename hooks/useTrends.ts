'use client'

import { useQuery } from '@tanstack/react-query'

interface Trend {
  id?: string
  keyword: string
  rank: number
  country: string
  collectedAt?: string
  createdAt?: string
  traffic?: string  // Google Trends RSS 트래픽 정보 (예: "100+", "500+")
}

interface TrendsResponse {
  success: boolean
  data: Trend[]
  cached: boolean
  collectedAt: string
  source?: string  // 'google_trends_rss' 또는 'local_analysis'
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
    staleTime: 60 * 60 * 1000, // 1시간
    gcTime: 2 * 60 * 60 * 1000, // 2시간
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
