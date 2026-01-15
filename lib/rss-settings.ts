import { RSS_FEED_SOURCES } from './rss/sources'
import { RSSFeedSource } from '@/types/news'

const RSS_SETTINGS_STORAGE_KEY = 'rss_source_settings'

export interface RssSourceSettings {
  [sourceId: string]: boolean // sourceId -> enabled/disabled
}

/**
 * localStorage에서 RSS 소스 설정 조회
 * 저장된 설정이 없으면 sources.ts의 기본 enabled 값 사용
 */
export function getRssSettings(): RssSourceSettings {
  if (typeof window === 'undefined') {
    // SSR 환경에서는 기본 설정 반환
    return getDefaultSettings()
  }

  const stored = localStorage.getItem(RSS_SETTINGS_STORAGE_KEY)

  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (error) {
      console.error('RSS 설정 파싱 실패:', error)
      return getDefaultSettings()
    }
  }

  return getDefaultSettings()
}

/**
 * sources.ts의 기본 enabled 값을 설정으로 변환
 */
function getDefaultSettings(): RssSourceSettings {
  const settings: RssSourceSettings = {}
  RSS_FEED_SOURCES.forEach(source => {
    settings[source.id] = source.enabled
  })
  return settings
}

/**
 * RSS 소스 설정 저장
 */
export function saveRssSettings(settings: RssSourceSettings): void {
  if (typeof window === 'undefined') return

  localStorage.setItem(RSS_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

/**
 * 특정 RSS 소스 활성화/비활성화
 */
export function toggleRssSource(sourceId: string): RssSourceSettings {
  const settings = getRssSettings()
  settings[sourceId] = !settings[sourceId]
  saveRssSettings(settings)
  return settings
}

/**
 * 특정 RSS 소스의 활성화 상태 확인
 */
export function isRssSourceEnabled(sourceId: string): boolean {
  const settings = getRssSettings()
  return settings[sourceId] ?? true // 기본값은 true
}

/**
 * 현재 설정에서 활성화된 RSS 소스 목록 조회
 */
export function getEnabledRssSources(): RSSFeedSource[] {
  const settings = getRssSettings()

  return RSS_FEED_SOURCES.filter(source => {
    // localStorage 설정이 있으면 그것을 우선 사용, 없으면 기본값 사용
    return settings[source.id] ?? source.enabled
  })
}

/**
 * 카테고리별로 활성화된 RSS 소스 조회
 */
export function getEnabledRssSourcesByCategory(category: string): RSSFeedSource[] {
  const enabledSources = getEnabledRssSources()
  return enabledSources.filter(source => source.category === category)
}

/**
 * 모든 RSS 소스를 활성화
 */
export function enableAllRssSources(): RssSourceSettings {
  const settings: RssSourceSettings = {}
  RSS_FEED_SOURCES.forEach(source => {
    settings[source.id] = true
  })
  saveRssSettings(settings)
  return settings
}

/**
 * 모든 RSS 소스를 비활성화
 */
export function disableAllRssSources(): RssSourceSettings {
  const settings: RssSourceSettings = {}
  RSS_FEED_SOURCES.forEach(source => {
    settings[source.id] = false
  })
  saveRssSettings(settings)
  return settings
}

/**
 * 카테고리별 RSS 소스 일괄 활성화/비활성화
 */
export function toggleCategoryRssSources(category: string, enabled: boolean): RssSourceSettings {
  const settings = getRssSettings()

  RSS_FEED_SOURCES.forEach(source => {
    if (source.category === category) {
      settings[source.id] = enabled
    }
  })

  saveRssSettings(settings)
  return settings
}

/**
 * RSS 설정 초기화 (기본값으로 되돌리기)
 */
export function resetRssSettings(): RssSourceSettings {
  const defaultSettings = getDefaultSettings()
  saveRssSettings(defaultSettings)
  return defaultSettings
}

/**
 * 활성화된 RSS 소스의 이름 목록 (API 쿼리용)
 */
export function getEnabledRssSourceNames(): string {
  const enabledSources = getEnabledRssSources()
  return enabledSources.map(source => source.name).join(',')
}
