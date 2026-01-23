'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bars3Icon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useCategoryOrder } from '@/hooks/useCategoryOrder'
import { CATEGORY_LABELS } from '@/lib/settings/categoryOrder'

interface SortableItemProps {
  id: string
  label: string
}

function SortableItem({ id, label }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
        aria-label={`${label} 카테고리 순서 변경`}
      >
        <Bars3Icon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      </button>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {label}
      </span>
    </div>
  )
}

export default function CategoryOrderManager() {
  const { categoryOrder, setCategoryOrder, resetCategoryOrder, isDefaultOrder } =
    useCategoryOrder()
  const [isExpanded, setIsExpanded] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 이동 후 드래그 시작 (터치 스크롤과 구분)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = categoryOrder.indexOf(active.id as string)
      const newIndex = categoryOrder.indexOf(over.id as string)
      const newOrder = arrayMove(categoryOrder, oldIndex, newIndex)
      setCategoryOrder(newOrder)
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
          <Bars3Icon className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            토픽 카테고리 순서 관리
          </h3>
        </div>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {isExpanded ? '▲' : '▼'}
        </span>
      </div>

      {/* 본문 (폴딩 가능) */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            드래그하여 토픽 탭의 카테고리 순서를 변경하세요
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={categoryOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {categoryOrder.map(id => (
                  <SortableItem key={id} id={id} label={CATEGORY_LABELS[id] || id} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {!isDefaultOrder && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                resetCategoryOrder()
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              기본값으로 재설정
            </button>
          )}
        </div>
      )}
    </div>
  )
}
