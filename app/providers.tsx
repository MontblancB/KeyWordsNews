'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { useState, useEffect } from 'react'
import { prefetchAllData } from '@/lib/prefetch-service'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 3 * 60 * 1000,        // 3분 (사용자 요청: 5분 → 3분)
            gcTime: 10 * 60 * 1000,          // 10분 (메모리 캐시 유지 시간)
            refetchOnMount: false,           // staleTime 내에서는 캐시 사용 (always → false)
            refetchOnWindowFocus: false,     // 포커스 시 갱신 비활성화
            refetchOnReconnect: true,        // 재연결 시 갱신
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <GlobalPrefetchService queryClient={queryClient} />
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        {children}
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

/**
 * 글로벌 프리페칭 서비스 (앱 로드 시 한 번만 실행)
 */
function GlobalPrefetchService({ queryClient }: { queryClient: QueryClient }) {
  useEffect(() => {
    // 백그라운드에서 모든 주요 데이터 프리페칭
    prefetchAllData(queryClient)
  }, [queryClient])

  return null
}
