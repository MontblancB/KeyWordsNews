'use client'

import { useState, useEffect } from 'react'

export type ColorTheme =
  | 'blue' | 'green' | 'purple' | 'pink' | 'indigo' | 'red'
  | 'orange' | 'amber' | 'teal' | 'cyan' | 'lime' | 'rose'
  | 'emerald' | 'violet' | 'fuchsia' | 'slate'

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
  orange: {
    name: '주황색',
  },
  amber: {
    name: '호박색',
  },
  teal: {
    name: '청록색',
  },
  cyan: {
    name: '하늘색',
  },
  lime: {
    name: '연두색',
  },
  rose: {
    name: '장미색',
  },
  emerald: {
    name: '에메랄드',
  },
  violet: {
    name: '제비꽃',
  },
  fuchsia: {
    name: '자홍색',
  },
  slate: {
    name: '슬레이트',
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
    case 'orange':
      return 'bg-orange-600 dark:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-800'
    case 'amber':
      return 'bg-amber-600 dark:bg-amber-700 hover:bg-amber-700 dark:hover:bg-amber-800'
    case 'teal':
      return 'bg-teal-600 dark:bg-teal-700 hover:bg-teal-700 dark:hover:bg-teal-800'
    case 'cyan':
      return 'bg-cyan-600 dark:bg-cyan-700 hover:bg-cyan-700 dark:hover:bg-cyan-800'
    case 'lime':
      return 'bg-lime-600 dark:bg-lime-700 hover:bg-lime-700 dark:hover:bg-lime-800'
    case 'rose':
      return 'bg-rose-600 dark:bg-rose-700 hover:bg-rose-700 dark:hover:bg-rose-800'
    case 'emerald':
      return 'bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-800'
    case 'violet':
      return 'bg-violet-600 dark:bg-violet-700 hover:bg-violet-700 dark:hover:bg-violet-800'
    case 'fuchsia':
      return 'bg-fuchsia-600 dark:bg-fuchsia-700 hover:bg-fuchsia-700 dark:hover:bg-fuchsia-800'
    case 'slate':
      return 'bg-slate-600 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-800'
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
