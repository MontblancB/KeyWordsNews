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

// 버튼 색상 클래스를 반환하는 함수 (카테고리 탭, 키워드 추가 버튼 등)
export function getButtonClasses(theme: ColorTheme) {
  switch (theme) {
    case 'blue':
      return 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white'
    case 'green':
      return 'bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-800 text-white'
    case 'purple':
      return 'bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-800 text-white'
    case 'pink':
      return 'bg-pink-600 dark:bg-pink-700 hover:bg-pink-700 dark:hover:bg-pink-800 text-white'
    case 'indigo':
      return 'bg-indigo-600 dark:bg-indigo-700 hover:bg-indigo-700 dark:hover:bg-indigo-800 text-white'
    case 'red':
      return 'bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-800 text-white'
    case 'orange':
      return 'bg-orange-600 dark:bg-orange-700 hover:bg-orange-700 dark:hover:bg-orange-800 text-white'
    case 'amber':
      return 'bg-amber-600 dark:bg-amber-700 hover:bg-amber-700 dark:hover:bg-amber-800 text-white'
    case 'teal':
      return 'bg-teal-600 dark:bg-teal-700 hover:bg-teal-700 dark:hover:bg-teal-800 text-white'
    case 'cyan':
      return 'bg-cyan-600 dark:bg-cyan-700 hover:bg-cyan-700 dark:hover:bg-cyan-800 text-white'
    case 'lime':
      return 'bg-lime-600 dark:bg-lime-700 hover:bg-lime-700 dark:hover:bg-lime-800 text-white'
    case 'rose':
      return 'bg-rose-600 dark:bg-rose-700 hover:bg-rose-700 dark:hover:bg-rose-800 text-white'
    case 'emerald':
      return 'bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-800 text-white'
    case 'violet':
      return 'bg-violet-600 dark:bg-violet-700 hover:bg-violet-700 dark:hover:bg-violet-800 text-white'
    case 'fuchsia':
      return 'bg-fuchsia-600 dark:bg-fuchsia-700 hover:bg-fuchsia-700 dark:hover:bg-fuchsia-800 text-white'
    case 'slate':
      return 'bg-slate-600 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-800 text-white'
    default:
      return 'bg-blue-600 dark:bg-blue-700 hover:bg-blue-700 dark:hover:bg-blue-800 text-white'
  }
}

// 텍스트 색상 클래스를 반환하는 함수 (위/아래 이동 버튼 등)
export function getTextClasses(theme: ColorTheme) {
  switch (theme) {
    case 'blue':
      return 'text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400'
    case 'green':
      return 'text-green-600 hover:text-green-800 dark:text-green-500 dark:hover:text-green-400'
    case 'purple':
      return 'text-purple-600 hover:text-purple-800 dark:text-purple-500 dark:hover:text-purple-400'
    case 'pink':
      return 'text-pink-600 hover:text-pink-800 dark:text-pink-500 dark:hover:text-pink-400'
    case 'indigo':
      return 'text-indigo-600 hover:text-indigo-800 dark:text-indigo-500 dark:hover:text-indigo-400'
    case 'red':
      return 'text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400'
    case 'orange':
      return 'text-orange-600 hover:text-orange-800 dark:text-orange-500 dark:hover:text-orange-400'
    case 'amber':
      return 'text-amber-600 hover:text-amber-800 dark:text-amber-500 dark:hover:text-amber-400'
    case 'teal':
      return 'text-teal-600 hover:text-teal-800 dark:text-teal-500 dark:hover:text-teal-400'
    case 'cyan':
      return 'text-cyan-600 hover:text-cyan-800 dark:text-cyan-500 dark:hover:text-cyan-400'
    case 'lime':
      return 'text-lime-600 hover:text-lime-800 dark:text-lime-500 dark:hover:text-lime-400'
    case 'rose':
      return 'text-rose-600 hover:text-rose-800 dark:text-rose-500 dark:hover:text-rose-400'
    case 'emerald':
      return 'text-emerald-600 hover:text-emerald-800 dark:text-emerald-500 dark:hover:text-emerald-400'
    case 'violet':
      return 'text-violet-600 hover:text-violet-800 dark:text-violet-500 dark:hover:text-violet-400'
    case 'fuchsia':
      return 'text-fuchsia-600 hover:text-fuchsia-800 dark:text-fuchsia-500 dark:hover:text-fuchsia-400'
    case 'slate':
      return 'text-slate-600 hover:text-slate-800 dark:text-slate-500 dark:hover:text-slate-400'
    default:
      return 'text-blue-600 hover:text-blue-800 dark:text-blue-500 dark:hover:text-blue-400'
  }
}

const STORAGE_KEY = 'color-theme'
const DEFAULT_THEME: ColorTheme = 'blue'

interface UseColorThemeReturn {
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
  isLoaded: boolean
  headerClasses: string
  buttonClasses: string
  textClasses: string
}

export function useColorTheme(): UseColorThemeReturn {
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
    buttonClasses: getButtonClasses(colorTheme),
    textClasses: getTextClasses(colorTheme),
  }
}
