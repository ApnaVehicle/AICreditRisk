'use client'

import { useState, useEffect, useCallback } from 'react'

interface StreamConfig {
  interval: number // milliseconds
  enabled: boolean
}

export function useRealtimeStream<T>(
  fetchFn: () => Promise<T>,
  config: StreamConfig = { interval: 5000, enabled: true }
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const result = await fetchFn()
      setData(result)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [fetchFn])

  useEffect(() => {
    if (!config.enabled) return

    // Initial fetch
    fetchData()

    // Set up polling
    const intervalId = setInterval(fetchData, config.interval)

    return () => clearInterval(intervalId)
  }, [fetchData, config.enabled, config.interval])

  return { data, loading, error, lastUpdate, refetch: fetchData }
}

// Simulate random metric changes for demo
export function generateRealtimeMetricUpdate(baseValue: number, volatility: number = 0.05) {
  const change = (Math.random() - 0.5) * 2 * volatility * baseValue
  return Math.max(0, baseValue + change)
}

// Generate random alerts
const ALERT_TEMPLATES = [
  { type: 'danger', title: 'High Risk Alert', message: 'Loan #LN-{id} exceeded 90 DPD threshold' },
  { type: 'warning', title: 'Portfolio Risk', message: '{sector} sector concentration at {pct}%' },
  { type: 'info', title: 'Risk Assessment', message: '{count} loans pending risk review' },
  { type: 'success', title: 'Recovery', message: 'Customer C-{id} cleared outstanding' },
  { type: 'warning', title: 'DPD Alert', message: 'Loan #LN-{id} entered DPD 60+ category' },
  { type: 'danger', title: 'NPA Warning', message: 'Loan #LN-{id} classified as NPA' },
] as const

const SECTORS = ['Manufacturing', 'Retail', 'Services', 'Agriculture', 'Technology']

export function generateRandomAlert() {
  const template = ALERT_TEMPLATES[Math.floor(Math.random() * ALERT_TEMPLATES.length)]
  const id = Math.floor(Math.random() * 9000) + 1000
  const sector = SECTORS[Math.floor(Math.random() * SECTORS.length)]
  const pct = Math.floor(Math.random() * 15) + 20

  let message = template.message
    .replace('{id}', id.toString())
    .replace('{sector}', sector)
    .replace('{pct}', pct.toString())
    .replace('{count}', (Math.floor(Math.random() * 20) + 5).toString())

  return {
    id: `alert-${Date.now()}-${Math.random()}`,
    type: template.type,
    title: template.title,
    message,
    time: 'Just now',
    isNew: true
  }
}

export function timeAgo(date: Date | null): string {
  if (!date) return 'Never'

  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
