'use client'

import { useEffect, useRef, memo, useState } from 'react'
import { useTheme } from 'next-themes'

interface TradingViewChartProps {
  symbol: string
  height?: number
  dateRange?: '1D' | '1W' | '1M' | '3M' | '12M' | '60M' | 'ALL'
}

// dateRange를 TradingView interval로 변환
function getIntervalFromDateRange(dateRange: string): string {
  switch (dateRange) {
    case '1D':
      return '15' // 15분봉
    case '1W':
      return '60' // 1시간봉
    case '1M':
      return 'D' // 일봉
    case '3M':
      return 'D' // 일봉
    case '12M':
      return 'W' // 주봉
    case '60M':
      return 'M' // 월봉
    default:
      return 'D'
  }
}

// dateRange를 TradingView range로 변환
function getRangeFromDateRange(dateRange: string): string {
  switch (dateRange) {
    case '1D':
      return '1D'
    case '1W':
      return '5D'
    case '1M':
      return '1M'
    case '3M':
      return '3M'
    case '12M':
      return '12M'
    case '60M':
      return '60M'
    default:
      return '3M'
  }
}

function TradingViewChartComponent({
  symbol,
  height = 400,
  dateRange = '3M',
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 클라이언트 마운트 확인 (테마 하이드레이션 대기)
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // 마운트되지 않았거나 테마가 결정되지 않은 경우 대기
    if (!containerRef.current || !mounted) {
      console.log('[TradingView] Waiting for mount or theme...', { mounted, hasContainer: !!containerRef.current })
      return
    }

    // 기존 위젯 제거
    containerRef.current.innerHTML = ''

    // 테마 결정 (기본값: light)
    const colorTheme = resolvedTheme === 'dark' ? 'dark' : 'light'
    const interval = getIntervalFromDateRange(dateRange)
    const range = getRangeFromDateRange(dateRange)

    console.log('[TradingView] Initializing chart:', {
      symbol,
      theme: colorTheme,
      interval,
      range,
      height,
      dateRange,
    })

    try {
      // TradingView Advanced Chart 위젯 스크립트 생성
      const script = document.createElement('script')
      script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
      script.type = 'text/javascript'
      script.async = true

      const widgetConfig = {
        symbol: symbol,
        width: '100%',
        height: height,
        locale: 'kr',
        interval: interval,
        range: range,
        timezone: 'Asia/Seoul',
        theme: colorTheme,
        style: '1', // 1 = 캔들차트
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        hide_side_toolbar: true,
        allow_symbol_change: false,
        save_image: false,
        calendar: false,
        support_host: 'https://www.tradingview.com',
      }

      script.innerHTML = JSON.stringify(widgetConfig)

      // 스크립트 로드 성공/실패 이벤트 리스너
      script.onload = () => {
        console.log('[TradingView] ✅ Script loaded successfully:', symbol)
      }

      script.onerror = (error) => {
        console.error('[TradingView] ❌ Script load failed:', symbol, error)
      }

      console.log('[TradingView] Widget config:', widgetConfig)
      containerRef.current.appendChild(script)
      console.log('[TradingView] Script appended to DOM')
    } catch (error) {
      console.error('[TradingView] ❌ Error creating widget:', error)
    }

    // Cleanup
    return () => {
      if (containerRef.current) {
        console.log('[TradingView] Cleaning up widget:', symbol)
        containerRef.current.innerHTML = ''
      }
    }
  }, [symbol, height, dateRange, resolvedTheme, mounted])

  // 마운트 전에는 로딩 표시
  if (!mounted) {
    return (
      <div
        className="tradingview-widget-container flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg"
        style={{ height }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div
      key={`${symbol}-${resolvedTheme}`}
      className="tradingview-widget-container"
      ref={containerRef}
    >
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}

export const TradingViewChart = memo(TradingViewChartComponent)
