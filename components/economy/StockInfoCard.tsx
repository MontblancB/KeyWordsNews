'use client'

import {
  BuildingOfficeIcon,
  ChartBarIcon,
  TableCellsIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline'
import type { StockInfo } from '@/types/stock'

interface StockInfoCardProps {
  stockInfo: StockInfo
}

export default function StockInfoCard({ stockInfo }: StockInfoCardProps) {
  const { basic, metrics, financials } = stockInfo

  // 시장 배지 색상
  const getMarketBadgeClass = (market: string) => {
    switch (market) {
      case 'KOSPI':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'KOSDAQ':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  // 변동 색상
  const getPriceChangeClass = () => {
    if (basic.changeType === 'up') {
      return 'text-red-600 dark:text-red-400'
    }
    if (basic.changeType === 'down') {
      return 'text-blue-600 dark:text-blue-400'
    }
    return 'text-gray-500 dark:text-gray-400'
  }

  // 변동 아이콘
  const PriceChangeIcon =
    basic.changeType === 'up'
      ? ArrowTrendingUpIcon
      : basic.changeType === 'down'
        ? ArrowTrendingDownIcon
        : null

  return (
    <div className="space-y-3">
      {/* 종목명 및 현재가 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {basic.name || basic.code}
            </h2>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${getMarketBadgeClass(basic.market)}`}
            >
              {basic.market}
            </span>
          </div>
          <span className="text-xs text-gray-500 dark:text-gray-400">{basic.code}</span>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {basic.currentPrice}원
          </span>
          <div className={`flex items-center gap-1 ${getPriceChangeClass()}`}>
            {PriceChangeIcon && <PriceChangeIcon className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {basic.change} ({basic.changePercent})
            </span>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="text-[10px] text-gray-500 dark:text-gray-400">업종</div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
              {basic.sector}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 dark:text-gray-400">시가총액</div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {basic.marketCap}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 dark:text-gray-400">거래량</div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {basic.volume}
            </div>
          </div>
        </div>
      </div>

      {/* 투자 지표 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <ChartBarIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">투자 지표</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">PER</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {metrics.per}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">PBR</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {metrics.pbr}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">ROE</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {metrics.roe}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">EPS</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {metrics.eps}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">BPS</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {metrics.bps}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">배당률</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {metrics.dividendYield}
            </div>
          </div>
        </div>
      </div>

      {/* 재무제표 */}
      {financials.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <TableCellsIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">재무제표 (연간)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400">
                  <th className="text-left py-2 pr-2">항목</th>
                  {financials.slice(0, 4).map((f, i) => (
                    <th key={i} className="text-right py-2 px-1 whitespace-nowrap">
                      {f.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-gray-900 dark:text-gray-100">
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">매출액</td>
                  {financials.slice(0, 4).map((f, i) => (
                    <td key={i} className="text-right py-2 px-1 font-medium">
                      {f.revenue}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">영업이익</td>
                  {financials.slice(0, 4).map((f, i) => (
                    <td key={i} className="text-right py-2 px-1 font-medium">
                      {f.operatingProfit}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">당기순이익</td>
                  {financials.slice(0, 4).map((f, i) => (
                    <td key={i} className="text-right py-2 px-1 font-medium">
                      {f.netIncome}
                    </td>
                  ))}
                </tr>
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">영업이익률</td>
                  {financials.slice(0, 4).map((f, i) => (
                    <td key={i} className="text-right py-2 px-1 font-medium">
                      {f.operatingMargin}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 마지막 업데이트 */}
      <div className="text-center text-[10px] text-gray-400 dark:text-gray-500">
        마지막 업데이트: {stockInfo.lastUpdated}
      </div>
    </div>
  )
}
