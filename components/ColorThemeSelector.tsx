'use client'

import { useState } from 'react'
import { useColorTheme, COLOR_THEMES, ColorTheme } from '@/hooks/useColorTheme'
import { CheckIcon } from '@heroicons/react/24/solid'
import { SwatchIcon } from '@heroicons/react/24/outline'

export default function ColorThemeSelector() {
  const { colorTheme, setColorTheme, isLoaded } = useColorTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isLoaded) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <SwatchIcon className="w-5 h-5 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            테마 색상
          </h3>
        </div>
        <div className="space-y-2 animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    )
  }

  const themeOptions: ColorTheme[] = [
    'blue', 'green', 'purple', 'pink',
    'indigo', 'red', 'orange', 'amber',
    'teal', 'cyan', 'lime', 'rose',
    'emerald', 'violet', 'fuchsia', 'slate'
  ]
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
      case 'orange':
        return 'bg-orange-600 dark:bg-orange-700'
      case 'amber':
        return 'bg-amber-600 dark:bg-amber-700'
      case 'teal':
        return 'bg-teal-600 dark:bg-teal-700'
      case 'cyan':
        return 'bg-cyan-600 dark:bg-cyan-700'
      case 'lime':
        return 'bg-lime-600 dark:bg-lime-700'
      case 'rose':
        return 'bg-rose-600 dark:bg-rose-700'
      case 'emerald':
        return 'bg-emerald-600 dark:bg-emerald-700'
      case 'violet':
        return 'bg-violet-600 dark:bg-violet-700'
      case 'fuchsia':
        return 'bg-fuchsia-600 dark:bg-fuchsia-700'
      case 'slate':
        return 'bg-slate-600 dark:bg-slate-700'
      default:
        return 'bg-blue-600 dark:bg-blue-700'
    }
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      {/* 헤더 (클릭 가능) */}
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <SwatchIcon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            테마 색상
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {currentTheme.name}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {isExpanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* 색상 선택 (폴딩 가능) */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* 4x4 그리드 */}
          <div className="grid grid-cols-4 gap-2">
            {themeOptions.map((theme) => {
              const isSelected = colorTheme === theme
              const themeConfig = COLOR_THEMES[theme]

              return (
                <button
                  key={theme}
                  onClick={(e) => {
                    e.stopPropagation()
                    setColorTheme(theme)
                  }}
                  className={`
                    relative aspect-square rounded-lg transition-all
                    ${getHeaderClass(theme)}
                    ${isSelected ? 'ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100' : 'hover:scale-105'}
                  `}
                  title={themeConfig.name}
                >
                  {isSelected && (
                    <CheckIcon className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow" />
                  )}
                </button>
              )
            })}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400">
            선택한 색상이 모든 페이지 헤더에 적용됩니다
          </p>
        </div>
      )}
    </div>
  )
}
