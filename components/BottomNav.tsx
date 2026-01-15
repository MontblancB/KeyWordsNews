'use client'

import { usePathname, useRouter } from 'next/navigation'

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  const navItems = [
    { icon: '⚡', label: '속보', path: '/' },
    { icon: '📂', label: '토픽', path: '/topics/general' },
    { icon: '⭐', label: '키워드', path: '/keywords' },
    { icon: '🔍', label: '검색', path: '/search' },
    { icon: '⚙️', label: '설정', path: '/settings' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-2xl mx-auto flex justify-around">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
              pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
                ? 'text-blue-600'
                : 'text-gray-500'
            }`}
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
