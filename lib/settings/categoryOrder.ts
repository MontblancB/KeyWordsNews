// 카테고리 순서 관리 유틸리티

export const CATEGORY_ORDER_KEY = 'keywordsnews_category_order'

export const DEFAULT_CATEGORY_ORDER = [
  'politics',
  'economy',
  'society',
  'world',
  'tech',
  'crypto',
  'global',
  'sports',
  'entertainment',
  'culture',
]

export const CATEGORY_LABELS: Record<string, string> = {
  politics: '정치',
  economy: '경제',
  society: '사회',
  world: '국제',
  tech: 'IT',
  crypto: '암호화폐',
  global: '글로벌',
  sports: '스포츠',
  entertainment: '연예',
  culture: '문화',
}

/**
 * 로컬스토리지에서 카테고리 순서 가져오기
 */
export function getCategoryOrder(): string[] {
  if (typeof window === 'undefined') {
    return DEFAULT_CATEGORY_ORDER
  }

  try {
    const stored = localStorage.getItem(CATEGORY_ORDER_KEY)
    if (!stored) {
      return DEFAULT_CATEGORY_ORDER
    }

    const parsed = JSON.parse(stored) as string[]

    // 유효성 검사: 저장된 순서가 유효한지 확인
    const isValid =
      Array.isArray(parsed) &&
      parsed.length === DEFAULT_CATEGORY_ORDER.length &&
      parsed.every(id => DEFAULT_CATEGORY_ORDER.includes(id))

    return isValid ? parsed : DEFAULT_CATEGORY_ORDER
  } catch (error) {
    console.error('Failed to load category order:', error)
    return DEFAULT_CATEGORY_ORDER
  }
}

/**
 * 로컬스토리지에 카테고리 순서 저장
 */
export function setCategoryOrder(order: string[]): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(CATEGORY_ORDER_KEY, JSON.stringify(order))
  } catch (error) {
    console.error('Failed to save category order:', error)
  }
}

/**
 * 카테고리 순서를 기본값으로 리셋
 */
export function resetCategoryOrder(): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.removeItem(CATEGORY_ORDER_KEY)
  } catch (error) {
    console.error('Failed to reset category order:', error)
  }
}
