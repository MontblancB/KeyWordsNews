import { useState, useEffect, useCallback } from 'react'
import {
  getCategorySettings,
  toggleCategorySource,
  enableAllCategorySources,
  disableAllCategorySources,
  resetCategorySettings,
  getEnabledCategorySources,
  getCategorySourceStats,
  RssSourceSettings,
  CATEGORIES
} from '@/lib/rss-settings'
import { RSS_FEED_SOURCES } from '@/lib/rss/sources'

export function useCategorySettings(category: string) {
  const [settings, setSettings] = useState<RssSourceSettings>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // 초기 로드
  useEffect(() => {
    const initialSettings = getCategorySettings(category)
    setSettings(initialSettings)
    setIsLoaded(true)
  }, [category])

  // 특정 소스 토글
  const handleToggle = useCallback((sourceId: string) => {
    const updated = toggleCategorySource(category, sourceId)
    setSettings(updated)
  }, [category])

  // 모든 소스 활성화
  const handleEnableAll = useCallback(() => {
    const updated = enableAllCategorySources(category)
    setSettings(updated)
  }, [category])

  // 모든 소스 비활성화
  const handleDisableAll = useCallback(() => {
    const updated = disableAllCategorySources(category)
    setSettings(updated)
  }, [category])

  // 기본값으로 초기화
  const handleReset = useCallback(() => {
    const updated = resetCategorySettings(category)
    setSettings(updated)
  }, [category])

  // 해당 카테고리의 소스 목록
  const categorySources = RSS_FEED_SOURCES.filter(source => source.category === category)

  // 현재 활성화된 소스 개수
  const stats = getCategorySourceStats(category)

  return {
    settings,
    isLoaded,
    toggleSource: handleToggle,
    enableAll: handleEnableAll,
    disableAll: handleDisableAll,
    reset: handleReset,
    enabledCount: stats.enabled,
    totalCount: stats.total,
    categorySources,
    enabledSources: getEnabledCategorySources(category)
  }
}

// 모든 카테고리의 설정을 관리하는 Hook
export function useAllCategorySettings() {
  const [settingsMap, setSettingsMap] = useState<{ [category: string]: RssSourceSettings }>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // 초기 로드
  useEffect(() => {
    const initialSettings: { [category: string]: RssSourceSettings } = {}
    CATEGORIES.forEach(cat => {
      initialSettings[cat.id] = getCategorySettings(cat.id)
    })
    setSettingsMap(initialSettings)
    setIsLoaded(true)
  }, [])

  // 특정 카테고리의 소스 토글
  const handleToggle = useCallback((category: string, sourceId: string) => {
    const updated = toggleCategorySource(category, sourceId)
    setSettingsMap(prev => ({
      ...prev,
      [category]: updated
    }))
  }, [])

  // 특정 카테고리의 모든 소스 활성화
  const handleEnableAll = useCallback((category: string) => {
    const updated = enableAllCategorySources(category)
    setSettingsMap(prev => ({
      ...prev,
      [category]: updated
    }))
  }, [])

  // 특정 카테고리의 모든 소스 비활성화
  const handleDisableAll = useCallback((category: string) => {
    const updated = disableAllCategorySources(category)
    setSettingsMap(prev => ({
      ...prev,
      [category]: updated
    }))
  }, [])

  // 특정 카테고리 초기화
  const handleReset = useCallback((category: string) => {
    const updated = resetCategorySettings(category)
    setSettingsMap(prev => ({
      ...prev,
      [category]: updated
    }))
  }, [])

  // 카테고리별 통계
  const getStats = useCallback((category: string) => {
    return getCategorySourceStats(category)
  }, [])

  // 카테고리별 소스 목록
  const getSourcesByCategory = useCallback((category: string) => {
    return RSS_FEED_SOURCES.filter(source => source.category === category)
  }, [])

  return {
    settingsMap,
    isLoaded,
    toggleSource: handleToggle,
    enableAll: handleEnableAll,
    disableAll: handleDisableAll,
    reset: handleReset,
    getStats,
    getSourcesByCategory,
    categories: CATEGORIES
  }
}
