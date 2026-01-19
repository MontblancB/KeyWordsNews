'use client'

import { useState, useEffect } from 'react'

const STORAGE_KEY = 'news-insight-enabled'
const DEFAULT_ENABLED = true

export function useNewsInsightSettings() {
  const [isEnabled, setIsEnabled] = useState<boolean>(DEFAULT_ENABLED)
  const [isLoaded, setIsLoaded] = useState(false)

  // localStorage에서 불러오기
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      setIsEnabled(stored === 'true')
    }
    setIsLoaded(true)
  }, [])

  // 설정 변경 함수
  const toggleEnabled = () => {
    const newValue = !isEnabled
    setIsEnabled(newValue)
    localStorage.setItem(STORAGE_KEY, String(newValue))
  }

  return {
    isEnabled,
    isLoaded,
    toggleEnabled,
  }
}
