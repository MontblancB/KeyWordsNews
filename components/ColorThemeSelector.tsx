'use client'

import { useState } from 'react'
import { useColorTheme, COLOR_THEMES, ColorTheme } from '@/hooks/useColorTheme'
import { CheckIcon } from '@heroicons/react/24/solid'

export default function ColorThemeSelector() {
  const { colorTheme, setColorTheme, isLoaded } = useColorTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isLoaded) {
    return (
      <div className="bg-white dark:bg-gray-800">
        <div className="p-4 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">▶</span>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                테마 색상
              </h3>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const themeOptions: ColorTheme[] = ['blue', 'green', 'purple', 'pink', 'indigo', 'red']
  const currentTheme = COLOR_THEMES[colorTheme]

  const getHeaderClass = (theme: ColorTheme) => {
    switch (theme) {
      case 'blue':
        return 'bg-blue-600 dark:bg-blue-700'
      case 'green':
        return 'bg-green-600 dark:bg-green-700'
      case 'purple':
        return 'bg-purple-600 dark:bg-purple-700'
      case 'pink':
        return 'bg-pink-600 dark:bg-pink-700'
      case 'indigo':
        return 'bg-indigo-600 dark:bg-indigo-700'
      case 'red':
        return 'bg-red-600 dark:bg-red-700'
      default:
        return 'bg-blue-600 dark:bg-blue-700'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800">
      {/* 헤더 - 폴딩 가능 */}
      <div
        className="p-4 bg-gray-50 dark:bg-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">{isExpanded ? '▼' : '▶'}</span>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              테마 색상
            </h3>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              ({currentTheme.name})
            </span>
          </div>
        </div>
      </div>

      {/* 폴딩 컨텐츠 */}
      {isExpanded && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            {themeOptions.map((theme) => {
              const isSelected = colorTheme === theme
              const themeConfig = COLOR_THEMES[theme]

              return (
                <button
                  key={theme}
                  onClick={() => setColorTheme(theme)}
                  className={`
                    w-full flex items-center justify-between p-3 rounded-lg transition-colors
                    ${isSelected
                      ? 'bg-gray-100 dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-500'
                      : 'bg-gray-50 dark:bg-gray-800 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded ${getHeaderClass(theme)}`} />
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {themeConfig.name}
                    </span>
                  </div>
                  {isSelected && (
                    <CheckIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </button>
              )
            })}
          </div>

          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            💡 선택한 색상이 모든 페이지 헤더에 적용됩니다
          </p>
        </div>
      )}
    </div>
  )
}
