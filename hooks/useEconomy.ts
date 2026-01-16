import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { EconomyData } from '@/types/economy'

interface EconomyResponse {
  success: boolean
  data: EconomyData
  error?: string
}

/**
 * 경제 지표 데이터 가져오기
 */
async function fetchEconomyData(forceRefresh = false): Promise<EconomyData> {
  // 강제 새로고침 시 타임스탬프를 추가하여 캐시 우회
  const timestamp = forceRefresh ? Date.now() : ''
  const url = forceRefresh
    ? `/api/economy/indicators?force=true&t=${timestamp}`
    : '/api/economy/indicators'
  const response = await fetch(url, {
    // 캐시 무효화
    cache: forceRefresh ? 'no-store' : 'default',
  })
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
  const queryClient = useQueryClient()

  const query = useQuery<EconomyData>({
    queryKey: ['economy', 'indicators'],
    queryFn: () => fetchEconomyData(false),
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 5 * 60 * 1000, // 5분 (cacheTime은 deprecated, gcTime 사용)
    refetchOnWindowFocus: true,
    refetchInterval: 3 * 60 * 1000, // 3분마다 자동 새로고침
  })

  // 강제 새로고침 mutation
  const forceMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 [useEconomy] Force refresh triggered')
      const data = await fetchEconomyData(true)
      console.log('✅ [useEconomy] Fresh data received:', {
        lastUpdated: data.lastUpdated,
        kospi: data.domestic.kospi.value,
      })
      return data
    },
    onSuccess: (data) => {
      // 캐시 업데이트
      queryClient.setQueryData(['economy', 'indicators'], data)
      console.log('💾 [useEconomy] Cache updated with new data')
    },
    onError: (error) => {
      console.error('❌ [useEconomy] Force refresh failed:', error)
    },
  })

  return {
    ...query,
    forceRefetch: forceMutation.mutate,
    isRefetching: query.isRefetching || forceMutation.isPending,
  }
}
