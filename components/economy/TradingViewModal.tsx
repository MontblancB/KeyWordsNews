'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid'
import dynamic from 'next/dynamic'
import { TradingViewChart } from './TradingViewChart'
import type { Indicator } from '@/types/economy'
import { getTradingViewSymbol, isChartSupported } from '@/lib/tradingview/symbols'

// Lightweight Charts를 dynamic import로 로드 (SSR 비활성화)
const LightweightChart = dynamic(() => import('./LightweightChart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg" style={{ height: 350 }}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    </div>
  ),
})

interface TradingViewModalProps {
  indicator: Indicator | null
  isOpen: boolean
  onClose: () => void
}

type DateRange = '1D' | '1W' | '1M' | '3M' | '12M' | '60M' | 'ALL'

const DATE_RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '1D', label: '1일' },
  { value: '1W', label: '1주' },
  { value: '1M', label: '1개월' },
  { value: '3M', label: '3개월' },
  { value: '12M', label: '1년' },
  { value: '60M', label: '5년' },
]

export default function TradingViewModal({
  indicator,
  isOpen,
  onClose,
}: TradingViewModalProps) {
  const [dateRange, setDateRange] = useState<DateRange>('3M')
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  // 클라이언트 마운트 확인
  useEffect(() => {
    setMounted(true)
  }, [])

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // 스크롤 방지
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !indicator || !mounted) return null

  const symbolInfo = getTradingViewSymbol(indicator.name)
  const chartSupported = isChartSupported(indicator.name)

  // KOSPI/KOSDAQ은 Lightweight Charts 사용
  const isKoreanIndex = indicator.name === 'KOSPI' || indicator.name === 'KOSDAQ'
  const useLightweightChart = isKoreanIndex

  // 디버깅: 심볼 조회 결과 로그
  console.log('[TradingViewModal] Opening modal:', {
    indicatorName: indicator.name,
    symbolInfo,
    chartSupported,
    hasSymbol: !!symbolInfo,
    symbol: symbolInfo?.symbol,
    isKoreanIndex,
    useLightweightChart,
  })

  const isUp = indicator.changeType === 'up'
  const isDown = indicator.changeType === 'down'

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* 백드롭 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative w-full sm:max-w-lg max-h-[90vh] bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-slide-up">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {indicator.name}
            </h2>
            {symbolInfo?.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {symbolInfo.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* 현재 가격 정보 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {indicator.value}
            </span>
            <div className="flex items-center gap-2">
              {isUp && (
                <div className="flex items-center gap-1 text-red-500 dark:text-red-400">
                  <ArrowUpIcon className="w-4 h-4" />
                  <span className="font-medium">
                    {indicator.change} ({indicator.changePercent}%)
                  </span>
                </div>
              )}
              {isDown && (
                <div className="flex items-center gap-1 text-blue-500 dark:text-blue-400">
                  <ArrowDownIcon className="w-4 h-4" />
                  <span className="font-medium">
                    {indicator.change} ({indicator.changePercent}%)
                  </span>
                </div>
              )}
              {!isUp && !isDown && (
                <span className="text-gray-500 dark:text-gray-400">-</span>
              )}
            </div>
          </div>
        </div>

        {/* 기간 선택 탭 */}
        {chartSupported && symbolInfo && (
          <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {DATE_RANGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setDateRange(option.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  dateRange === option.value
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {/* 차트 영역 */}
        <div className="p-2">
          {useLightweightChart ? (
            // KOSPI/KOSDAQ: Lightweight Charts 사용
            <LightweightChart
              indexCode={indicator.name as 'KOSPI' | 'KOSDAQ'}
              dateRange={dateRange === 'ALL' ? '60M' : dateRange}
              height={350}
            />
          ) : chartSupported && symbolInfo ? (
            // 기타 지표: TradingView 위젯 사용
            <TradingViewChart
              key={`${symbolInfo.symbol}-${resolvedTheme}`}
              symbol={symbolInfo.symbol}
              height={350}
              dateRange={dateRange}
            />
          ) : (
            <div className="flex items-center justify-center h-[200px] bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                이 지표는 차트를 지원하지 않습니다.
              </p>
            </div>
          )}
        </div>

        {/* TradingView 저작권 표시 (KOSPI/KOSDAQ 제외) */}
        {!useLightweightChart && chartSupported && symbolInfo && (
          <div className="p-2 text-center">
            <a
              href={`https://www.tradingview.com/symbols/${symbolInfo.symbol.replace(':', '-')}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400"
            >
              TradingView에서 더 보기
            </a>
          </div>
        )}

        {/* Lightweight Charts 저작권 표시 (KOSPI/KOSDAQ만) */}
        {useLightweightChart && (
          <div className="p-2 text-center">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Powered by{' '}
              <a
                href="https://www.tradingview.com/lightweight-charts/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500 dark:hover:text-blue-400"
              >
                Lightweight Charts
              </a>
            </p>
          </div>
        )}
      </div>

      {/* 슬라이드 업 애니메이션 */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
