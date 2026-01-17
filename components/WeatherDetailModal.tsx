'use client'

import type { WeatherData, AirQuality } from '@/types/weather'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface Props {
  data: WeatherData
  onClose: () => void
}

export default function WeatherDetailModal({ data, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {data.location}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {data.lastUpdated}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            aria-label="닫기"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 메인 정보 */}
        <div className="p-5 space-y-4">
          {/* 날씨 정보 */}
          <div className="grid grid-cols-2 gap-3">
            <InfoCard
              label="기온"
              value={data.weather.temperature}
              unit="°C"
              color="text-orange-600 dark:text-orange-400"
            />
            <InfoCard
              label="체감온도"
              value={data.weather.feelsLike}
              unit="°C"
              color="text-orange-500 dark:text-orange-300"
            />
            <InfoCard
              label="습도"
              value={data.weather.humidity}
              unit="%"
              color="text-blue-600 dark:text-blue-400"
            />
            <InfoCard
              label="강수확률"
              value={data.weather.precipitationProb}
              unit="%"
              color="text-sky-600 dark:text-sky-400"
            />
          </div>

          {/* 대기질 섹션 */}
          <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              대기질
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <AirQualityCard
                label="미세먼지"
                value={data.weather.pm10}
                grade={data.weather.pm10Grade}
              />
              <AirQualityCard
                label="초미세먼지"
                value={data.weather.pm25}
                grade={data.weather.pm25Grade}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 깔끔한 정보 카드
function InfoCard({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: string
  unit: string
  color: string
}) {
  return (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
        {label}
      </div>
      <div className={`text-2xl font-bold ${color}`}>
        {value}
        <span className="text-sm ml-0.5">{unit}</span>
      </div>
    </div>
  )
}

// 대기질 카드
function AirQualityCard({
  label,
  value,
  grade,
}: {
  label: string
  value: string
  grade: AirQuality
}) {
  const gradeInfo = {
    good: {
      text: '좋음',
      color: 'text-green-600 dark:text-green-400',
      bg: 'bg-green-50 dark:bg-green-900/20',
    },
    normal: {
      text: '보통',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    bad: {
      text: '나쁨',
      color: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-50 dark:bg-orange-900/20',
    },
    very_bad: {
      text: '매우나쁨',
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-900/20',
    },
  }
  const info = gradeInfo[grade]

  return (
    <div className={`${info.bg} rounded-xl p-3`}>
      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className={`text-xl font-bold ${info.color}`}>{value}</span>
        <span className={`text-xs font-medium ${info.color}`}>
          {info.text}
        </span>
      </div>
    </div>
  )
}
