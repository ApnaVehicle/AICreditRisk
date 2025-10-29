'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Eye, Loader2 } from 'lucide-react'

interface ThinkingIndicatorProps {
  variant?: 'dots' | 'wave' | 'typing' | 'pulse'
  showText?: boolean
}

export function ThinkingIndicator({
  variant = 'wave',
  showText = true
}: ThinkingIndicatorProps) {
  return (
    <div className="flex gap-2">
      <div
        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full"
        style={{
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          boxShadow: '0 0 12px rgba(99, 102, 241, 0.3)'
        }}
      >
        <Eye className="h-4 w-4 text-white" />
      </div>
      <div className="ai-message flex items-center gap-3">
        {variant === 'dots' && <DotsIndicator />}
        {variant === 'wave' && <WaveIndicator />}
        {variant === 'typing' && <TypingIndicator />}
        {variant === 'pulse' && <PulseIndicator />}
        {showText && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-muted-foreground"
          >
            Argus is analyzing...
          </motion.span>
        )}
      </div>
    </div>
  )
}

// Simple bouncing dots
function DotsIndicator() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-primary"
          animate={{
            y: [0, -8, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Wave effect
function WaveIndicator() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-primary"
          animate={{
            height: ['8px', '20px', '8px'],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.15,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Typing indicator (like iMessage)
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2 rounded-full bg-primary/10">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="h-2 w-2 rounded-full bg-primary"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  )
}

// Pulse effect with loader icon
function PulseIndicator() {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear"
        }}
        className="relative"
      >
        <Loader2 className="h-4 w-4 text-primary" />
      </motion.div>
    </div>
  )
}
