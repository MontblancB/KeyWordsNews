'use client'

import { useColorTheme, COLOR_THEMES, ColorTheme } from '@/hooks/useColorTheme'
import { CheckIcon } from '@heroicons/react/24/solid'
import { SwatchIcon } from '@heroicons/react/24/outline'

export default function ColorThemeSelector() {
  const { colorTheme, setColorTheme, isLoaded } = useColorTheme()

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
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <SwatchIcon className="w-5 h-5 text-purple-500 dark:text-purple-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            테마 색상
          </h3>
        </div>
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {currentTheme.name}
        </span>
      </div>

      {/* 색상 선택 */}
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
                ${
                  isSelected
                    ? 'bg-white dark:bg-gray-700 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-750 hover:bg-white dark:hover:bg-gray-700'
                }
              `}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${getHeaderClass(theme)} shadow-sm`} />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
        선택한 색상이 모든 페이지 헤더에 적용됩니다
      </p>
    </div>
  )
}
