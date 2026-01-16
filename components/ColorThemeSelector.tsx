'use client'

import { useColorTheme, COLOR_THEMES, ColorTheme } from '@/hooks/useColorTheme'
import { CheckIcon } from '@heroicons/react/24/solid'

export default function ColorThemeSelector() {
  const { colorTheme, setColorTheme, isLoaded } = useColorTheme()

  if (!isLoaded) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
          테마 색상
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const themeOptions: ColorTheme[] = ['blue', 'green', 'purple', 'pink', 'indigo', 'red']

  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          테마 색상
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          상단 헤더 색상
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {themeOptions.map((theme) => {
          const isSelected = colorTheme === theme
          const themeConfig = COLOR_THEMES[theme]

          return (
            <button
              key={theme}
              onClick={() => setColorTheme(theme)}
              className={`
                relative h-12 rounded-lg transition-all
                ${themeConfig.preview}
                ${isSelected ? 'ring-4 ring-offset-2 ring-gray-400 dark:ring-gray-500' : 'opacity-70 hover:opacity-100'}
              `}
            >
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckIcon className="w-6 h-6 text-white" />
                </div>
              )}
              <div className="absolute bottom-1 left-0 right-0 text-center">
                <span className="text-[10px] font-medium text-white">
                  {themeConfig.name}
                </span>
              </div>
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
