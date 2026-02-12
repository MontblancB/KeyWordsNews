import { useQuery } from '@tanstack/react-query'
import type { TrendingStocksData } from '@/types/trending-stock'

interface TrendingStocksResponse {
  success: boolean
  data: TrendingStocksData
  error?: string
}

async function fetchTrendingStocksData(): Promise<TrendingStocksData> {
  const response = await fetch('/api/economy/trending-stocks')
  const json: TrendingStocksResponse = await response.json()

  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch trending stocks')
  }

  return json.data
}

/**
 * 실시간 주목 종목 데이터 훅
 */
export function useTrendingStocks() {
  return useQuery<TrendingStocksData>({
    queryKey: ['economy', 'trending-stocks'],
    queryFn: fetchTrendingStocksData,
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 3 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}
