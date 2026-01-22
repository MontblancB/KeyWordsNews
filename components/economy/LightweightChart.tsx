'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'

interface LightweightChartProps {
  indexCode: 'KOSPI' | 'KOSDAQ'
  dateRange: '1D' | '1W' | '1M' | '3M' | '12M' | '60M'
  height?: number
}

// dateRange를 API range로 변환
function getApiRange(dateRange: string): string {
  switch (dateRange) {
    case '1D':
      return '1d'
    case '1W':
      return '5d'
    case '1M':
      return '1mo'
    case '3M':
      return '3mo'
    case '12M':
      return '1y'
    case '60M':
      return '5y'
    default:
      return '3mo'
  }
}

export default function LightweightChart({
  indexCode,
  dateRange,
  height = 350,
}: LightweightChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true)
  }, [])

  // 브라우저 환경 체크
  if (typeof window === 'undefined') {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg"
        style={{ height }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  useEffect(() => {
    if (!containerRef.current || !mounted) return

    const isDark = resolvedTheme === 'dark'

    console.log('[LightweightChart] Initializing chart:', {
      indexCode,
      dateRange,
      theme: resolvedTheme,
    })

    // Dynamic import로 createChart 로드
    let chart: any = null
    let candlestickSeries: any = null

    const initChart = async () => {
      try {
        // 브라우저에서만 lightweight-charts 로드 - v5 API
        const { createChart, CandlestickSeries } = await import('lightweight-charts')

        if (!containerRef.current) return

        console.log('[LightweightChart] Initializing with v5 API')

        // 차트 생성
        chart = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height,
          layout: {
            background: { color: isDark ? '#1f2937' : '#ffffff' },
            textColor: isDark ? '#d1d5db' : '#374151',
          },
          grid: {
            vertLines: { color: isDark ? '#374151' : '#e5e7eb' },
            horzLines: { color: isDark ? '#374151' : '#e5e7eb' },
          },
          timeScale: {
            borderColor: isDark ? '#4b5563' : '#d1d5db',
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            borderColor: isDark ? '#4b5563' : '#d1d5db',
          },
        })

        chartRef.current = chart

        // 캔들스틱 시리즈 추가 - v5 API (addSeries 사용)
        candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#ef4444', // 빨강 (상승)
          downColor: '#3b82f6', // 파랑 (하락)
          borderUpColor: '#ef4444',
          borderDownColor: '#3b82f6',
          wickUpColor: '#ef4444',
          wickDownColor: '#3b82f6',
        })

        seriesRef.current = candlestickSeries

        console.log('[LightweightChart] ✅ Chart and series created successfully')

        // 데이터 가져오기
        setLoading(true)
        setError(null)

        const apiRange = getApiRange(dateRange)
        console.log(`[LightweightChart] Fetching data: ${indexCode}, ${apiRange}`)

        const response = await fetch(
          `/api/stock/history?index=${indexCode}&range=${apiRange}`
        )

        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success || !result.data?.length) {
          throw new Error('No data available')
        }

        console.log(`[LightweightChart] ✅ Received ${result.data.length} candles`)

        // Lightweight Charts 형식으로 변환
        const chartData = result.data.map((item: any) => ({
          time: item.time,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        }))

        // 데이터 설정
        candlestickSeries.setData(chartData)

        // 차트 자동 스케일
        chart.timeScale().fitContent()

        setLoading(false)
      } catch (err) {
        console.error('[LightweightChart] Error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load chart')
        setLoading(false)
      }
    }

    initChart()

    // 반응형 처리
    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        try {
          chartRef.current.remove()
          chartRef.current = null
        } catch (error) {
          console.error('[LightweightChart] Cleanup error:', error)
        }
      }
    }
  }, [indexCode, dateRange, resolvedTheme, mounted, height])

  // 마운트 전에는 로딩 표시
  if (!mounted) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg"
        style={{ height }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // 에러 표시
  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg"
        style={{ height }}
      >
        <div className="text-center">
          <p className="text-sm text-red-500 dark:text-red-400 mb-2">차트 로딩 실패</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50 rounded-lg z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
      <div ref={containerRef} className="rounded-lg overflow-hidden" />
    </div>
  )
}
