'use client'

import { useQuery } from '@tanstack/react-query'

interface Trend {
  id: string
  keyword: string
  rank: number
  country: string
  collectedAt: string
  createdAt: string
}

interface TrendsResponse {
  success: boolean
  data: Trend[]
  cached: boolean
  collectedAt: string
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
    gcTime: 2 * 60 * 60 * 1000, // 2시간 (React Query v5에서 cacheTime -> gcTime)
    refetchOnWindowFocus: false,
    retry: 1,
  })
}
