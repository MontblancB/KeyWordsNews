'use client'

import { useEffect, useRef, useState, memo } from 'react'
import { useTheme } from 'next-themes'

interface TradingViewChartProps {
  symbol: string
  height?: number
  dateRange?: '1D' | '1W' | '1M' | '3M' | '12M' | '60M' | 'ALL'
}

function TradingViewChartComponent({
  symbol,
  height = 400,
  dateRange = '3M',
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [key, setKey] = useState(0)

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true)
  }, [])

  // 테마 변경 시 차트 다시 렌더링
  useEffect(() => {
    if (mounted) {
      setKey((prev) => prev + 1)
    }
  }, [resolvedTheme, mounted])

  useEffect(() => {
    if (!containerRef.current || !mounted) return

    // 기존 위젯 제거
    containerRef.current.innerHTML = ''

    // 테마 결정 (기본값: light)
    const theme = resolvedTheme === 'dark' ? 'dark' : 'light'

    // TradingView 위젯 스크립트 생성
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js'
    script.type = 'text/javascript'
    script.async = true
    script.innerHTML = JSON.stringify({
      symbol: symbol,
      width: '100%',
      height: height,
      locale: 'kr',
      dateRange: dateRange,
      colorTheme: theme,
      isTransparent: false,
      autosize: false,
      largeChartUrl: '',
      chartOnly: false,
      noTimeScale: false,
    })

    containerRef.current.appendChild(script)

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, height, dateRange, key, mounted])

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

  return (
    <div
      key={key}
      className="tradingview-widget-container"
      ref={containerRef}
    >
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}

export const TradingViewChart = memo(TradingViewChartComponent)
