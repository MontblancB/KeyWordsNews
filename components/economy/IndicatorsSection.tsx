'use client'

import IndicatorCard from '@/components/economy/IndicatorCard'
import {
  ChartBarIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  SparklesIcon,
  CircleStackIcon,
} from '@heroicons/react/24/outline'
import type { Indicator, EconomyData } from '@/types/economy'

interface IndicatorsSectionProps {
  data: EconomyData
  onIndicatorClick: (indicator: Indicator) => void
}

export default function IndicatorsSection({ data, onIndicatorClick }: IndicatorsSectionProps) {
  return (
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
          <IndicatorCard indicator={data.domestic.kospi} onClick={onIndicatorClick} />
          <IndicatorCard indicator={data.domestic.kosdaq} onClick={onIndicatorClick} />
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
          <IndicatorCard indicator={data.international.sp500} onClick={onIndicatorClick} />
          <IndicatorCard indicator={data.international.nasdaq} onClick={onIndicatorClick} />
          <IndicatorCard indicator={data.international.dow} onClick={onIndicatorClick} />
          <IndicatorCard indicator={data.international.nikkei} onClick={onIndicatorClick} />
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
          <IndicatorCard indicator={data.exchange.usdKrw} onClick={onIndicatorClick} />
          <IndicatorCard indicator={data.exchange.jpyKrw} onClick={onIndicatorClick} />
          <IndicatorCard indicator={data.exchange.eurKrw} onClick={onIndicatorClick} />
          <IndicatorCard indicator={data.exchange.cnyKrw} onClick={onIndicatorClick} />
        </div>
      </section>

      {/* 귀금속 */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <SparklesIcon className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
          <h2 className="text-sm font-bold text-gray-800 dark:text-gray-200">
            귀금속
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <IndicatorCard indicator={data.metals.gold} onClick={onIndicatorClick} />
          <IndicatorCard indicator={data.metals.silver} onClick={onIndicatorClick} />
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
          <IndicatorCard indicator={data.globalCrypto.totalMarketCap} onClick={onIndicatorClick} />
          <IndicatorCard indicator={data.fearGreed} onClick={onIndicatorClick} />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <IndicatorCard indicator={data.crypto.bitcoin} onClick={onIndicatorClick} />
          <IndicatorCard indicator={data.crypto.ethereum} onClick={onIndicatorClick} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <IndicatorCard indicator={data.globalCrypto.btcDominance} onClick={onIndicatorClick} />
          <IndicatorCard indicator={data.globalCrypto.ethDominance} onClick={onIndicatorClick} />
        </div>
      </section>
    </div>
  )
}
