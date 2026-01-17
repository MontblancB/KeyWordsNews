import { RSS_FEED_SOURCES } from './rss/sources'
import { RSSFeedSource } from '@/types/news'

const RSS_SETTINGS_STORAGE_KEY = 'rss_source_settings'
const BREAKING_TAB_SETTINGS_STORAGE_KEY = 'breaking_tab_source_settings'
const CATEGORY_SOURCE_SETTINGS_STORAGE_KEY = 'category_source_settings'

export interface RssSourceSettings {
  [sourceId: string]: boolean // sourceId -> enabled/disabled
}

// 카테고리별 소스 설정 (토픽 탭용)
export interface CategorySourceSettings {
  [category: string]: RssSourceSettings
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

/**
 * 등록된 키워드 중 상위 N개 가져오기 (프리페칭용)
 */
export function getTopKeywords(limit: number = 3): string[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('keywords')
  if (!stored) return []

  try {
    const keywords = JSON.parse(stored)
    // 최신 순으로 limit개만 반환
    return keywords.slice(0, limit).map((k: { keyword: string }) => k.keyword)
  } catch {
    return []
  }
}

/**
 * 등록된 모든 키워드 가져오기 (최대 10개, 프리페칭용)
 */
export function getAllKeywords(maxLimit: number = 10): string[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem('keywords')
  if (!stored) return []

  try {
    const keywords = JSON.parse(stored)
    // 모든 키워드를 반환하되, 최대 maxLimit개까지만
    return keywords.slice(0, maxLimit).map((k: { keyword: string }) => k.keyword)
  } catch {
    return []
  }
}

// ==================== 속보 탭 전용 설정 ====================

/**
 * localStorage에서 속보 탭 RSS 소스 설정 조회
 * 저장된 설정이 없으면 모든 소스 활성화 (기본값)
 */
export function getBreakingTabSettings(): RssSourceSettings {
  if (typeof window === 'undefined') {
    // SSR 환경에서는 기본 설정 반환 (모두 활성화)
    return getDefaultSettings()
  }

  const stored = localStorage.getItem(BREAKING_TAB_SETTINGS_STORAGE_KEY)

  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (error) {
      console.error('속보 탭 설정 파싱 실패:', error)
      return getDefaultSettings()
    }
  }

  // 초기값: 모든 소스 활성화
  return getDefaultSettings()
}

/**
 * 속보 탭 RSS 소스 설정 저장
 */
export function saveBreakingTabSettings(settings: RssSourceSettings): void {
  if (typeof window === 'undefined') return

  localStorage.setItem(BREAKING_TAB_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

/**
 * 속보 탭에서 특정 RSS 소스 활성화/비활성화
 */
export function toggleBreakingTabSource(sourceId: string): RssSourceSettings {
  const settings = getBreakingTabSettings()
  settings[sourceId] = !settings[sourceId]
  saveBreakingTabSettings(settings)
  return settings
}

/**
 * 속보 탭에서 활성화된 RSS 소스 목록 조회
 */
export function getEnabledBreakingTabSources(): RSSFeedSource[] {
  const settings = getBreakingTabSettings()

  return RSS_FEED_SOURCES.filter(source => {
    return settings[source.id] ?? true  // 기본값은 true (활성화)
  })
}

/**
 * 속보 탭에서 활성화된 RSS 소스의 이름 목록 (API 쿼리용)
 */
export function getEnabledBreakingTabSourceNames(): string {
  const enabledSources = getEnabledBreakingTabSources()
  return enabledSources.map(source => source.name).join(',')
}

/**
 * 속보 탭 모든 RSS 소스 활성화
 */
export function enableAllBreakingTabSources(): RssSourceSettings {
  const settings: RssSourceSettings = {}
  RSS_FEED_SOURCES.forEach(source => {
    settings[source.id] = true
  })
  saveBreakingTabSettings(settings)
  return settings
}

/**
 * 속보 탭 모든 RSS 소스 비활성화
 */
export function disableAllBreakingTabSources(): RssSourceSettings {
  const settings: RssSourceSettings = {}
  RSS_FEED_SOURCES.forEach(source => {
    settings[source.id] = false
  })
  saveBreakingTabSettings(settings)
  return settings
}

/**
 * 속보 탭 카테고리별 RSS 소스 일괄 활성화/비활성화
 */
export function toggleBreakingTabCategorySources(category: string, enabled: boolean): RssSourceSettings {
  const settings = getBreakingTabSettings()

  RSS_FEED_SOURCES.forEach(source => {
    if (source.category === category) {
      settings[source.id] = enabled
    }
  })

  saveBreakingTabSettings(settings)
  return settings
}

/**
 * 속보 탭 RSS 설정 초기화 (모두 활성화)
 */
export function resetBreakingTabSettings(): RssSourceSettings {
  const defaultSettings = getDefaultSettings()
  saveBreakingTabSettings(defaultSettings)
  return defaultSettings
}

// ==================== 토픽 탭 카테고리별 설정 ====================

/**
 * 카테고리 목록
 */
export const CATEGORIES = [
  { id: 'politics', label: '정치' },
  { id: 'economy', label: '경제' },
  { id: 'society', label: '사회' },
  { id: 'world', label: '국제' },
  { id: 'tech', label: 'IT' },
  { id: 'sports', label: '스포츠' },
  { id: 'entertainment', label: '연예' },
  { id: 'culture', label: '문화' },
]

/**
 * 특정 카테고리의 기본 설정 생성
 * 해당 카테고리에 속한 소스만 포함
 */
function getDefaultCategorySettings(category: string): RssSourceSettings {
  const settings: RssSourceSettings = {}
  RSS_FEED_SOURCES
    .filter(source => source.category === category)
    .forEach(source => {
      settings[source.id] = source.enabled
    })
  return settings
}

/**
 * 모든 카테고리의 기본 설정 생성
 */
function getDefaultAllCategorySettings(): CategorySourceSettings {
  const allSettings: CategorySourceSettings = {}
  CATEGORIES.forEach(cat => {
    allSettings[cat.id] = getDefaultCategorySettings(cat.id)
  })
  return allSettings
}

/**
 * localStorage에서 카테고리별 소스 설정 조회
 */
export function getCategorySourceSettings(): CategorySourceSettings {
  if (typeof window === 'undefined') {
    return getDefaultAllCategorySettings()
  }

  const stored = localStorage.getItem(CATEGORY_SOURCE_SETTINGS_STORAGE_KEY)

  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (error) {
      console.error('카테고리별 소스 설정 파싱 실패:', error)
      return getDefaultAllCategorySettings()
    }
  }

  return getDefaultAllCategorySettings()
}

/**
 * 특정 카테고리의 소스 설정 조회
 */
export function getCategorySettings(category: string): RssSourceSettings {
  const allSettings = getCategorySourceSettings()
  return allSettings[category] ?? getDefaultCategorySettings(category)
}

/**
 * 카테고리별 소스 설정 저장
 */
export function saveCategorySourceSettings(settings: CategorySourceSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(CATEGORY_SOURCE_SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

/**
 * 특정 카테고리의 설정만 저장
 */
export function saveCategorySettings(category: string, settings: RssSourceSettings): void {
  const allSettings = getCategorySourceSettings()
  allSettings[category] = settings
  saveCategorySourceSettings(allSettings)
}

/**
 * 특정 카테고리에서 특정 소스 토글
 */
export function toggleCategorySource(category: string, sourceId: string): RssSourceSettings {
  const categorySettings = getCategorySettings(category)
  categorySettings[sourceId] = !categorySettings[sourceId]
  saveCategorySettings(category, categorySettings)
  return categorySettings
}

/**
 * 특정 카테고리에서 활성화된 소스 목록 조회
 */
export function getEnabledCategorySources(category: string): RSSFeedSource[] {
  const categorySettings = getCategorySettings(category)

  return RSS_FEED_SOURCES.filter(source => {
    if (source.category !== category) return false
    return categorySettings[source.id] ?? source.enabled
  })
}

/**
 * 특정 카테고리에서 활성화된 소스 이름 목록 (API 쿼리용)
 */
export function getEnabledCategorySourceNames(category: string): string {
  const enabledSources = getEnabledCategorySources(category)
  return enabledSources.map(source => source.name).join(',')
}

/**
 * 특정 카테고리의 모든 소스 활성화
 */
export function enableAllCategorySources(category: string): RssSourceSettings {
  const settings: RssSourceSettings = {}
  RSS_FEED_SOURCES
    .filter(source => source.category === category)
    .forEach(source => {
      settings[source.id] = true
    })
  saveCategorySettings(category, settings)
  return settings
}

/**
 * 특정 카테고리의 모든 소스 비활성화
 */
export function disableAllCategorySources(category: string): RssSourceSettings {
  const settings: RssSourceSettings = {}
  RSS_FEED_SOURCES
    .filter(source => source.category === category)
    .forEach(source => {
      settings[source.id] = false
    })
  saveCategorySettings(category, settings)
  return settings
}

/**
 * 특정 카테고리의 설정 초기화 (기본값으로)
 */
export function resetCategorySettings(category: string): RssSourceSettings {
  const defaultSettings = getDefaultCategorySettings(category)
  saveCategorySettings(category, defaultSettings)
  return defaultSettings
}

/**
 * 모든 카테고리의 설정 초기화
 */
export function resetAllCategorySettings(): CategorySourceSettings {
  const defaultSettings = getDefaultAllCategorySettings()
  saveCategorySourceSettings(defaultSettings)
  return defaultSettings
}

/**
 * 특정 카테고리의 소스 개수 통계
 */
export function getCategorySourceStats(category: string): { enabled: number; total: number } {
  const categorySettings = getCategorySettings(category)
  const categorySources = RSS_FEED_SOURCES.filter(source => source.category === category)

  const enabledCount = categorySources.filter(source =>
    categorySettings[source.id] ?? source.enabled
  ).length

  return {
    enabled: enabledCount,
    total: categorySources.length
  }
}
