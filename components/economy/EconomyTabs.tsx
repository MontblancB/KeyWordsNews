'use client'

import { useColorTheme } from '@/hooks/useColorTheme'
import { ChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export type EconomyTabType = 'indicators' | 'stock'

interface EconomyTabsProps {
  activeTab: EconomyTabType
  onTabChange: (tab: EconomyTabType) => void
}

const TABS = [
  { id: 'indicators' as const, label: '지표', icon: ChartBarIcon },
  { id: 'stock' as const, label: '주식', icon: MagnifyingGlassIcon },
]

export default function EconomyTabs({ activeTab, onTabChange }: EconomyTabsProps) {
  const { buttonClasses } = useColorTheme()

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex gap-2 p-2">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? buttonClasses
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
