// hooks/useKeywords.ts
import { useState, useEffect } from 'react'
import { getKeywords, addKeyword, deleteKeyword, moveKeywordUp, moveKeywordDown, SavedKeyword } from '@/lib/keywords'

export function useKeywords() {
  const [keywords, setKeywords] = useState<SavedKeyword[]>([])

  // 초기 로드
  useEffect(() => {
    setKeywords(getKeywords())
  }, [])

  // 키워드 추가
  const handleAdd = (keyword: string) => {
    try {
      const newKeyword = addKeyword(keyword)
      setKeywords([newKeyword, ...keywords])
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // 키워드 삭제
  const handleDelete = (id: string) => {
    deleteKeyword(id)
    setKeywords(keywords.filter(k => k.id !== id))
  }

  // 키워드 순서 변경 (위로)
  const handleMoveUp = (id: string) => {
    const updated = moveKeywordUp(id)
    setKeywords(updated)
  }

  // 키워드 순서 변경 (아래로)
  const handleMoveDown = (id: string) => {
    const updated = moveKeywordDown(id)
    setKeywords(updated)
  }

  return {
    keywords,
    addKeyword: handleAdd,
    deleteKeyword: handleDelete,
    moveKeywordUp: handleMoveUp,
    moveKeywordDown: handleMoveDown,
    hasKeywords: keywords.length > 0
  }
}
