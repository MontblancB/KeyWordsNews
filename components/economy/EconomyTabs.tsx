'use client'

import { ChartBarIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import {
  ChartBarIcon as ChartBarIconSolid,
  MagnifyingGlassIcon as MagnifyingGlassIconSolid,
} from '@heroicons/react/24/solid'

export type EconomyTab = 'indicators' | 'stocks'

interface EconomyTabsProps {
  activeTab: EconomyTab
  onTabChange: (tab: EconomyTab) => void
}

const TABS = [
  {
    id: 'indicators' as const,
    label: '지표',
    icon: ChartBarIcon,
    activeIcon: ChartBarIconSolid,
  },
  {
    id: 'stocks' as const,
    label: '주식',
    icon: MagnifyingGlassIcon,
    activeIcon: MagnifyingGlassIconSolid,
  },
]

export default function EconomyTabs({ activeTab, onTabChange }: EconomyTabsProps) {
  return (
    <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = isActive ? tab.activeIcon : tab.icon

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-colors
              ${
                isActive
                  ? 'text-green-600 dark:text-green-400 border-b-2 border-green-600 dark:border-green-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }
            `}
          >
            <Icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}
