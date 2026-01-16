'use client'

import { useState, useEffect } from 'react'

export type ColorTheme = 'blue' | 'green' | 'purple' | 'pink' | 'indigo' | 'red'

export const COLOR_THEMES = {
  blue: {
    name: '파란색',
  },
  green: {
    name: '초록색',
  },
  purple: {
    name: '보라색',
  },
  pink: {
    name: '분홍색',
  },
  indigo: {
    name: '남색',
  },
  red: {
    name: '빨간색',
  },
}

// 헤더 색상 클래스를 반환하는 함수
export function getHeaderClasses(theme: ColorTheme) {
  switch (theme) {
    case 'blue':
      return 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800'
    case 'green':
      return 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800'
    case 'purple':
      return 'bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-800'
    case 'pink':
      return 'bg-pink-600 dark:bg-pink-700 hover:bg-pink-700 dark:hover:bg-pink-800'
    case 'indigo':
      return 'bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800'
    case 'red':
      return 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800'
    default:
      return 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800'
  }
}

const STORAGE_KEY = 'color-theme'
const DEFAULT_THEME: ColorTheme = 'blue'

export function useColorTheme() {
  const [colorTheme, setColorTheme] = useState<ColorTheme>(DEFAULT_THEME)
  const [isLoaded, setIsLoaded] = useState(false)

  // localStorage에서 불러오기
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && stored in COLOR_THEMES) {
      setColorTheme(stored as ColorTheme)
    }
    setIsLoaded(true)
  }, [])

  // localStorage에 저장
  const changeColorTheme = (theme: ColorTheme) => {
    setColorTheme(theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }

  return {
    colorTheme,
    setColorTheme: changeColorTheme,
    isLoaded,
    headerClasses: getHeaderClasses(colorTheme),
  }
}
