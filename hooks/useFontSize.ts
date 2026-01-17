'use client'

import { useEffect, useState } from 'react'

// 폰트 크기 단계: 0~6 (매우 작게 → 초대형)
// 0: 12px, 1: 14px, 2: 16px (기본), 3: 18px, 4: 20px, 5: 22px, 6: 24px
const FONT_SIZES = [12, 14, 16, 18, 20, 22, 24]
const DEFAULT_SIZE_INDEX = 2 // 16px

export function useFontSize() {
  const [sizeIndex, setSizeIndex] = useState(DEFAULT_SIZE_INDEX)

  useEffect(() => {
    // localStorage에서 저장된 폰트 크기 불러오기
    const saved = localStorage.getItem('fontSize')
    if (saved !== null) {
      const index = parseInt(saved, 10)
      if (index >= 0 && index < FONT_SIZES.length) {
        setSizeIndex(index)
        applyFontSize(index)
      }
    }
  }, [])

  const applyFontSize = (index: number) => {
    const size = FONT_SIZES[index]
    // CSS 변수만 변경하여 텍스트만 크기 조절 (레이아웃은 유지)
    document.documentElement.style.setProperty('--base-font-size', `${size}px`)

    // 폰트 크기에 따라 뉴스 리스트 줄 수 조절 (폰트 클수록 더 많은 줄 표시)
    let titleLines = 2
    let summaryLines = 2
    if (size >= 20) {
      titleLines = 3
      summaryLines = 3
    }
    document.documentElement.style.setProperty('--news-title-lines', titleLines.toString())
    document.documentElement.style.setProperty('--news-summary-lines', summaryLines.toString())
  }

  const increase = () => {
    if (sizeIndex < FONT_SIZES.length - 1) {
      const newIndex = sizeIndex + 1
      setSizeIndex(newIndex)
      applyFontSize(newIndex)
      localStorage.setItem('fontSize', newIndex.toString())
    }
  }

  const decrease = () => {
    if (sizeIndex > 0) {
      const newIndex = sizeIndex - 1
      setSizeIndex(newIndex)
      applyFontSize(newIndex)
      localStorage.setItem('fontSize', newIndex.toString())
    }
  }

  const reset = () => {
    setSizeIndex(DEFAULT_SIZE_INDEX)
    applyFontSize(DEFAULT_SIZE_INDEX)
    localStorage.setItem('fontSize', DEFAULT_SIZE_INDEX.toString())
  }

  return {
    sizeIndex,
    fontSize: FONT_SIZES[sizeIndex],
    canIncrease: sizeIndex < FONT_SIZES.length - 1,
    canDecrease: sizeIndex > 0,
    increase,
    decrease,
    reset,
  }
}
