'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { AnimatedBackground } from '@/components/ui/animated-background'

interface CommandCenterLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  insights?: React.ReactNode
}

export function CommandCenterLayout({
  children,
  sidebar,
  insights
}: CommandCenterLayoutProps) {
  return (
    <div className="command-grid bg-background text-foreground relative">
      <AnimatedBackground />
      {/* Left Panel - AI Sidebar */}
      <motion.aside
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="h-screen overflow-hidden border-r border-border bg-sidebar"
      >
        <div className="h-full custom-scrollbar overflow-y-auto">
          {sidebar || <DefaultSidebar />}
        </div>
      </motion.aside>

      {/* Center Canvas - Dynamic Content */}
      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        className="h-screen overflow-y-auto custom-scrollbar bg-background"
      >
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </motion.main>

      {/* Right Panel - Live Insights */}
      <motion.aside
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="h-screen overflow-hidden border-l border-border bg-card hidden xl:block"
      >
        <div className="h-full custom-scrollbar overflow-y-auto">
          {insights || <DefaultInsights />}
        </div>
      </motion.aside>
    </div>
  )
}

// Default Sidebar Placeholder
function DefaultSidebar() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg gradient-ai flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold">AI Assistant</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Your intelligent credit risk companion
        </p>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Quick Actions
        </p>
        <div className="space-y-2">
          {[
            'Analyze portfolio risk',
            'Show top NPA accounts',
            'Review DPD trends',
            'Generate risk report'
          ].map((action, i) => (
            <button
              key={i}
              className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-sidebar-accent transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Default Insights Placeholder
function DefaultInsights() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Live Insights</h2>
        <p className="text-sm text-muted-foreground">
          Real-time risk monitoring
        </p>
      </div>

      <div className="h-px bg-border" />

      <div className="space-y-4">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Recent Alerts
        </p>
        <div className="space-y-3">
          {[
            { type: 'warning', message: 'High-risk loan detected', time: '2m ago' },
            { type: 'info', message: 'DPD threshold crossed', time: '15m ago' },
            { type: 'success', message: 'Recovery completed', time: '1h ago' }
          ].map((alert, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg border ${
                alert.type === 'warning' ? 'bg-amber-950/20 border-amber-900/30' :
                alert.type === 'info' ? 'bg-blue-950/20 border-blue-900/30' :
                'bg-emerald-950/20 border-emerald-900/30'
              }`}
            >
              <p className="text-sm font-medium">{alert.message}</p>
              <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
