'use client'

import React from 'react'
import { motion } from 'framer-motion'
import CountUp from 'react-countup'

interface AnimatedProgressRingProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  color?: string
  label?: string
  unit?: string
  showPercentage?: boolean
  duration?: number
  className?: string
}

export function AnimatedProgressRing({
  value,
  max = 100,
  size = 140,
  strokeWidth = 10,
  color,
  label,
  unit = '%',
  showPercentage = true,
  duration = 1.5,
  className = ''
}: AnimatedProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min((value / max) * 100, 100)
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Determine color based on value if not provided
  const getColor = () => {
    if (color) return color
    if (percentage >= 80) return 'oklch(0.65 0.25 25)' // Danger
    if (percentage >= 50) return 'oklch(0.72 0.19 50)' // Warning
    return 'oklch(0.65 0.18 160)' // Success
  }

  const ringColor = getColor()

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="oklch(0.25 0.025 250)"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Animated Progress Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{
              duration,
              ease: 'easeOut',
              delay: 0.2
            }}
            style={{
              filter: `drop-shadow(0 0 8px ${ringColor}40)`
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center"
          >
            <div className="text-2xl font-bold tabular-nums">
              <CountUp
                end={showPercentage ? percentage : value}
                duration={duration}
                decimals={1}
                suffix={showPercentage ? '%' : unit}
              />
            </div>
            {label && (
              <div className="text-xs text-muted-foreground mt-1 max-w-[80px] truncate">
                {label}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// Variant for small inline gauges
export function MiniProgressRing({
  value,
  max = 100,
  size = 60,
  strokeWidth = 6,
  color,
  showValue = true
}: Omit<AnimatedProgressRingProps, 'label' | 'unit' | 'showPercentage'> & { showValue?: boolean }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min((value / max) * 100, 100)
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = () => {
    if (color) return color
    if (percentage >= 80) return 'oklch(0.65 0.25 25)'
    if (percentage >= 50) return 'oklch(0.72 0.19 50)'
    return 'oklch(0.65 0.18 160)'
  }

  const ringColor = getColor()

  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="oklch(0.25 0.025 250)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-semibold tabular-nums">
            <CountUp end={percentage} duration={1} decimals={0} suffix="%" />
          </span>
        </div>
      )}
    </div>
  )
}

// Variant for risk score visualization
export function RiskScoreRing({
  score,
  maxScore = 100,
  size = 160,
  className = ''
}: {
  score: number
  maxScore?: number
  size?: number
  className?: string
}) {
  const getRiskLevel = (score: number) => {
    if (score >= 70) return { level: 'High', color: 'oklch(0.65 0.25 25)', label: 'High Risk' }
    if (score >= 40) return { level: 'Medium', color: 'oklch(0.72 0.19 50)', label: 'Medium Risk' }
    return { level: 'Low', color: 'oklch(0.65 0.18 160)', label: 'Low Risk' }
  }

  const risk = getRiskLevel(score)

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <AnimatedProgressRing
        value={score}
        max={maxScore}
        size={size}
        color={risk.color}
        showPercentage={false}
        unit=""
      />
      <div className="mt-3 text-center">
        <div className="text-sm font-medium">{risk.label}</div>
        <div className="text-xs text-muted-foreground">Risk Score</div>
      </div>
    </div>
  )
}
