import { useState, useEffect } from 'react'
import {
  getRssSettings,
  toggleRssSource,
  enableAllRssSources,
  disableAllRssSources,
  toggleCategoryRssSources,
  resetRssSettings,
  getEnabledRssSources,
  RssSourceSettings
} from '@/lib/rss-settings'
import { RSS_FEED_SOURCES } from '@/lib/rss/sources'

export function useRssSettings() {
  const [settings, setSettings] = useState<RssSourceSettings>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // 초기 로드
  useEffect(() => {
    const initialSettings = getRssSettings()
    setSettings(initialSettings)
    setIsLoaded(true)
  }, [])

  // 특정 RSS 소스 토글
  const handleToggle = (sourceId: string) => {
    const updated = toggleRssSource(sourceId)
    setSettings(updated)
  }

  // 모든 소스 활성화
  const handleEnableAll = () => {
    const updated = enableAllRssSources()
    setSettings(updated)
  }

  // 모든 소스 비활성화
  const handleDisableAll = () => {
    const updated = disableAllRssSources()
    setSettings(updated)
  }

  // 카테고리별 토글
  const handleToggleCategory = (category: string, enabled: boolean) => {
    const updated = toggleCategoryRssSources(category, enabled)
    setSettings(updated)
  }

  // 기본값으로 초기화
  const handleReset = () => {
    const updated = resetRssSettings()
    setSettings(updated)
  }

  // 현재 활성화된 소스 개수 (기본값 고려)
  const enabledCount = RSS_FEED_SOURCES.filter(source =>
    settings[source.id] ?? source.enabled
  ).length
  const totalCount = RSS_FEED_SOURCES.length

  // 카테고리별 통계
  const getCategoryStats = (category: string) => {
    const categorySources = RSS_FEED_SOURCES.filter(s => s.category === category)
    const enabledInCategory = categorySources.filter(s =>
      settings[s.id] ?? s.enabled
    ).length
    return {
      total: categorySources.length,
      enabled: enabledInCategory,
      allEnabled: enabledInCategory === categorySources.length,
      noneEnabled: enabledInCategory === 0
    }
  }

  return {
    settings,
    isLoaded,
    toggleSource: handleToggle,
    enableAll: handleEnableAll,
    disableAll: handleDisableAll,
    toggleCategory: handleToggleCategory,
    reset: handleReset,
    enabledCount,
    totalCount,
    getCategoryStats,
    allSources: RSS_FEED_SOURCES,
    enabledSources: getEnabledRssSources()
  }
}
