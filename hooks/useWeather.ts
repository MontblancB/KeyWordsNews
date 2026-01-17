import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { WeatherData } from '@/types/weather'

interface WeatherResponse {
  success: boolean
  data: WeatherData
  cached?: boolean
  error?: string
}

async function fetchWeatherData(forceRefresh = false): Promise<WeatherData> {
  const url = forceRefresh
    ? `/api/weather?force=true&t=${Date.now()}`
    : `/api/weather`

  const response = await fetch(url, {
    cache: forceRefresh ? 'no-store' : 'default',
  })
  const json: WeatherResponse = await response.json()

  if (!json.success) {
    throw new Error(json.error || 'Failed to fetch weather data')
  }

  return json.data
}

export function useWeather() {
  const queryClient = useQueryClient()

  const query = useQuery<WeatherData>({
    queryKey: ['weather', 'seoul'],
    queryFn: () => fetchWeatherData(),
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 20 * 60 * 1000, // 20분
    refetchOnWindowFocus: true,
    refetchInterval: 10 * 60 * 1000, // 10분마다 자동 새로고침
  })

  // 강제 새로고침
  const forceMutation = useMutation({
    mutationFn: async () => {
      return await fetchWeatherData(true)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['weather', 'seoul'], data)
    },
  })

  return {
    ...query,
    forceRefetch: forceMutation.mutate,
    isRefetching: query.isRefetching || forceMutation.isPending,
  }
}
