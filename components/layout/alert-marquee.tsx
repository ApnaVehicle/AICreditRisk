'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, ExternalLink } from 'lucide-react'
import { useCriticalAlerts, Alert } from '@/lib/hooks/use-alerts'
import Link from 'next/link'

interface AlertMarqueeProps {
  onAlertClick?: (alertId: string) => void
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
        background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.95) 0%, rgba(220, 38, 38, 0.95) 100%)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
      }}
    >
      <div className="flex items-center" style={{ height: '40px' }}>
        {/* Alert Count Badge */}
        <div
          className="flex items-center gap-2 px-4 border-r"
          style={{
            borderColor: 'rgba(255, 255, 255, 0.2)',
            flexShrink: 0,
          }}
        >
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <AlertTriangle className="h-4 w-4 text-white" />
          </motion.div>
          <span className="text-xs font-semibold text-white">
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
                key={`${alert.id}-${index}`}
                alert={alert}
                onDismiss={() => dismissAlert(alert.id)}
                onClick={() => onAlertClick?.(alert.id)}
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
        className="flex items-center gap-2 text-white hover:text-white/90 transition-colors"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
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
        className="flex items-center justify-center hover:bg-white/20 rounded transition-colors"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          width: '20px',
          height: '20px',
        }}
        title="Dismiss alert"
      >
        <X className="h-3 w-3 text-white" />
      </button>
    </div>
  )
}
