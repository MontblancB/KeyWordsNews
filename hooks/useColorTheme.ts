'use client'

import { useState, useEffect } from 'react'

export type ColorTheme = 'blue' | 'green' | 'purple' | 'pink' | 'indigo' | 'red'

export const COLOR_THEMES = {
  blue: {
    name: '파란색',
    light: 'bg-blue-600',
    dark: 'dark:bg-blue-700',
    hover: 'hover:bg-blue-700',
    darkHover: 'dark:hover:bg-blue-800',
    preview: 'bg-blue-600',
  },
  green: {
    name: '초록색',
    light: 'bg-green-600',
    dark: 'dark:bg-green-700',
    hover: 'hover:bg-green-700',
    darkHover: 'dark:hover:bg-green-800',
    preview: 'bg-green-600',
  },
  purple: {
    name: '보라색',
    light: 'bg-purple-600',
    dark: 'dark:bg-purple-700',
    hover: 'hover:bg-purple-700',
    darkHover: 'dark:hover:bg-purple-800',
    preview: 'bg-purple-600',
  },
  pink: {
    name: '분홍색',
    light: 'bg-pink-600',
    dark: 'dark:bg-pink-700',
    hover: 'hover:bg-pink-700',
    darkHover: 'dark:hover:bg-pink-800',
    preview: 'bg-pink-600',
  },
  indigo: {
    name: '남색',
    light: 'bg-indigo-600',
    dark: 'dark:bg-indigo-700',
    hover: 'hover:bg-indigo-700',
    darkHover: 'dark:hover:bg-indigo-800',
    preview: 'bg-indigo-600',
  },
  red: {
    name: '빨간색',
    light: 'bg-red-600',
    dark: 'dark:bg-red-700',
    hover: 'hover:bg-red-700',
    darkHover: 'dark:hover:bg-red-800',
    preview: 'bg-red-600',
  },
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
    themeClasses: COLOR_THEMES[colorTheme],
  }
}
