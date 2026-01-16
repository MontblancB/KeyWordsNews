'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { MoonIcon, SunIcon } from '@heroicons/react/24/solid'

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 클라이언트에서만 렌더링 (hydration 이슈 방지)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MoonIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              다크 모드
            </span>
          </div>
          <div className="w-12 h-7 bg-gray-300 rounded-full animate-pulse" />
        </div>
      </div>
    )
  }

  const isDark = resolvedTheme === 'dark'

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isDark ? (
            <MoonIcon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          ) : (
            <SunIcon className="w-5 h-5 text-yellow-500" />
          )}
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            다크 모드
          </span>
        </div>

        {/* iOS 스타일 토글 스위치 */}
        <button
          onClick={toggleTheme}
          className={`
            relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 ease-in-out
            ${isDark ? 'bg-blue-500' : 'bg-gray-300'}
          `}
          role="switch"
          aria-checked={isDark}
        >
          <span
            className={`
              inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ease-in-out
              ${isDark ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        {isDark ? '어두운 테마가 적용되었습니다' : '밝은 테마가 적용되었습니다'}
      </p>
    </div>
  )
}
