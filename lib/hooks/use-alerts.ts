'use client'

import { useState, useEffect, useCallback } from 'react'

export interface Alert {
  id: string
  loan_id: string
  alert_type: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  message: string
  created_at: string
  status: string
  loan?: {
    loan_id: string
    customer_id: string
    outstanding_amount: number
    status: string
  }
  summary?: string
  insight?: string
  recommendation?: string
}

interface UseAlertsOptions {
  priority?: 'critical' | 'high' | 'medium' | 'low'
  refreshInterval?: number // in milliseconds
  autoRefresh?: boolean
}

interface UseAlertsReturn {
  alerts: Alert[]
  loading: boolean
  error: string | null
  dismissedIds: Set<string>
  dismissAlert: (id: string) => void
  highlightedId: string | null
  highlightAlert: (id: string) => void
  clearHighlight: () => void
  refresh: () => Promise<void>
}

export function useAlerts(options: UseAlertsOptions = {}): UseAlertsReturn {
  const {
    priority,
    refreshInterval = 30000, // 30 seconds default
    autoRefresh = true
  } = options

  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  // Load dismissed IDs from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem('dismissed-alerts')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setDismissedIds(new Set(parsed))
      } catch (e) {
        console.error('Failed to parse dismissed alerts:', e)
      }
    }
  }, [])

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null)
      const params = new URLSearchParams()
      if (priority) params.append('priority', priority)
      params.append('status', 'active')

      const response = await fetch(`/api/alerts?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Failed to fetch alerts')
      }

      const data = await response.json()

      // Filter out dismissed alerts
      const filtered = data.alerts?.filter(
        (alert: Alert) => !dismissedIds.has(alert.id)
      ) || []

      setAlerts(filtered)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching alerts:', err)
    } finally {
      setLoading(false)
    }
  }, [priority, dismissedIds])

  const refresh = useCallback(async () => {
    setLoading(true)
    await fetchAlerts()
  }, [fetchAlerts])

  // Initial fetch
  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchAlerts, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchAlerts])

  const dismissAlert = useCallback((id: string) => {
    setDismissedIds(prev => {
      const updated = new Set(prev)
      updated.add(id)

      // Persist to sessionStorage
      sessionStorage.setItem('dismissed-alerts', JSON.stringify([...updated]))

      return updated
    })

    // Remove from current alerts
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }, [])

  const highlightAlert = useCallback((id: string) => {
    setHighlightedId(id)

    // Auto-clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedId(null)
    }, 3000)
  }, [])

  const clearHighlight = useCallback(() => {
    setHighlightedId(null)
  }, [])

  return {
    alerts,
    loading,
    error,
    dismissedIds,
    dismissAlert,
    highlightedId,
    highlightAlert,
    clearHighlight,
    refresh
  }
}

// Hook specifically for critical alerts (marquee)
export function useCriticalAlerts() {
  return useAlerts({
    priority: 'critical',
    refreshInterval: 30000,
    autoRefresh: true
  })
}

// Hook for all alerts (live insights panel)
export function useAllAlerts() {
  return useAlerts({
    refreshInterval: 30000,
    autoRefresh: true
  })
}
