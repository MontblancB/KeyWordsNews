'use client'

import { useState, useEffect } from 'react'
import {
  getCategoryOrder,
  setCategoryOrder as saveCategoryOrder,
  resetCategoryOrder as resetOrder,
  DEFAULT_CATEGORY_ORDER,
} from '@/lib/settings/categoryOrder'

interface UseCategoryOrderReturn {
  categoryOrder: string[]
  setCategoryOrder: (order: string[]) => void
  resetCategoryOrder: () => void
  isDefaultOrder: boolean
}

export function useCategoryOrder(): UseCategoryOrderReturn {
  const [categoryOrder, setCategoryOrderState] = useState<string[]>(DEFAULT_CATEGORY_ORDER)
  const [isDefaultOrder, setIsDefaultOrder] = useState(true)

  useEffect(() => {
    const order = getCategoryOrder()
    setCategoryOrderState(order)
    setIsDefaultOrder(JSON.stringify(order) === JSON.stringify(DEFAULT_CATEGORY_ORDER))
  }, [])

  const setCategoryOrder = (order: string[]) => {
    setCategoryOrderState(order)
    saveCategoryOrder(order)
    setIsDefaultOrder(JSON.stringify(order) === JSON.stringify(DEFAULT_CATEGORY_ORDER))
  }

  const resetCategoryOrder = () => {
    setCategoryOrderState(DEFAULT_CATEGORY_ORDER)
    resetOrder()
    setIsDefaultOrder(true)
  }

  return {
    categoryOrder,
    setCategoryOrder,
    resetCategoryOrder,
    isDefaultOrder,
  }
}
