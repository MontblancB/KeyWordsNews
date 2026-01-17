'use client'

import { useState } from 'react'
import { useWeather } from '@/hooks/useWeather'
import { CloudIcon, SunIcon } from '@heroicons/react/24/outline'
import WeatherDetailModal from './WeatherDetailModal'

export default function WeatherWidget() {
  const [showDetail, setShowDetail] = useState(false)
  const { data, isLoading } = useWeather()

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const temp = data.weather.temperature
  const sky = data.weather.sky

  return (
    <>
      {/* 간결한 날씨 위젯 */}
      <button
        onClick={() => setShowDetail(true)}
        className="flex items-center gap-1.5 text-white/90 hover:text-white hover:bg-white/10 rounded-lg px-2 py-1.5 transition-all"
        aria-label="날씨 상세보기"
      >
        {/* 날씨 아이콘 */}
        {sky === 'clear' ? (
          <SunIcon className="w-4 h-4" />
        ) : (
          <CloudIcon className="w-4 h-4" />
        )}

        {/* 기온 */}
        <span className="text-sm font-medium">{temp}°</span>
      </button>

      {/* 상세 정보 모달 */}
      {showDetail && (
        <WeatherDetailModal data={data} onClose={() => setShowDetail(false)} />
      )}
    </>
  )
}
