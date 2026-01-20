'use client'

import { useState } from 'react'
import {
  BuildingOffice2Icon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline'
import type { StockInfo } from '@/types/stock'
import { TradingViewChart } from './TradingViewChart'

interface StockInfoCardProps {
  stockInfo: StockInfo
}

type DateRange = '1D' | '1W' | '1M' | '3M' | '12M' | '60M'

const DATE_RANGE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: '1일', value: '1D' },
  { label: '1주', value: '1W' },
  { label: '1개월', value: '1M' },
  { label: '3개월', value: '3M' },
  { label: '1년', value: '12M' },
  { label: '5년', value: '60M' },
]

export default function StockInfoCard({ stockInfo }: StockInfoCardProps) {
  const { basic, financials, metrics } = stockInfo
  const [dateRange, setDateRange] = useState<DateRange>('3M')

  const isUp = basic.changeType === 'up'
  const isDown = basic.changeType === 'down'

  // TradingView 심볼 생성 (KRX:종목코드)
  const tradingViewSymbol = `KRX:${basic.code}`

  return (
    <div className="space-y-3">
      {/* 기본 정보 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {basic.name}
                </h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    basic.market === 'KOSPI'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                  }`}
                >
                  {basic.market}
                </span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {basic.code} · {basic.sector}
              </div>
            </div>
          </div>

          {/* 현재가 */}
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {basic.currentPrice}원
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isUp && (
                <>
                  <ArrowUpIcon className="w-4 h-4 text-red-500" />
                  <span className="text-red-500 font-medium">
                    {basic.change} ({basic.changePercent})
                  </span>
                </>
              )}
              {isDown && (
                <>
                  <ArrowDownIcon className="w-4 h-4 text-blue-500" />
                  <span className="text-blue-500 font-medium">
                    {basic.change} ({basic.changePercent})
                  </span>
                </>
              )}
              {!isUp && !isDown && (
                <span className="text-gray-500">보합</span>
              )}
            </div>
          </div>
        </div>

        {/* 주요 정보 그리드 */}
        <div className="p-4 grid grid-cols-2 gap-3">
          <InfoItem
            icon={CurrencyDollarIcon}
            label="시가총액"
            value={basic.marketCap}
          />
          <InfoItem
            icon={ChartBarIcon}
            label="거래량"
            value={basic.volume}
          />
          <InfoItem
            label="52주 최고"
            value={basic.high52week}
            valueColor="text-red-500"
          />
          <InfoItem
            label="52주 최저"
            value={basic.low52week}
            valueColor="text-blue-500"
          />
        </div>
      </div>

      {/* 투자 지표 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <DocumentChartBarIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            투자 지표
          </h3>
        </div>
        <div className="p-4 grid grid-cols-3 gap-3">
          <MetricItem label="PER" value={metrics.per} />
          <MetricItem label="PBR" value={metrics.pbr} />
          <MetricItem label="ROE" value={metrics.roe} />
          <MetricItem label="EPS" value={metrics.eps} />
          <MetricItem label="BPS" value={metrics.bps} />
          <MetricItem label="배당률" value={metrics.dividendYield} />
        </div>
      </div>

      {/* 재무제표 카드 */}
      {financials.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <BuildingOffice2Icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              재무제표 (연간)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400">
                  <th className="px-4 py-2 text-left font-medium">구분</th>
                  {financials.map((f) => (
                    <th key={f.year} className="px-4 py-2 text-right font-medium">
                      {f.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">매출액</td>
                  {financials.map((f) => (
                    <td key={f.year} className="px-4 py-2 text-right text-gray-900 dark:text-white">
                      {f.revenue}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">영업이익</td>
                  {financials.map((f) => (
                    <td key={f.year} className="px-4 py-2 text-right text-gray-900 dark:text-white">
                      {f.operatingProfit}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">당기순이익</td>
                  {financials.map((f) => (
                    <td key={f.year} className="px-4 py-2 text-right text-gray-900 dark:text-white">
                      {f.netIncome}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400">영업이익률</td>
                  {financials.map((f) => (
                    <td key={f.year} className="px-4 py-2 text-right text-gray-900 dark:text-white">
                      {f.operatingMargin}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 차트 카드 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <ChartBarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            주가 차트
          </h3>
        </div>

        {/* 기간 선택 */}
        <div className="flex gap-1 p-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          {DATE_RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setDateRange(option.value)}
              className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-colors ${
                dateRange === option.value
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        {/* 차트 */}
        <div className="p-2">
          <TradingViewChart
            key={`${tradingViewSymbol}-${dateRange}`}
            symbol={tradingViewSymbol}
            height={350}
            dateRange={dateRange}
          />
        </div>

        {/* TradingView 링크 */}
        <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-center">
          <a
            href={`https://www.tradingview.com/symbols/${tradingViewSymbol.replace(':', '-')}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-green-500 transition-colors"
          >
            TradingView에서 더 보기
          </a>
        </div>
      </div>

      {/* 마지막 업데이트 */}
      <div className="text-center text-xs text-gray-400 dark:text-gray-500">
        마지막 업데이트: {stockInfo.lastUpdated}
      </div>
    </div>
  )
}

// 정보 아이템 컴포넌트
function InfoItem({
  icon: Icon,
  label,
  value,
  valueColor,
}: {
  icon?: React.ComponentType<{ className?: string }>
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-0.5">
        {Icon && <Icon className="w-3 h-3" />}
        <span>{label}</span>
      </div>
      <div className={`text-sm font-medium ${valueColor || 'text-gray-900 dark:text-white'}`}>
        {value}
      </div>
    </div>
  )
}

// 지표 아이템 컴포넌트
function MetricItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-sm font-medium text-gray-900 dark:text-white mt-0.5">
        {value || '-'}
      </div>
    </div>
  )
}
