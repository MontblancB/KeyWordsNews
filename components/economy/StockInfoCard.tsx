'use client'

import { useState } from 'react'
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  TableCellsIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PresentationChartLineIcon,
  CurrencyDollarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import LightweightChart from './LightweightChart'
import type { StockInfo } from '@/types/stock'
import { FEATURE_FLAGS } from '@/lib/feature-flags'

type DateRangeType = '1D' | '1W' | '1M' | '3M' | '12M' | '60M'
type IntervalType = '1m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1w'

interface StockInfoCardProps {
  stockInfo: StockInfo
}

const DATE_RANGES: { value: DateRangeType; label: string }[] = [
  { value: '1D', label: '1일' },
  { value: '1W', label: '1주' },
  { value: '1M', label: '1개월' },
  { value: '3M', label: '3개월' },
  { value: '12M', label: '1년' },
  { value: '60M', label: '5년' },
]

export default function StockInfoCard({ stockInfo }: StockInfoCardProps) {
  const { price, company, indicators, financials, market, code, symbol } = stockInfo
  const [dateRange, setDateRange] = useState<DateRangeType>('3M')
  const [interval, setInterval] = useState<IntervalType>('1d')
  const [showAllCompanyInfo, setShowAllCompanyInfo] = useState(false)
  const [showAllFinancials, setShowAllFinancials] = useState<boolean>(FEATURE_FLAGS.SHOW_ALL_FINANCIALS)

  // 국내/미국 주식 구분
  const isKoreanStock = market === 'KOSPI' || market === 'KOSDAQ' || market === 'KONEX'

  // TradingView 심볼
  // 한국 주식: KRX:종목코드
  // 미국 주식: 심볼 그대로 (AAPL, TSLA 등)
  const tradingViewSymbol = isKoreanStock ? `KRX:${code}` : (symbol || code)

  // 통화 단위
  const currencySymbol = isKoreanStock ? '원' : '$'

  // 시장 배지 색상
  const getMarketBadgeClass = (market: string) => {
    switch (market) {
      case 'KOSPI':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
      case 'KOSDAQ':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
      case 'NASDAQ':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      case 'NYSE':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      case 'AMEX':
        return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
      case 'US':
        return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400'
    }
  }

  // 변동 색상
  const getPriceChangeClass = () => {
    if (price.changeType === 'up') {
      return 'text-red-600 dark:text-red-400'
    }
    if (price.changeType === 'down') {
      return 'text-blue-600 dark:text-blue-400'
    }
    return 'text-gray-500 dark:text-gray-400'
  }

  // 변동 아이콘
  const PriceChangeIcon =
    price.changeType === 'up'
      ? ArrowTrendingUpIcon
      : price.changeType === 'down'
        ? ArrowTrendingDownIcon
        : null

  return (
    <div className="space-y-3">
      {/* 종목명 및 현재가 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {stockInfo.name}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {stockInfo.code}
              </p>
            </div>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded ${getMarketBadgeClass(market)}`}
            >
              {market}
            </span>
          </div>
        </div>

        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {currencySymbol === '$' ? `$${price.current}` : `${price.current}${currencySymbol}`}
          </span>
          <div className={`flex items-center gap-1 ${getPriceChangeClass()}`}>
            {PriceChangeIcon && <PriceChangeIcon className="w-4 h-4" />}
            <span className="text-sm font-medium">
              {price.change} ({price.changePercent}%)
            </span>
          </div>
        </div>

        {/* 시세 상세 */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="text-center">
            <div className="text-[10px] text-gray-500 dark:text-gray-400">시가</div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {price.open}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 dark:text-gray-400">고가</div>
            <div className="text-xs font-medium text-red-600 dark:text-red-400">
              {price.high}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 dark:text-gray-400">저가</div>
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {price.low}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-gray-500 dark:text-gray-400">거래량</div>
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {price.volume}
            </div>
          </div>
        </div>
      </div>

      {/* TradingView 차트 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <PresentationChartLineIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">차트</h3>
          </div>
          {/* 기간 선택 */}
          <div className="flex gap-1">
            {DATE_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                  dateRange === range.value
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg overflow-hidden">
          <LightweightChart
            stockCode={code}
            market={market as 'KOSPI' | 'KOSDAQ' | 'US'}
            dateRange={dateRange}
            interval={interval}
            height={300}
          />
        </div>
      </div>

      {/* 기업 정보 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BuildingOfficeIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">기업 정보</h3>
          </div>
          <button
            onClick={() => setShowAllCompanyInfo(!showAllCompanyInfo)}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            {showAllCompanyInfo ? '접기' : '더보기'}
            {showAllCompanyInfo ? (
              <ChevronUpIcon className="w-3 h-3" />
            ) : (
              <ChevronDownIcon className="w-3 h-3" />
            )}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          {/* 기본 정보 */}
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">업종</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-[120px]">
              {company.industry}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">시가총액</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {company.marketCap}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">대표자</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium truncate max-w-[120px]">
              {company.ceo}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">외국인</span>
            <span className="text-gray-900 dark:text-gray-100 font-medium">
              {company.foreignOwnership}
            </span>
          </div>

          {/* 확장 정보 */}
          {showAllCompanyInfo && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">설립일</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {company.establishedDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">상장일</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {company.listedDate}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">결산월</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {company.fiscalMonth}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">직원수</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {company.employees}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">액면가</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {company.faceValue}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">자본금</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {company.capital}
                </span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-gray-500 dark:text-gray-400">상장주식수</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {company.listedShares}
                </span>
              </div>
              <div className="flex justify-between col-span-2">
                <span className="text-gray-500 dark:text-gray-400">본사</span>
                <span className="text-gray-900 dark:text-gray-100 font-medium text-right">
                  {company.headquarters}
                </span>
              </div>
              {company.website && company.website !== '-' && (
                <div className="flex justify-between col-span-2">
                  <span className="text-gray-500 dark:text-gray-400">홈페이지</span>
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-right truncate max-w-[200px]"
                  >
                    {company.website}
                  </a>
                </div>
              )}
              {company.businessDescription && company.businessDescription !== '-' && (
                <div className="col-span-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400 text-xs">주요 사업</span>
                  <p className="text-gray-900 dark:text-gray-100 text-xs mt-1 leading-relaxed">
                    {company.businessDescription}
                  </p>
                </div>
              )}
              {company.mainProducts && company.mainProducts !== '-' && (
                <div className="col-span-2">
                  <span className="text-gray-500 dark:text-gray-400 text-xs">대표 제품</span>
                  <p className="text-gray-900 dark:text-gray-100 text-xs mt-1">
                    {company.mainProducts}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 투자 지표 */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <ChartBarIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
          <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">투자 지표</h3>
        </div>

        {/* 52주 최고/최저 */}
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
          <div className="flex justify-between items-center text-xs">
            <div className="text-center flex-1">
              <div className="text-[10px] text-blue-600 dark:text-blue-400">52주 최저</div>
              <div className="font-bold text-blue-700 dark:text-blue-300">{indicators.week52Low}</div>
            </div>
            <div className="flex-1 px-2">
              <div className="h-1.5 bg-gradient-to-r from-blue-400 via-gray-300 to-red-400 rounded-full relative">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-800 dark:bg-white rounded-full border border-white dark:border-gray-800"></div>
              </div>
            </div>
            <div className="text-center flex-1">
              <div className="text-[10px] text-red-600 dark:text-red-400">52주 최고</div>
              <div className="font-bold text-red-700 dark:text-red-300">{indicators.week52High}</div>
            </div>
          </div>
        </div>

        {/* 밸류에이션 지표 */}
        <div className="grid grid-cols-4 gap-2 mb-2">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">PER</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {indicators.per}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">PBR</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {indicators.pbr}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">PSR</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {indicators.psr}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">ROE</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {indicators.roe}
            </div>
          </div>
        </div>

        {/* 주당 지표 */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">EPS</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {indicators.eps}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">BPS</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {indicators.bps}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">DPS</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {indicators.dps}
            </div>
          </div>
          <div className="text-center p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">배당률</div>
            <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
              {indicators.dividendYield}
            </div>
          </div>
        </div>

        {/* 추가 투자 지표 */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">ROA</div>
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {indicators.roa}
            </div>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">유동비율</div>
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {indicators.currentRatio}
            </div>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">당좌비율</div>
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {indicators.quickRatio}
            </div>
          </div>
          <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1">베타</div>
            <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {indicators.beta}
            </div>
          </div>
        </div>
      </div>

      {/* 재무제표 */}
      {financials.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TableCellsIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div className="flex flex-col">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">재무제표</h3>
                {financials[0]?.year && financials[0]?.reportType && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {financials[0].year}년 {financials[0].reportType} 기준
                  </span>
                )}
              </div>
            </div>
            {!FEATURE_FLAGS.SHOW_ALL_FINANCIALS && (
              <button
                onClick={() => setShowAllFinancials(!showAllFinancials)}
                className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showAllFinancials ? '접기' : '더보기'}
                {showAllFinancials ? (
                  <ChevronUpIcon className="w-3 h-3" />
                ) : (
                  <ChevronDownIcon className="w-3 h-3" />
                )}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 dark:text-gray-400">
                  <th className="text-left py-2 pr-2">항목</th>
                  {financials.slice(0, 4).map((f, i) => (
                    <th key={i} className="text-right py-2 px-1 whitespace-nowrap">
                      {f.period}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="text-gray-900 dark:text-gray-100">
                {/* 손익계산서 */}
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">매출액</td>
                  {financials.slice(0, 4).map((f, i) => (
                    <td key={i} className="text-right py-2 px-1 font-medium">
                      {f.revenue}
                    </td>
                  ))}
                </tr>
                {showAllFinancials && (
                  <>
                    <tr className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">매출원가</td>
                      {financials.slice(0, 4).map((f, i) => (
                        <td key={i} className="text-right py-2 px-1 font-medium text-gray-600 dark:text-gray-400">
                          {f.costOfRevenue}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-100 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/10">
                      <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">매출총이익</td>
                      {financials.slice(0, 4).map((f, i) => (
                        <td key={i} className="text-right py-2 px-1 font-medium text-green-600 dark:text-green-400">
                          {f.grossProfit}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-100 dark:border-gray-700 bg-green-50/50 dark:bg-green-900/10">
                      <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">매출총이익률</td>
                      {financials.slice(0, 4).map((f, i) => (
                        <td key={i} className="text-right py-2 px-1 font-medium text-green-600 dark:text-green-400">
                          {f.grossMargin}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">영업이익</td>
                  {financials.slice(0, 4).map((f, i) => (
                    <td key={i} className="text-right py-2 px-1 font-medium">
                      {f.operatingProfit}
                    </td>
                  ))}
                </tr>
                {showAllFinancials && (
                  <tr className="border-t border-gray-100 dark:border-gray-700">
                    <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">EBITDA</td>
                    {financials.slice(0, 4).map((f, i) => (
                      <td key={i} className="text-right py-2 px-1 font-medium text-purple-600 dark:text-purple-400">
                        {f.ebitda}
                      </td>
                    ))}
                  </tr>
                )}
                <tr className="border-t border-gray-100 dark:border-gray-700">
                  <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">당기순이익</td>
                  {financials.slice(0, 4).map((f, i) => (
                    <td key={i} className="text-right py-2 px-1 font-medium">
                      {f.netIncome}
                    </td>
                  ))}
                </tr>

                {/* 확장 재무 정보 */}
                {showAllFinancials && (
                  <>
                    <tr className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
                      <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">영업이익률</td>
                      {financials.slice(0, 4).map((f, i) => (
                        <td key={i} className="text-right py-2 px-1 font-medium text-green-600 dark:text-green-400">
                          {f.operatingMargin}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
                      <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">순이익률</td>
                      {financials.slice(0, 4).map((f, i) => (
                        <td key={i} className="text-right py-2 px-1 font-medium text-green-600 dark:text-green-400">
                          {f.netMargin}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t-2 border-gray-200 dark:border-gray-600">
                      <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">자산총계</td>
                      {financials.slice(0, 4).map((f, i) => (
                        <td key={i} className="text-right py-2 px-1 font-medium">
                          {f.totalAssets}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">부채총계</td>
                      {financials.slice(0, 4).map((f, i) => (
                        <td key={i} className="text-right py-2 px-1 font-medium">
                          {f.totalLiabilities}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">자본총계</td>
                      {financials.slice(0, 4).map((f, i) => (
                        <td key={i} className="text-right py-2 px-1 font-medium">
                          {f.totalEquity}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/20">
                      <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">부채비율</td>
                      {financials.slice(0, 4).map((f, i) => (
                        <td key={i} className="text-right py-2 px-1 font-medium text-orange-600 dark:text-orange-400">
                          {f.debtRatio}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t-2 border-gray-200 dark:border-gray-600 bg-blue-50/50 dark:bg-blue-900/10">
                      <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">영업현금흐름</td>
                      {financials.slice(0, 4).map((f, i) => (
                        <td key={i} className="text-right py-2 px-1 font-medium text-blue-600 dark:text-blue-400">
                          {f.operatingCashFlow}
                        </td>
                      ))}
                    </tr>
                    <tr className="border-t border-gray-100 dark:border-gray-700 bg-blue-50/50 dark:bg-blue-900/10">
                      <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">잉여현금흐름</td>
                      {financials.slice(0, 4).map((f, i) => (
                        <td key={i} className="text-right py-2 px-1 font-medium text-blue-600 dark:text-blue-400">
                          {f.freeCashFlow}
                        </td>
                      ))}
                    </tr>
                  </>
                )}
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
