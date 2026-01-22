'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'

type Interval = '1m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1w'

interface LightweightChartProps {
  indexCode: 'KOSPI' | 'KOSDAQ'
  dateRange: '1D' | '1W' | '1M' | '3M' | '12M' | '60M'
  interval: Interval
  height?: number
}

// interval에 따라 적절한 range 결정 (Yahoo Finance API 제한 엄격히 준수)
function getApiRangeForInterval(interval: Interval): string {
  switch (interval) {
    case '1m':
      return '5d' // 1분봉: 최대 7일
    case '5m':
      return '1mo' // 5분봉: 최대 60일 (1개월은 안전)
    case '15m':
      return '1mo' // 15분봉: 최대 60일 (1개월은 안전)
    case '30m':
      return '1mo' // 30분봉: 최대 60일 (1개월은 안전)
    case '1h':
      return '3mo' // 1시간봉: 최대 730일 (3개월은 안전)
    case '1d':
      return '5y' // 일봉: 최대 5년
    case '1w':
      return '5y' // 주봉: 최대 5년
    default:
      return '1y'
  }
}

// dateRange에 맞춰 초기 표시할 데이터 범위 계산 (일 단위)
function getVisibleRangeDays(dateRange: string): number {
  switch (dateRange) {
    case '1D':
      return 1
    case '1W':
      return 7
    case '1M':
      return 30
    case '3M':
      return 90
    case '12M':
      return 365
    case '60M':
      return 365 * 5
    default:
      return 90
  }
}

export default function LightweightChart({
  indexCode,
  dateRange,
  interval,
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

        // 차트 생성 - TradingView Advanced Chart 스타일 적용
        chart = createChart(containerRef.current, {
          width: containerRef.current.clientWidth,
          height,
          layout: {
            background: { color: isDark ? '#131722' : '#ffffff' },
            textColor: isDark ? '#d1d5db' : '#191919',
            fontSize: 12,
          },
          grid: {
            vertLines: {
              color: isDark ? '#1e222d' : '#f0f3fa',
              style: 0, // Solid
            },
            horzLines: {
              color: isDark ? '#1e222d' : '#f0f3fa',
              style: 0, // Solid
            },
          },
          crosshair: {
            mode: 1, // Normal
            vertLine: {
              color: isDark ? '#758696' : '#9598a1',
              width: 1,
              style: 3, // Dashed
              labelBackgroundColor: isDark ? '#363c4e' : '#4c525e',
            },
            horzLine: {
              color: isDark ? '#758696' : '#9598a1',
              width: 1,
              style: 3, // Dashed
              labelBackgroundColor: isDark ? '#363c4e' : '#4c525e',
            },
          },
          timeScale: {
            borderColor: isDark ? '#2b2b43' : '#d1d4dc',
            timeVisible: true,
            secondsVisible: false,
          },
          rightPriceScale: {
            borderColor: isDark ? '#2b2b43' : '#d1d4dc',
            scaleMargins: {
              top: 0.1,
              bottom: 0.1,
            },
          },
          handleScroll: {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: true,
          },
          handleScale: {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
          },
        })

        chartRef.current = chart

        // 캔들스틱 시리즈 추가 - v5 API (TradingView 스타일)
        candlestickSeries = chart.addSeries(CandlestickSeries, {
          upColor: '#ef5350', // 빨강 (상승) - TradingView 스타일
          downColor: '#26a69a', // 청록 (하락) - TradingView 스타일
          borderUpColor: '#ef5350',
          borderDownColor: '#26a69a',
          wickUpColor: '#ef5350',
          wickDownColor: '#26a69a',
          borderVisible: true,
          wickVisible: true,
        })

        seriesRef.current = candlestickSeries

        console.log('[LightweightChart] ✅ Chart and series created successfully')

        // 데이터 가져오기 - interval에 따라 적절한 range 로드
        setLoading(true)
        setError(null)

        const apiRange = getApiRangeForInterval(interval)
        console.log(`[LightweightChart] Fetching data: ${indexCode}, interval=${interval}, range=${apiRange} (display: ${dateRange})`)

        const response = await fetch(
          `/api/stock/history?index=${indexCode}&range=${apiRange}&interval=${interval}`
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

        // 초기 표시 범위 설정 (dateRange에 맞춰)
        if (chartData.length > 0) {
          const visibleDays = getVisibleRangeDays(dateRange)
          const lastTime = chartData[chartData.length - 1].time

          // 최신 데이터부터 지정된 기간만 표시
          // Lightweight Charts는 초 단위 timestamp 사용
          const from = lastTime - (visibleDays * 24 * 60 * 60)
          const to = lastTime + (24 * 60 * 60) // 약간 여유 추가

          console.log(`[LightweightChart] Setting visible range:`, {
            dateRange,
            visibleDays,
            from: new Date(from * 1000).toISOString(),
            to: new Date(to * 1000).toISOString(),
            totalCandles: chartData.length,
          })

          chart.timeScale().setVisibleRange({
            from,
            to,
          })
        }

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
  }, [indexCode, dateRange, interval, resolvedTheme, mounted, height])

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
