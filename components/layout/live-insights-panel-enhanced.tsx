'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info, Bell, Activity, X, Wifi, ExternalLink, Eye } from 'lucide-react'
import { useAllAlerts } from '@/lib/hooks/use-alerts'
import { useLoanModal } from '@/lib/hooks/use-loan-modal'
import { Button } from '@/components/ui/button'
import CountUp from 'react-countup'
import Link from 'next/link'

interface LiveInsightsPanelProps {
  highlightedAlertId?: string | null
}

interface Metric {
  label: string
  value: number
  previousValue: number
  change: number
  unit?: string
  format?: 'number' | 'currency' | 'percentage'
}

export function LiveInsightsPanel({ highlightedAlertId }: LiveInsightsPanelProps) {
  const { alerts, loading, dismissAlert, highlightedId } = useAllAlerts()
  const { openModal } = useLoanModal()
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isStreaming, setIsStreaming] = useState(true)

  // Fetch real-time metrics
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/analytics/enhanced-kpis')
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            const kpis = data.data

            setMetrics(prev => {
              const newMetrics = [
                {
                  label: 'NPA Rate',
                  value: kpis.npa?.grossNPARate || 0,
                  previousValue: prev[0]?.value || kpis.npa?.grossNPARate || 0,
                  change: 0,
                  unit: '%',
                  format: 'percentage' as const
                },
                {
                  label: 'Collection',
                  value: kpis.collections?.collectionEfficiency || 0,
                  previousValue: prev[1]?.value || kpis.collections?.collectionEfficiency || 0,
                  change: 0,
                  unit: '%',
                  format: 'percentage' as const
                },
                {
                  label: 'Avg Risk',
                  value: kpis.risk?.avgRiskScore || 0,
                  previousValue: prev[2]?.value || kpis.risk?.avgRiskScore || 0,
                  change: 0,
                  format: 'number' as const
                },
                {
                  label: 'Active Loans',
                  value: kpis.portfolio?.totalLoans || 0,
                  previousValue: prev[3]?.value || kpis.portfolio?.totalLoans || 0,
                  change: 0,
                  format: 'number' as const
                }
              ]

              // Calculate changes
              return newMetrics.map((metric, idx) => ({
                ...metric,
                change: prev[idx] ? parseFloat((metric.value - prev[idx].value).toFixed(2)) : 0
              }))
            })

            setLastUpdate(new Date())
          }
        }
      } catch (error) {
        console.error('Error fetching metrics:', error)
      }
    }

    fetchMetrics()

    if (isStreaming) {
      const interval = setInterval(fetchMetrics, 30000) // Refresh every 30 seconds
      return () => clearInterval(interval)
    }
  }, [isStreaming])

  const criticalAlerts = alerts.filter(a => a.priority === 'critical')
  const otherAlerts = alerts.filter(a => a.priority !== 'critical')

  const getAlertIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high':
        return <AlertTriangle className="h-4 w-4" />
      case 'medium':
        return <Bell className="h-4 w-4" />
      case 'low':
        return <Info className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getAlertStyle = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-950/40 border-red-900/50 text-red-200'
      case 'high':
        return 'bg-red-950/30 border-red-900/40 text-red-300'
      case 'medium':
        return 'bg-amber-950/30 border-amber-900/40 text-amber-300'
      case 'low':
        return 'bg-blue-950/30 border-blue-900/40 text-blue-300'
      default:
        return 'bg-gray-950/30 border-gray-900/40 text-gray-300'
    }
  }

  const timeAgo = (date: string) => {
    const now = new Date()
    const then = new Date(date)
    const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="flex h-full flex-col" style={{ background: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="flex-shrink-0 p-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Live Insights
              </h2>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{
                    scale: isStreaming ? [1, 1.2, 1] : 1,
                    opacity: isStreaming ? [1, 0.7, 1] : 0.5
                  }}
                  transition={{
                    duration: 2,
                    repeat: isStreaming ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                >
                  <Wifi className={`h-3 w-3 ${isStreaming ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                </motion.div>
                <p className="text-xs text-muted-foreground">
                  {isStreaming ? `Updated ${Math.floor((Date.now() - lastUpdate.getTime()) / 1000)}s ago` : 'Paused'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className="p-1.5 rounded-md hover:bg-accent transition-colors"
            title={isStreaming ? 'Pause updates' : 'Resume updates'}
          >
            {isStreaming ? (
              <div className="h-3 w-3 flex gap-0.5">
                <div className="w-1 h-full bg-foreground rounded-sm" />
                <div className="w-1 h-full bg-foreground rounded-sm" />
              </div>
            ) : (
              <div className="h-3 w-3 border-2 border-l-4 border-foreground rounded-sm" style={{ borderLeft: '4px solid' }} />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* Key Metrics */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Key Metrics
            </h3>
            {isStreaming && <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="premium-card"
                style={{ padding: '12px' }}
              >
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {metric.label}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                      {metric.format === 'currency' && '₹'}
                      <CountUp
                        start={metric.previousValue}
                        end={metric.value}
                        duration={1.2}
                        decimals={metric.format === 'number' && metric.label === 'Active Loans' ? 0 : 1}
                        separator={metric.format === 'currency' ? ',' : ''}
                      />
                      {metric.unit}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Critical Alerts Section */}
        {criticalAlerts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-red-400" />
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Critical Alerts
              </h3>
              <span className="text-xs font-semibold text-red-400">
                {criticalAlerts.length}
              </span>
            </div>

            <div className="space-y-2">
              <AnimatePresence>
                {criticalAlerts.map(alert => (
                  <AlertCard
                    key={alert.alert_id}
                    alert={alert}
                    onDismiss={() => dismissAlert(alert.alert_id)}
                    onViewLoan={openModal}
                    getAlertIcon={getAlertIcon}
                    getAlertStyle={getAlertStyle}
                    timeAgo={timeAgo}
                    isHighlighted={highlightedAlertId === alert.alert_id || highlightedId === alert.alert_id}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Other Alerts */}
        {otherAlerts.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recent Alerts
            </h3>

            <div className="space-y-2">
              <AnimatePresence>
                {otherAlerts.map(alert => (
                  <AlertCard
                    key={alert.alert_id}
                    alert={alert}
                    onDismiss={() => dismissAlert(alert.alert_id)}
                    onViewLoan={openModal}
                    getAlertIcon={getAlertIcon}
                    getAlertStyle={getAlertStyle}
                    timeAgo={timeAgo}
                    isHighlighted={highlightedAlertId === alert.alert_id || highlightedId === alert.alert_id}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* No Alerts State */}
        {!loading && alerts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              All clear! No active alerts.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your portfolio is in good health
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

interface AlertCardProps {
  alert: any
  onDismiss: () => void
  onViewLoan: (loanId: string) => void
  getAlertIcon: (priority: string) => React.ReactNode
  getAlertStyle: (priority: string) => string
  timeAgo: (date: string) => string
  isHighlighted?: boolean
}

function AlertCard({ alert, onDismiss, onViewLoan, getAlertIcon, getAlertStyle, timeAgo, isHighlighted }: AlertCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{
        opacity: 1,
        x: 0,
        scale: isHighlighted ? 1.02 : 1,
        boxShadow: isHighlighted
          ? '0 0 0 2px rgba(99, 102, 241, 0.5)'
          : '0 0 0 0px rgba(99, 102, 241, 0)'
      }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={`rounded-lg border p-3 ${getAlertStyle(alert.priority)}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">
          {getAlertIcon(alert.priority)}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold leading-tight">
              {alert.message}
            </p>
            <button
              onClick={onDismiss}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
              title="Dismiss"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          {alert.summary && (
            <p className="text-xs opacity-80 leading-relaxed">
              {alert.summary}
            </p>
          )}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] opacity-60">
              {timeAgo(alert.created_at)}
            </span>
            {alert.loan_id && (
              <button
                onClick={() => onViewLoan(alert.loan_id)}
                className="text-[10px] font-medium hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-none"
                style={{ color: 'var(--accent-primary)' }}
              >
                View Loan
                <Eye className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
