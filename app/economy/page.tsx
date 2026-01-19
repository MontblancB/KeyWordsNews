'use client'

import { useState } from 'react'
import { useEconomy } from '@/hooks/useEconomy'
import BottomNav from '@/components/BottomNav'
import IndicatorCard from '@/components/economy/IndicatorCard'
import TradingViewModal from '@/components/economy/TradingViewModal'
import {
  ArrowPathIcon,
  ChartBarIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline'
import { useColorTheme } from '@/hooks/useColorTheme'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator'
import type { Indicator } from '@/types/economy'

export default function EconomyPage() {
  const { headerClasses } = useColorTheme()
  const { data, isLoading, error, forceRefetch, isRefetching } = useEconomy()

  // 모달 상태
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 지표 클릭 핸들러
  const handleIndicatorClick = (indicator: Indicator) => {
    setSelectedIndicator(indicator)
    setIsModalOpen(true)
  }

  // 모달 닫기
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedIndicator(null)
  }

  // Pull-to-Refresh
  const pullToRefresh = usePullToRefresh({
    onRefresh: async () => {
      await new Promise<void>((resolve) => {
        forceRefetch()
        // forceRefetch는 mutation이므로 완료를 기다림
        setTimeout(resolve, 1000)
      })
    },
  })

  return (
    <>
      {/* Pull-to-Refresh 인디케이터 */}
      <PullToRefreshIndicator {...pullToRefresh} />

      <header className={`${headerClasses} text-white p-4 sticky top-0 z-50`}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">경제 지표</h1>
          <button
            onClick={() => forceRefetch()}
            disabled={isRefetching}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            aria-label="새로고침"
            title="새로고침"
          >
            <ArrowPathIcon
              className={`w-5 h-5 ${isRefetching ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </header>

      <main className="pb-16 p-3 bg-white dark:bg-gray-900">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 dark:border-green-400"></div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-center">
            데이터를 불러오는데 실패했습니다.
          </div>
        )}

        {data && (
          <div className="space-y-3">
            {/* 국내 지수 */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <ChartBarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  국내 지수
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <IndicatorCard indicator={data.domestic.kospi} onClick={handleIndicatorClick} />
                <IndicatorCard indicator={data.domestic.kosdaq} onClick={handleIndicatorClick} />
              </div>
            </section>

            {/* 해외 지수 */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <GlobeAltIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  해외 지수
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <IndicatorCard indicator={data.international.sp500} onClick={handleIndicatorClick} />
                <IndicatorCard indicator={data.international.nasdaq} onClick={handleIndicatorClick} />
                <IndicatorCard indicator={data.international.dow} onClick={handleIndicatorClick} />
                <IndicatorCard indicator={data.international.nikkei} onClick={handleIndicatorClick} />
              </div>
            </section>

            {/* 환율 */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <CurrencyDollarIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  환율
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <IndicatorCard indicator={data.exchange.usdKrw} onClick={handleIndicatorClick} />
                <IndicatorCard indicator={data.exchange.jpyKrw} onClick={handleIndicatorClick} />
                <IndicatorCard indicator={data.exchange.eurKrw} onClick={handleIndicatorClick} />
                <IndicatorCard indicator={data.exchange.cnyKrw} onClick={handleIndicatorClick} />
              </div>
            </section>

            {/* 금시세 */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  금시세
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <IndicatorCard indicator={data.gold.international} onClick={handleIndicatorClick} />
              </div>
            </section>

            {/* 암호화폐 */}
            <section>
              <div className="flex items-center gap-2 mb-2">
                <CircleStackIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  암호화폐
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <IndicatorCard indicator={data.globalCrypto.totalMarketCap} onClick={handleIndicatorClick} />
                <IndicatorCard indicator={data.fearGreed} onClick={handleIndicatorClick} />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <IndicatorCard indicator={data.crypto.bitcoin} onClick={handleIndicatorClick} />
                <IndicatorCard indicator={data.crypto.ethereum} onClick={handleIndicatorClick} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <IndicatorCard indicator={data.globalCrypto.btcDominance} onClick={handleIndicatorClick} />
                <IndicatorCard indicator={data.globalCrypto.ethDominance} onClick={handleIndicatorClick} />
              </div>
            </section>
          </div>
        )}
      </main>

      {/* TradingView 차트 모달 */}
      <TradingViewModal
        indicator={selectedIndicator}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <BottomNav />
    </>
  )
}
