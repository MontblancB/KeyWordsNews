'use client'

import { useEffect, useState } from 'react'

// 폰트 크기 단계: 0~4 (작게 → 매우 크게)
// 0: 12px, 1: 14px, 2: 16px (기본), 3: 18px, 4: 20px
const FONT_SIZES = [12, 14, 16, 18, 20]
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
    document.documentElement.style.setProperty('--base-font-size', `${size}px`)
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
