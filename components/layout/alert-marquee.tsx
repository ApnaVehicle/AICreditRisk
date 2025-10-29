'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, ExternalLink } from 'lucide-react'
import { useCriticalAlerts, Alert } from '@/lib/hooks/use-alerts'
import Link from 'next/link'

interface AlertMarqueeProps {
  onAlertClick?: (loanId: string | null) => void
}

export function AlertMarquee({ onAlertClick }: AlertMarqueeProps) {
  const { alerts, loading, dismissAlert } = useCriticalAlerts()
  const [enrichedAlerts, setEnrichedAlerts] = useState<Alert[]>([])
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(false)

  // Fetch AI summaries for alerts
  useEffect(() => {
    if (alerts.length === 0) return

    const fetchSummaries = async () => {
      setIsLoadingSummaries(true)
      try {
        const response = await fetch('/api/alerts/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ alerts })
        })

        if (response.ok) {
          const data = await response.json()
          setEnrichedAlerts(data.alerts || alerts)
        } else {
          setEnrichedAlerts(alerts)
        }
      } catch (error) {
        console.error('Failed to fetch alert summaries:', error)
        setEnrichedAlerts(alerts)
      } finally {
        setIsLoadingSummaries(false)
      }
    }

    fetchSummaries()
  }, [alerts])

  // Don't show anything if no critical alerts
  if (!loading && enrichedAlerts.length === 0) {
    return null
  }

  // Show loading state briefly
  if (loading && enrichedAlerts.length === 0) {
    return null
  }

  // Duplicate alerts for seamless loop
  const displayAlerts = [...enrichedAlerts, ...enrichedAlerts]

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="alert-marquee-container"
      style={{
        position: 'fixed',
        top: '64px',
        left: 0,
        right: 0,
        zIndex: 999,
        background: 'rgba(17, 24, 39, 0.85)',
        backdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        borderLeft: '4px solid #F59E0B',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
        overflow: 'hidden',
      }}
    >
      <div className="flex items-center" style={{ height: '40px' }}>
        {/* Alert Count Badge */}
        <div
          className="flex items-center gap-2 px-4 border-r"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.08)',
            flexShrink: 0,
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <AlertTriangle className="h-4 w-4" style={{ color: '#F59E0B' }} />
          </motion.div>
          <span className="text-xs font-semibold" style={{ color: '#F9FAFB' }}>
            {enrichedAlerts.length} Critical Alert{enrichedAlerts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Scrolling Alerts */}
        <div
          className="flex-1 overflow-hidden"
          style={{ position: 'relative' }}
        >
          <div className="marquee-content" style={{ display: 'flex', gap: '48px' }}>
            {displayAlerts.map((alert, index) => (
              <AlertItem
                key={`${alert.alert_id}-${index}`}
                alert={alert}
                onDismiss={() => dismissAlert(alert.alert_id)}
                onClick={() => onAlertClick?.(alert.loan_id)}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

interface AlertItemProps {
  alert: Alert
  onDismiss: () => void
  onClick: () => void
}

function AlertItem({ alert, onDismiss, onClick }: AlertItemProps) {
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDismiss()
  }

  const loanId = alert.loan?.loan_id || 'Unknown'
  const amount = alert.loan?.outstanding_amount
    ? `₹${(alert.loan.outstanding_amount / 100000).toFixed(1)}L`
    : ''

  return (
    <div
      className="flex items-center gap-3"
      style={{
        flexShrink: 0,
        cursor: 'pointer',
        padding: '0 16px',
      }}
    >
      {/* Alert Content */}
      <button
        onClick={onClick}
        className="flex items-center gap-2 transition-all"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: '#F9FAFB',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#FCD34D'
          e.currentTarget.style.textShadow = '0 0 8px rgba(245, 158, 11, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#F9FAFB'
          e.currentTarget.style.textShadow = 'none'
        }}
      >
        <span className="text-xs font-medium whitespace-nowrap">
          {alert.summary || `Loan ${loanId}: ${alert.message} ${amount}`}
        </span>
        <ExternalLink className="h-3 w-3" />
      </button>

      {/* Dismiss Button */}
      <button
        onClick={handleDismiss}
        className="flex items-center justify-center rounded transition-all"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          cursor: 'pointer',
          padding: '4px',
          width: '20px',
          height: '20px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'
          e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
        }}
        title="Dismiss alert"
      >
        <X className="h-3 w-3" style={{ color: '#F9FAFB' }} />
      </button>
    </div>
  )
}
