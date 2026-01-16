'use client'

import { useEconomy } from '@/hooks/useEconomy'
import BottomNav from '@/components/BottomNav'
import IndicatorCard from '@/components/economy/IndicatorCard'
import {
  ArrowPathIcon,
  ChartBarIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline'
import { useColorTheme } from '@/hooks/useColorTheme'

export default function EconomyPage() {
  const { headerClasses } = useColorTheme()
  const { data, isLoading, error, refetch, isRefetching } = useEconomy()

  return (
    <>
      <header className={`${headerClasses} text-white p-4 sticky top-0 z-50`}>
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">경제 지표</h1>
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            aria-label="새로고침"
          >
            <ArrowPathIcon
              className={`w-5 h-5 ${isRefetching ? 'animate-spin' : ''}`}
            />
          </button>
        </div>
      </header>

      <main className="pb-20 p-4 bg-white dark:bg-gray-900">
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
          <div className="space-y-6">
            {/* 국내 지수 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <ChartBarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  국내 지수
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <IndicatorCard indicator={data.domestic.kospi} />
                <IndicatorCard indicator={data.domestic.kosdaq} />
              </div>
            </section>

            {/* 해외 지수 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <GlobeAltIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  해외 지수
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <IndicatorCard indicator={data.international.sp500} />
                <IndicatorCard indicator={data.international.nasdaq} />
                <IndicatorCard indicator={data.international.dow} />
                <IndicatorCard indicator={data.international.nikkei} />
              </div>
            </section>

            {/* 환율 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CurrencyDollarIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  환율
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <IndicatorCard indicator={data.exchange.usdKrw} />
                <IndicatorCard indicator={data.exchange.jpyKrw} />
                <IndicatorCard indicator={data.exchange.eurKrw} />
                <IndicatorCard indicator={data.exchange.cnyKrw} />
              </div>
            </section>

            {/* 금시세 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <SparklesIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  금시세
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <IndicatorCard indicator={data.gold.international} />
              </div>
            </section>

            {/* 암호화폐 */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CircleStackIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  암호화폐
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <IndicatorCard indicator={data.crypto.bitcoin} />
                <IndicatorCard indicator={data.crypto.ethereum} />
                <IndicatorCard indicator={data.crypto.ripple} />
                <IndicatorCard indicator={data.crypto.cardano} />
              </div>
            </section>

            {/* 마지막 업데이트 */}
            <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-4">
              마지막 업데이트: {data.lastUpdated}
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </>
  )
}
