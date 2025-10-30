'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface KPI {
  id: string
  name: string
  value: number
  unit: string
  suffix: string
  change: number
  changeLabel: string
  trend: number[]
  status: 'excellent' | 'good' | 'warning' | 'critical'
  description: string
  metadata?: any
}

interface ExecutiveSummaryProps {
  isLoading?: boolean
  queryParams?: string
}

export function ExecutiveSummary({ isLoading = false, queryParams = '' }: ExecutiveSummaryProps) {
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [queryParams])

  const fetchData = async () => {
    try {
      setLoading(true)
      const url = queryParams
        ? `/api/bi-dashboard/executive-summary?${queryParams}`
        : '/api/bi-dashboard/executive-summary'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch data')

      const result = await response.json()
      if (result.success) {
        setKpis(result.data.kpis)
      } else {
        throw new Error(result.error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              padding: '20px',
              borderRadius: '12px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-primary)',
              minHeight: '160px',
            }}
          >
            <div className="animate-pulse">
              <div style={{ height: '20px', background: 'var(--bg-tertiary)', borderRadius: '4px', marginBottom: '8px' }} />
              <div style={{ height: '32px', background: 'var(--bg-tertiary)', borderRadius: '4px', marginBottom: '16px' }} />
              <div style={{ height: '40px', background: 'var(--bg-tertiary)', borderRadius: '4px' }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div
        style={{
          padding: '24px',
          borderRadius: '12px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
        }}
      >
        <div className="flex items-center" style={{ gap: '12px' }}>
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-premium-body" style={{ color: 'var(--text-primary)' }}>
            {error}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
      {kpis.map((kpi, index) => (
        <KPICard key={kpi.id} kpi={kpi} index={index} />
      ))}
    </div>
  )
}

interface KPICardProps {
  kpi: KPI
  index: number
}

function KPICard({ kpi, index }: KPICardProps) {
  const statusColors = {
    excellent: {
      bg: 'rgba(16, 185, 129, 0.08)',
      border: 'rgba(16, 185, 129, 0.3)',
      text: '#10B981',
      glow: 'rgba(16, 185, 129, 0.2)',
    },
    good: {
      bg: 'rgba(59, 130, 246, 0.08)',
      border: 'rgba(59, 130, 246, 0.3)',
      text: '#3B82F6',
      glow: 'rgba(59, 130, 246, 0.2)',
    },
    warning: {
      bg: 'rgba(245, 158, 11, 0.08)',
      border: 'rgba(245, 158, 11, 0.3)',
      text: '#F59E0B',
      glow: 'rgba(245, 158, 11, 0.2)',
    },
    critical: {
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.3)',
      text: '#EF4444',
      glow: 'rgba(239, 68, 68, 0.2)',
    },
  }

  const colors = statusColors[kpi.status]
  const isPositive = kpi.change < 0 // For NPA and Credit Cost, lower is better
  const isImproving =
    (kpi.id === 'npa_rate' || kpi.id === 'credit_cost') ? kpi.change < 0 : kpi.change > 0

  // Prepare sparkline data
  const sparklineData = kpi.trend.map((value, i) => ({ index: i, value }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1, ease: [0.4, 0, 0.2, 1] }}
      style={{
        padding: '20px',
        borderRadius: '12px',
        background: 'var(--bg-secondary)',
        border: `1px solid ${colors.border}`,
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 0 24px ${colors.glow}`
        e.currentTarget.style.borderColor = colors.text
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = colors.border
      }}
    >
      {/* Status indicator dot */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: colors.text,
          boxShadow: `0 0 8px ${colors.glow}`,
        }}
      />

      {/* KPI Header */}
      <div style={{ marginBottom: '16px' }}>
        <p
          className="text-premium-overline"
          style={{
            color: 'var(--text-quaternary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '8px',
          }}
        >
          {kpi.name}
        </p>

        {/* Main Value */}
        <div className="flex items-baseline" style={{ gap: '8px' }}>
          <h2
            className="text-premium-metric-lg"
            style={{
              color: colors.text,
              fontWeight: '700',
              letterSpacing: '-0.04em',
            }}
          >
            {kpi.unit}{kpi.value.toLocaleString()}
          </h2>
          {kpi.suffix && (
            <span className="text-premium-body" style={{ color: 'var(--text-tertiary)' }}>
              {kpi.suffix}
            </span>
          )}
        </div>

        {/* Change Indicator */}
        <div className="flex items-center" style={{ gap: '6px', marginTop: '8px' }}>
          {isImproving ? (
            <TrendingUp size={14} style={{ color: '#10B981' }} />
          ) : (
            <TrendingDown size={14} style={{ color: '#EF4444' }} />
          )}
          <span
            className="text-premium-caption"
            style={{
              color: isImproving ? '#10B981' : '#EF4444',
              fontWeight: '600',
            }}
          >
            {Math.abs(kpi.change).toFixed(2)}%
          </span>
          <span className="text-premium-caption" style={{ color: 'var(--text-quaternary)' }}>
            {kpi.changeLabel}
          </span>
        </div>
      </div>

      {/* Sparkline Chart */}
      <div style={{ height: '40px', marginTop: '12px', opacity: 0.8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparklineData}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={colors.text}
              strokeWidth={2}
              dot={false}
              animationDuration={1000}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Description */}
      <p
        className="text-premium-caption"
        style={{
          color: 'var(--text-tertiary)',
          marginTop: '12px',
          lineHeight: '1.4',
        }}
      >
        {kpi.description}
      </p>
    </motion.div>
  )
}
