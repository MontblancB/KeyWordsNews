'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from 'next-themes'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,        // 5분 (1분 → 5분)
            gcTime: 10 * 60 * 1000,          // 10분 (메모리 캐시 유지 시간)
            refetchOnMount: 'always',        // 마운트 시 백그라운드 갱신
            refetchOnWindowFocus: false,     // 포커스 시 갱신 비활성화
            refetchOnReconnect: true,        // 재연결 시 갱신
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        {children}
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
