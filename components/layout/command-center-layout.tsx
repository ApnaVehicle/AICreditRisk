'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { AnimatedBackground } from '@/components/ui/animated-background'
import { PremiumNav } from './premium-nav'
import { AlertMarquee } from './alert-marquee'
import { useLoanModal } from '@/lib/hooks/use-loan-modal'

interface CommandCenterLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  insights?: React.ReactNode
  userName?: string
  appName?: string
}

export function CommandCenterLayout({
  children,
  sidebar,
  insights,
  userName,
  appName
}: CommandCenterLayoutProps) {
  const [highlightedAlertId, setHighlightedAlertId] = useState<string | null>(null)
  const { openModal } = useLoanModal()

  const handleAlertClick = (loanId: string | null) => {
    // Open the loan detail modal if loanId is provided
    if (loanId) {
      openModal(loanId)
    }
  }

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-primary)' }}>
      <AnimatedBackground />

      {/* Premium Navigation Bar */}
      <PremiumNav userName={userName} appName={appName} />

      {/* Alert Marquee Banner */}
      <AlertMarquee onAlertClick={handleAlertClick} />

      {/* Premium 3-Column Grid: 300px (Insights) | 3fr (Dashboard 60%) | 2fr (Argus 40%) */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: '300px 3fr 2fr',
          height: '100vh',
          paddingTop: '104px',
        }}
      >
        {/* Left Panel - Live Insights (300px compact) */}
        <motion.aside
          id="live-insights-panel"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="glass-sidebar overflow-hidden hidden xl:block"
          style={{
            padding: '0',
            height: 'calc(100vh - 104px)',
          }}
        >
          {React.isValidElement(insights) ? React.cloneElement(insights as React.ReactElement<any>, {
            highlightedAlertId
          }) : <DefaultInsights />}
        </motion.aside>

        {/* Center Canvas - Main Dashboard (60% of flexible space) */}
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-y-auto custom-scrollbar"
          style={{
            background: 'var(--bg-primary)',
            height: 'calc(100vh - 104px)',
          }}
        >
          <div
            style={{
              maxWidth: '1230px',
              margin: '0 auto',
              padding: '32px 24px',
            }}
          >
            {children}
          </div>
        </motion.main>

        {/* Right Panel - Argus AI Chat (40% of flexible space) */}
        <motion.aside
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="glass-sidebar overflow-hidden"
          style={{
            padding: '24px',
            height: 'calc(100vh - 104px)',
          }}
        >
          <div className="h-full custom-scrollbar overflow-y-auto">
            {sidebar || <DefaultSidebar />}
          </div>
        </motion.aside>
      </div>
    </div>
  )
}

// Default Sidebar Placeholder
function DefaultSidebar() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="flex items-center" style={{ gap: '12px' }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
            }}
          >
            <svg className="text-white" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h1 className="text-premium-h3" style={{ color: 'var(--text-primary)' }}>
            Argus
          </h1>
        </div>
        <p className="text-premium-label" style={{ color: 'var(--text-quaternary)' }}>
          Risk Intelligence AI
        </p>
      </div>

      <div
        style={{
          height: '1px',
          background: 'var(--border-primary)',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p
          className="text-premium-overline"
          style={{
            color: 'var(--text-quaternary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Quick Actions
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            'Analyze portfolio risk',
            'Show top NPA accounts',
            'Review DPD trends',
            'Generate risk report'
          ].map((action, i) => (
            <button
              key={i}
              className="text-premium-body"
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px',
                borderRadius: '8px',
                background: 'transparent',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)'
                e.currentTarget.style.borderColor = 'var(--border-hover)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'var(--border-primary)'
              }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h2 className="text-premium-h3" style={{ color: 'var(--text-primary)' }}>
          Live Insights
        </h2>
        <p className="text-premium-label" style={{ color: 'var(--text-quaternary)' }}>
          Real-time risk monitoring
        </p>
      </div>

      <div
        style={{
          height: '1px',
          background: 'var(--border-primary)',
        }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p
          className="text-premium-overline"
          style={{
            color: 'var(--text-quaternary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Recent Alerts
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            { type: 'warning', message: 'High-risk loan detected', time: '2m ago', color: '#F59E0B' },
            { type: 'info', message: 'DPD threshold crossed', time: '15m ago', color: '#3B82F6' },
            { type: 'success', message: 'Recovery completed', time: '1h ago', color: '#10B981' }
          ].map((alert, i) => (
            <div
              key={i}
              style={{
                padding: '12px',
                borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderLeftWidth: '3px',
                borderLeftColor: alert.color,
                transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <p className="text-premium-body" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                {alert.message}
              </p>
              <p className="text-premium-caption" style={{ color: 'var(--text-quaternary)', marginTop: '4px' }}>
                {alert.time}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
