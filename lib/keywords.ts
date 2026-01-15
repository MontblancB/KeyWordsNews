// lib/keywords.ts

const KEYWORDS_STORAGE_KEY = 'news_keywords'

export interface SavedKeyword {
  id: string          // 고유 ID
  keyword: string     // 키워드 텍스트
  createdAt: string   // 추가된 시간
}

// 모든 키워드 조회
export function getKeywords(): SavedKeyword[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(KEYWORDS_STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

// 키워드 추가
export function addKeyword(keyword: string): SavedKeyword {
  const keywords = getKeywords()

  // 중복 체크
  const exists = keywords.find(k => k.keyword.toLowerCase() === keyword.toLowerCase())
  if (exists) {
    throw new Error('이미 등록된 키워드입니다.')
  }

  const newKeyword: SavedKeyword = {
    id: Date.now().toString(),
    keyword: keyword.trim(),
    createdAt: new Date().toISOString()
  }

  keywords.unshift(newKeyword) // 최신순
  localStorage.setItem(KEYWORDS_STORAGE_KEY, JSON.stringify(keywords))

  return newKeyword
}

// 키워드 삭제
export function deleteKeyword(id: string): void {
  const keywords = getKeywords()
  const filtered = keywords.filter(k => k.id !== id)
  localStorage.setItem(KEYWORDS_STORAGE_KEY, JSON.stringify(filtered))
}

// 모든 키워드 삭제
export function clearKeywords(): void {
  localStorage.removeItem(KEYWORDS_STORAGE_KEY)
}

// 키워드 순서 변경 (위로)
export function moveKeywordUp(id: string): SavedKeyword[] {
  const keywords = getKeywords()
  const index = keywords.findIndex(k => k.id === id)

  if (index > 0) {
    // 배열에서 위치 교환
    [keywords[index - 1], keywords[index]] = [keywords[index], keywords[index - 1]]
    localStorage.setItem(KEYWORDS_STORAGE_KEY, JSON.stringify(keywords))
  }

  return keywords
}

// 키워드 순서 변경 (아래로)
export function moveKeywordDown(id: string): SavedKeyword[] {
  const keywords = getKeywords()
  const index = keywords.findIndex(k => k.id === id)

  if (index < keywords.length - 1) {
    // 배열에서 위치 교환
    [keywords[index], keywords[index + 1]] = [keywords[index + 1], keywords[index]]
    localStorage.setItem(KEYWORDS_STORAGE_KEY, JSON.stringify(keywords))
  }

  return keywords
}
