'use client'

import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ReferenceEntity } from '@/lib/context/reference-context'
import { Badge } from '@/components/ui/badge'

interface ReferenceAutocompleteProps {
  suggestions: ReferenceEntity[]
  selectedIndex: number
  position: { top: number; left: number }
  onSelect: (entity: ReferenceEntity) => void
  visible: boolean
}

export function ReferenceAutocomplete({
  suggestions,
  selectedIndex,
  position,
  onSelect,
  visible
}: ReferenceAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visible && containerRef.current) {
      const selected = containerRef.current.querySelector(`[data-index="${selectedIndex}"]`)
      if (selected) {
        selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedIndex, visible])

  if (!visible || suggestions.length === 0) return null

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'loan':
        return 'bg-blue-950/50 text-blue-300 border-blue-800'
      case 'customer':
        return 'bg-purple-950/50 text-purple-300 border-purple-800'
      case 'sector':
        return 'bg-amber-950/50 text-amber-300 border-amber-800'
      case 'state':
        return 'bg-emerald-950/50 text-emerald-300 border-emerald-800'
      case 'metric':
        return 'bg-indigo-950/50 text-indigo-300 border-indigo-800'
      default:
        return 'bg-gray-950/50 text-gray-300 border-gray-800'
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="absolute z-50 w-80 max-h-64 overflow-y-auto custom-scrollbar rounded-lg border border-sidebar-border bg-sidebar-accent/95 backdrop-blur-xl shadow-2xl"
        style={{
          top: position.top,
          left: position.left,
        }}
      >
        <div className="p-2 border-b border-sidebar-border">
          <p className="text-xs text-muted-foreground px-2 py-1">
            Reference suggestions
          </p>
        </div>

        <div className="p-1">
          {suggestions.map((entity, index) => (
            <button
              key={entity.id}
              data-index={index}
              onClick={() => onSelect(entity)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                index === selectedIndex
                  ? 'bg-primary/20 border border-primary/40'
                  : 'hover:bg-sidebar-accent border border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0 mt-0.5">{entity.icon || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium truncate">
                      {entity.label}
                    </span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${getTypeBadgeColor(entity.type)}`}
                    >
                      {entity.type}
                    </Badge>
                  </div>
                  {entity.description && (
                    <p className="text-xs text-muted-foreground truncate">
                      {entity.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="p-2 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground px-2">
            Use <kbd className="px-1 py-0.5 rounded bg-sidebar border border-sidebar-border text-[9px]">↑</kbd>{' '}
            <kbd className="px-1 py-0.5 rounded bg-sidebar border border-sidebar-border text-[9px]">↓</kbd> to navigate,{' '}
            <kbd className="px-1 py-0.5 rounded bg-sidebar border border-sidebar-border text-[9px]">Enter</kbd> to select
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
