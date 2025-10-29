'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import CountUp from 'react-countup'

interface PremiumStatCardProps {
  icon: LucideIcon
  label: string
  value: number
  change?: number
  unit?: string
  prefix?: string
  decimals?: number
  accentColor?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
  delay?: number
}

export function PremiumStatCard({
  icon: Icon,
  label,
  value,
  change,
  unit = '',
  prefix = '',
  decimals = 0,
  accentColor = 'primary',
  delay = 0,
}: PremiumStatCardProps) {
  const accentColors = {
    primary: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#3B82F6',
  }

  const changeColors = {
    positive: 'rgba(16, 185, 129, 0.12)',
    negative: 'rgba(239, 68, 68, 0.12)',
    positiveBorder: 'rgba(16, 185, 129, 0.2)',
    negativeBorder: 'rgba(239, 68, 68, 0.2)',
  }

  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2 },
      }}
      className="stat-card group relative"
    >
      {/* Icon with colored background */}
      <div className="flex items-start justify-between mb-4">
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg"
          style={{
            backgroundColor: `${accentColors[accentColor]}15`,
          }}
        >
          <Icon
            className="w-4 h-4"
            style={{ color: accentColors[accentColor] }}
          />
        </div>
      </div>

      {/* Label */}
      <div className="text-premium-label mb-2" style={{ color: 'var(--text-quaternary)' }}>
        {label}
      </div>

      {/* Value */}
      <motion.div
        className="text-premium-metric-lg mb-3"
        style={{ color: 'var(--text-primary)' }}
        initial={{ scale: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      >
        {prefix}
        <CountUp
          end={value}
          duration={1.5}
          decimals={decimals}
          separator=","
          preserveValue
        />
        {unit}
      </motion.div>

      {/* Change Indicator */}
      {change !== undefined && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: delay + 0.2 }}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-sm font-semibold"
          style={{
            backgroundColor: isPositive
              ? changeColors.positive
              : isNegative
              ? changeColors.negative
              : 'rgba(156, 163, 175, 0.12)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: isPositive
              ? changeColors.positiveBorder
              : isNegative
              ? changeColors.negativeBorder
              : 'rgba(156, 163, 175, 0.2)',
            color: isPositive
              ? 'var(--accent-success)'
              : isNegative
              ? 'var(--accent-danger)'
              : 'var(--text-tertiary)',
          }}
        >
          {isPositive && <TrendingUp className="w-3 h-3" />}
          {isNegative && <TrendingDown className="w-3 h-3" />}
          <span className="text-xs font-semibold">
            {Math.abs(change).toFixed(1)}%
          </span>
        </motion.div>
      )}

      {/* Hover Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none"
        style={{
          boxShadow: `0 0 20px ${accentColors[accentColor]}40`,
        }}
        transition={{ duration: 0.2 }}
      />
    </motion.div>
  )
}

// Compact version for smaller spaces
export function CompactStatCard({
  icon: Icon,
  label,
  value,
  unit = '',
  prefix = '',
  trend,
  accentColor = 'primary',
}: {
  icon: LucideIcon
  label: string
  value: number
  unit?: string
  prefix?: string
  trend?: 'up' | 'down'
  accentColor?: 'primary' | 'success' | 'warning' | 'danger'
}) {
  const accentColors = {
    primary: '#6366F1',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  }

  return (
    <motion.div
      whileHover={{ y: -1 }}
      className="glass-card rounded-lg p-4 border-l-3"
      style={{
        borderLeftColor: accentColors[accentColor],
        borderLeftWidth: '3px',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-premium-label" style={{ color: 'var(--text-quaternary)' }}>
          {label}
        </span>
        {trend && (
          trend === 'up' ? (
            <TrendingUp className="w-3 h-3" style={{ color: accentColors.success }} />
          ) : (
            <TrendingDown className="w-3 h-3" style={{ color: accentColors.danger }} />
          )
        )}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-premium-metric-md" style={{ color: 'var(--text-primary)' }}>
          {prefix}
          <CountUp end={value} duration={1.2} decimals={value % 1 !== 0 ? 1 : 0} preserveValue />
          {unit}
        </span>
      </div>
    </motion.div>
  )
}
