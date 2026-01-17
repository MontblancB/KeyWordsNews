'use client'

import { useState } from 'react'
import { useWeather } from '@/hooks/useWeather'
import { CloudIcon, SunIcon } from '@heroicons/react/24/outline'
import WeatherDetailModal from './WeatherDetailModal'
import type { SkyStatus } from '@/types/weather'

// 날씨 상태를 한글로 변환
function getSkyText(sky: SkyStatus): string {
  const skyMap = {
    clear: '맑음',
    cloudy: '흐림',
    rain: '비',
    snow: '눈',
  }
  return skyMap[sky]
}

export default function WeatherWidget() {
  const [showDetail, setShowDetail] = useState(false)
  const { data, isLoading } = useWeather()

  if (isLoading || !data) {
    return (
      <div className="flex items-center gap-2.5 px-2.5 py-2">
        <div className="w-6 h-6 border-2 border-white/50 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  const temp = data.weather.temperature
  const sky = data.weather.sky
  const skyText = getSkyText(sky)

  return (
    <>
      {/* 간결한 날씨 위젯 */}
      <button
        onClick={() => setShowDetail(true)}
        className="flex items-center gap-2.5 text-white/90 hover:text-white hover:bg-white/10 rounded-lg px-2.5 py-2 transition-all"
        aria-label="날씨 상세보기"
      >
        {/* 날씨 아이콘 */}
        {sky === 'clear' ? (
          <SunIcon className="w-7 h-7" />
        ) : (
          <CloudIcon className="w-7 h-7" />
        )}

        {/* 기온 + 날씨 상태 (세로 배치) */}
        <div className="flex flex-col items-start -my-0.5">
          <span className="text-lg font-semibold leading-tight">{temp}°</span>
          <span className="text-xs leading-tight opacity-80">{skyText}</span>
        </div>
      </button>

      {/* 상세 정보 모달 */}
      {showDetail && (
        <WeatherDetailModal data={data} onClose={() => setShowDetail(false)} />
      )}
    </>
  )
}
