'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, Info, Bell, Activity, X, Wifi } from 'lucide-react'
import { MiniProgressRing } from '@/components/dashboard/animated-progress-ring'
import { Button } from '@/components/ui/button'
import CountUp from 'react-countup'
import { generateRandomAlert, generateRealtimeMetricUpdate, timeAgo } from '@/lib/hooks/use-realtime-stream'

interface Alert {
  id: string
  type: 'warning' | 'danger' | 'info' | 'success'
  title: string
  message: string
  time: string
  isNew?: boolean
}

interface Metric {
  label: string
  value: number
  previousValue: number
  change: number
  unit?: string
  format?: 'number' | 'currency' | 'percentage'
}

export function LiveInsightsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'danger',
      title: 'High Risk Alert',
      message: 'Loan #LN-8923 exceeded 90 DPD threshold',
      time: '2m ago',
      isNew: true
    },
    {
      id: '2',
      type: 'warning',
      title: 'Portfolio Risk',
      message: 'Manufacturing sector concentration at 28%',
      time: '15m ago',
    },
    {
      id: '3',
      type: 'info',
      title: 'Risk Assessment',
      message: '15 loans pending risk review',
      time: '1h ago',
    }
  ])

  const [metrics, setMetrics] = useState<Metric[]>([
    { label: 'NPA Rate', value: 4.2, previousValue: 4.2, change: 0, unit: '%', format: 'percentage' },
    { label: 'Collection Efficiency', value: 87.5, previousValue: 87.5, change: 0, unit: '%', format: 'percentage' },
    { label: 'Avg Risk Score', value: 42.8, previousValue: 42.8, change: 0, format: 'number' },
    { label: 'Active Loans', value: 847, previousValue: 847, change: 0, format: 'number' }
  ])

  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isStreaming, setIsStreaming] = useState(true)

  // Simulate real-time metric updates
  useEffect(() => {
    if (!isStreaming) return

    const metricInterval = setInterval(() => {
      setMetrics(prev => prev.map(metric => {
        const newValue = generateRealtimeMetricUpdate(
          metric.value,
          metric.format === 'number' && metric.label === 'Active Loans' ? 0.02 : 0.008
        )
        const change = newValue - metric.value

        return {
          ...metric,
          previousValue: metric.value,
          value: newValue,
          change: parseFloat(change.toFixed(2))
        }
      }))
      setLastUpdate(new Date())
    }, 8000) // Update every 8 seconds

    return () => clearInterval(metricInterval)
  }, [isStreaming])

  // Simulate real-time alerts
  useEffect(() => {
    if (!isStreaming) return

    const alertInterval = setInterval(() => {
      // Random chance to add new alert
      if (Math.random() > 0.6) {
        const newAlert = generateRandomAlert()
        setAlerts(prev => {
          // Mark old alerts as not new
          const updated = prev.map(a => ({ ...a, isNew: false }))
          // Keep max 6 alerts
          return [newAlert, ...updated].slice(0, 6)
        })
      }

      // Update time labels
      setAlerts(prev => prev.map((alert, idx) => ({
        ...alert,
        time: idx === 0 && alert.isNew ? 'Just now' : alert.time
      })))
    }, 12000) // Check every 12 seconds

    return () => clearInterval(alertInterval)
  }, [isStreaming])

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'danger':
        return <AlertTriangle className="h-4 w-4" />
      case 'warning':
        return <Bell className="h-4 w-4" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'danger':
        return 'bg-red-950/30 border-red-900/40 text-red-300'
      case 'warning':
        return 'bg-amber-950/30 border-amber-900/40 text-amber-300'
      case 'success':
        return 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300'
      default:
        return 'bg-blue-950/30 border-blue-900/40 text-blue-300'
    }
  }

  return (
    <div className="flex h-full flex-col bg-card">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <h2 className="text-sm font-semibold">Live Insights</h2>
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
                  {isStreaming ? `Updated ${timeAgo(lastUpdate)}` : 'Paused'}
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
            <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric, i) => (
              <motion.div
                key={metric.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  ...(metric.change !== 0 && {
                    boxShadow: [
                      '0 0 0 0 rgba(99, 102, 241, 0)',
                      '0 0 0 4px rgba(99, 102, 241, 0.3)',
                      '0 0 0 0 rgba(99, 102, 241, 0)'
                    ]
                  })
                }}
                transition={{
                  delay: i * 0.1,
                  boxShadow: { duration: 0.6 }
                }}
                className="glass-dark rounded-lg p-3 hover-lift"
              >
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                    {metric.label}
                  </p>
                  <div className="flex items-baseline justify-between">
                    <motion.span
                      key={metric.value}
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 0.3 }}
                      className="text-lg font-bold tabular-nums"
                    >
                      {metric.format === 'currency' && '₹'}
                      <CountUp
                        start={metric.previousValue}
                        end={metric.value}
                        duration={1.2}
                        decimals={metric.format === 'number' && metric.label === 'Active Loans' ? 0 : 1}
                        separator={metric.format === 'currency' ? ',' : ''}
                      />
                      {metric.unit}
                    </motion.span>
                  </div>
                  <AnimatePresence mode="wait">
                    {metric.change !== 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1 text-xs"
                      >
                        {metric.change > 0 ? (
                          <TrendingUp className="h-3 w-3 text-red-400" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-emerald-400" />
                        )}
                        <span className={metric.change > 0 ? 'text-red-400' : 'text-emerald-400'}>
                          {metric.change > 0 ? '+' : ''}{Math.abs(metric.change).toFixed(metric.format === 'number' && metric.label === 'Active Loans' ? 0 : 2)}{metric.unit || ''}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Portfolio Health */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Portfolio Health
          </h3>

          <div className="glass-dark rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Overall Score</span>
              <span className="text-xs text-muted-foreground">Updated 5m ago</span>
            </div>
            <div className="flex justify-center">
              <MiniProgressRing value={76.5} size={80} strokeWidth={8} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Low</p>
                <p className="text-sm font-semibold text-emerald-400">68%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Medium</p>
                <p className="text-sm font-semibold text-amber-400">24%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">High</p>
                <p className="text-sm font-semibold text-red-400">8%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Alerts */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Live Alerts
            </h3>
            <span className="text-xs text-muted-foreground">
              {alerts.length} active
            </span>
          </div>

          <AnimatePresence mode="popLayout">
            {alerts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-lg border border-border p-4 text-center"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">All clear!</p>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {alerts.map((alert, i) => (
                  <motion.div
                    key={alert.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative rounded-lg border p-3 ${getAlertStyle(alert.type)} ${
                      alert.isNew ? 'alert-pulse' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 mt-0.5">
                        {getAlertIcon(alert.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-medium">{alert.title}</p>
                          <button
                            onClick={() => dismissAlert(alert.id)}
                            className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-xs opacity-90 mt-1">{alert.message}</p>
                        <p className="text-[10px] opacity-70 mt-1">{alert.time}</p>
                      </div>
                    </div>
                    {alert.isNew && (
                      <div className="absolute -top-1 -right-1">
                        <span className="flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Trending Now */}
        <div className="space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Trending Now
          </h3>

          <div className="space-y-2">
            {[
              { label: 'Most queried sector', value: 'Manufacturing' },
              { label: 'Highest DPD region', value: 'West Bengal' },
              { label: 'Top risk category', value: 'High (78 loans)' }
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="glass-dark rounded-lg p-3"
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                  {item.label}
                </p>
                <p className="text-sm font-medium">{item.value}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
