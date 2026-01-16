import { useQuery } from '@tanstack/react-query'
import type { EconomyData } from '@/types/economy'

interface EconomyResponse {
  success: boolean
  data: EconomyData
  error?: string
}

/**
 * 경제 지표 데이터 가져오기
 */
async function fetchEconomyData(): Promise<EconomyData> {
  const response = await fetch('/api/economy/indicators')
  const json: EconomyResponse = await response.json()

  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch economy data')
  }

  return json.data
}

/**
 * 경제 지표 데이터 훅
 */
export function useEconomy() {
  return useQuery<EconomyData>({
    queryKey: ['economy', 'indicators'],
    queryFn: fetchEconomyData,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 5 * 60 * 1000, // 5분 (cacheTime은 deprecated, gcTime 사용)
    refetchOnWindowFocus: true,
    refetchInterval: 3 * 60 * 1000, // 3분마다 자동 새로고침
  })
}
