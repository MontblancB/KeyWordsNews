'use client'

import { useEconomy } from '@/hooks/useEconomy'
import BottomNav from '@/components/BottomNav'
import IndicatorCard from '@/components/economy/IndicatorCard'
import { ArrowPathIcon } from '@heroicons/react/24/outline'

export default function EconomyPage() {
  const { data, isLoading, error, refetch, isRefetching } = useEconomy()

  return (
    <>
      <header className="bg-green-600 text-white p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">경제 지표</h1>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            aria-label="새로고침"
          >
            <ArrowPathIcon
              className={`w-5 h-5 ${isRefetching ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </header>

      <main className="pb-20 p-4">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-center">
            데이터를 불러오는데 실패했습니다.
          </div>
        )}

        {data && (
          <div className="space-y-6">
            {/* 국내 지수 */}
            <section>
              <h2 className="text-lg font-bold mb-3 text-gray-800">
                📈 국내 지수
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <IndicatorCard indicator={data.domestic.kospi} />
                <IndicatorCard indicator={data.domestic.kosdaq} />
              </div>
            </section>

            {/* 해외 지수 */}
            <section>
              <h2 className="text-lg font-bold mb-3 text-gray-800">
                🌍 해외 지수
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <IndicatorCard indicator={data.international.sp500} />
                <IndicatorCard indicator={data.international.nasdaq} />
                <IndicatorCard indicator={data.international.dow} />
                <IndicatorCard indicator={data.international.nikkei} />
              </div>
            </section>

            {/* 환율 */}
            <section>
              <h2 className="text-lg font-bold mb-3 text-gray-800">
                💱 환율
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <IndicatorCard indicator={data.exchange.usdKrw} />
                <IndicatorCard indicator={data.exchange.jpyKrw} />
                <IndicatorCard indicator={data.exchange.eurKrw} />
                <IndicatorCard indicator={data.exchange.cnyKrw} />
              </div>
            </section>

            {/* 금시세 */}
            <section>
              <h2 className="text-lg font-bold mb-3 text-gray-800">
                💰 금시세
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <IndicatorCard indicator={data.gold.international} />
              </div>
            </section>

            {/* 마지막 업데이트 */}
            <div className="text-center text-xs text-gray-500 pt-4">
              마지막 업데이트: {data.lastUpdated}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </>
  )
}
