'use client'

import { useEffect, useRef, memo } from 'react'
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

  useEffect(() => {
    if (!containerRef.current) return

    // 기존 위젯 제거
    containerRef.current.innerHTML = ''

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
      colorTheme: resolvedTheme === 'dark' ? 'dark' : 'light',
      isTransparent: true,
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
  }, [symbol, height, dateRange, resolvedTheme])

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget"></div>
    </div>
  )
}

export const TradingViewChart = memo(TradingViewChartComponent)
