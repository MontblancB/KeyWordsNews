'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 클라이언트에서만 렌더링 (hydration 이슈 방지)
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">테마 설정</h3>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const themes = [
    { id: 'light', label: '라이트', icon: SunIcon },
    { id: 'dark', label: '다크', icon: MoonIcon },
    { id: 'system', label: '시스템', icon: ComputerDesktopIcon },
  ]

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">테마 설정</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          현재: {themes.find((t) => t.id === theme)?.label || '시스템'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {themes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTheme(id)}
            className={`
              flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all
              ${
                theme === id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:border-blue-400 dark:hover:border-blue-500'
              }
            `}
          >
            <Icon className={`w-6 h-6 ${theme === id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`} />
            <span className={`text-xs font-medium ${theme === id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {label}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        시스템 설정을 선택하면 기기의 다크 모드 설정을 따릅니다.
      </p>
    </div>
  )
}
