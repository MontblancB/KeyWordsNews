'use client'

import { useState } from 'react'
import { useEconomy } from '@/hooks/useEconomy'
import BottomNav from '@/components/BottomNav'
import EconomyTabs, { type EconomyTabType } from '@/components/economy/EconomyTabs'
import IndicatorsSection from '@/components/economy/IndicatorsSection'
import StockSection from '@/components/economy/StockSection'
import TradingViewModal from '@/components/economy/TradingViewModal'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import { useColorTheme } from '@/hooks/useColorTheme'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import PullToRefreshIndicator from '@/components/PullToRefreshIndicator'
import type { Indicator } from '@/types/economy'

export default function EconomyPage() {
  const { headerClasses } = useColorTheme()
  const { data, isLoading, error, forceRefetch, isRefetching } = useEconomy()

  // 탭 상태
  const [activeTab, setActiveTab] = useState<EconomyTabType>('indicators')

  // 모달 상태
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 주목 종목 → 주식탭 연동
  const [pendingStock, setPendingStock] = useState<{ code: string; name: string } | null>(null)

  // 지표 클릭 핸들러
  const handleIndicatorClick = (indicator: Indicator) => {
    setSelectedIndicator(indicator)
    setIsModalOpen(true)
  }

  // 주목 종목 클릭 → 주식 탭으로 전환
  const handleTrendingStockClick = (code: string, name: string) => {
    setPendingStock({ code, name })
    setActiveTab('stock')
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
          <h1 className="text-xl font-bold">경제</h1>
          {activeTab === 'indicators' && (
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
          )}
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <EconomyTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="pb-16 p-3 bg-white dark:bg-gray-900 min-h-screen">
        {/* 지표 탭 */}
        {activeTab === 'indicators' && (
          <>
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
              <IndicatorsSection data={data} onIndicatorClick={handleIndicatorClick} onStockClick={handleTrendingStockClick} />
            )}
          </>
        )}

        {/* 주식 탭 */}
        {activeTab === 'stock' && <StockSection initialStock={pendingStock} />}
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
