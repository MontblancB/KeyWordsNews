'use client'

import { FireIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'
import TrendModal from './TrendModal'

export default function TrendButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all font-medium text-sm"
        aria-label="실시간 트렌드"
      >
        <FireIcon className="w-4 h-4" />
        <span>TrendNow</span>
      </button>

      <TrendModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
