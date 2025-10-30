'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Info } from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface PARDataset {
  id: string
  name: string
  description: string
  color: string
  data: number[]
  current: number
  change: number
}

interface PARCascadeProps {
  isLoading?: boolean
  queryParams?: string
}

export function PARCascade({ isLoading = false, queryParams = '' }: PARCascadeProps) {
  const [parData, setParData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [queryParams])

  const fetchData = async () => {
    try {
      setLoading(true)
      const url = queryParams
        ? `/api/bi-dashboard/par-cascade?${queryParams}`
        : '/api/bi-dashboard/par-cascade'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch data')

      const result = await response.json()
      if (result.success) {
        setParData(result.data)
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
      <div
        style={{
          padding: '28px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <div className="animate-pulse">
          <div style={{ height: '24px', background: 'var(--bg-tertiary)', borderRadius: '4px', marginBottom: '16px', width: '200px' }} />
          <div style={{ height: '300px', background: 'var(--bg-tertiary)', borderRadius: '8px' }} />
        </div>
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

  if (!parData) return null

  // Transform data for Recharts
  const chartData = parData.parSeries.labels.map((label: string, index: number) => {
    const point: any = { month: label }
    parData.parSeries.datasets.forEach((dataset: PARDataset) => {
      point[dataset.id] = dataset.data[index]
    })
    return point
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      style={{
        padding: '32px',
        borderRadius: '12px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
          <h2 className="text-premium-h2" style={{ color: 'var(--text-primary)' }}>
            Portfolio at Risk (PAR) Cascade
          </h2>
          <div
            className="flex items-center"
            style={{
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'var(--bg-tertiary)',
            }}
          >
            <Info size={14} style={{ color: 'var(--text-quaternary)' }} />
            <span className="text-premium-caption" style={{ color: 'var(--text-secondary)' }}>
              6-month trend
            </span>
          </div>
        </div>
        <p className="text-premium-body" style={{ color: 'var(--text-tertiary)' }}>
          Delinquency progression across DPD buckets
        </p>
      </div>

      {/* Current PAR Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        {parData.parSeries.datasets.map((dataset: PARDataset) => (
          <div
            key={dataset.id}
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: `2px solid ${dataset.color}`,
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = `0 0 16px ${dataset.color}40`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <p
              className="text-premium-caption"
              style={{
                color: 'var(--text-quaternary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {dataset.name}
            </p>
            <p
              className="text-premium-h3"
              style={{
                color: dataset.color,
                fontWeight: '700',
                fontSize: '20px',
              }}
            >
              {dataset.current.toFixed(2)}%
            </p>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
              {dataset.description}
            </p>
          </div>
        ))}
      </div>

      {/* Area Chart */}
      <div style={{ height: '350px', marginTop: '24px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              {parData.parSeries.datasets.map((dataset: PARDataset) => (
                <linearGradient key={dataset.id} id={`gradient-${dataset.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={dataset.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={dataset.color} stopOpacity={0.05} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.3} />
            <XAxis
              dataKey="month"
              stroke="var(--text-quaternary)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'var(--text-tertiary)' }}
            />
            <YAxis
              stroke="var(--text-quaternary)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'var(--text-tertiary)' }}
              label={{
                value: 'PAR %',
                angle: -90,
                position: 'insideLeft',
                style: { fill: 'var(--text-secondary)', fontSize: '12px' },
              }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                borderRadius: '8px',
                padding: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              }}
              labelStyle={{ color: 'var(--text-primary)', fontWeight: '600', marginBottom: '8px' }}
              itemStyle={{ color: 'var(--text-secondary)', fontSize: '13px' }}
              formatter={(value: any, name: string) => {
                const dataset = parData.parSeries.datasets.find((d: PARDataset) => d.id === name)
                return [`${Number(value).toFixed(2)}%`, dataset?.name || name]
              }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
              }}
              iconType="circle"
              formatter={(value: string) => {
                const dataset = parData.parSeries.datasets.find((d: PARDataset) => d.id === value)
                return (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {dataset?.name || value}
                  </span>
                )
              }}
            />
            {parData.parSeries.datasets.slice().reverse().map((dataset: PARDataset) => (
              <Area
                key={dataset.id}
                type="monotone"
                dataKey={dataset.id}
                stroke={dataset.color}
                strokeWidth={2}
                fill={`url(#gradient-${dataset.id})`}
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Cascade Flow Summary */}
      <div
        style={{
          marginTop: '24px',
          padding: '20px',
          borderRadius: '8px',
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <p
          className="text-premium-overline"
          style={{
            color: 'var(--text-quaternary)',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Delinquency Buckets
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <p className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
              Healthy Portfolio
            </p>
            <p className="text-premium-h3" style={{ color: '#10B981', marginTop: '4px' }}>
              {parData.cascadeFlow.healthy.percentage.toFixed(2)}%
            </p>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)' }}>
              {parData.cascadeFlow.healthy.count} loans with DPD = 0
            </p>
          </div>
          <div>
            <p className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
              Early Stage (1-15 DPD)
            </p>
            <p className="text-premium-h3" style={{ color: '#FBBF24', marginTop: '4px' }}>
              {parData.cascadeFlow.early.percentage.toFixed(2)}%
            </p>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)' }}>
              {parData.cascadeFlow.early.count} loans
            </p>
          </div>
          <div>
            <p className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
              Critical Stage (90+ DPD)
            </p>
            <p className="text-premium-h3" style={{ color: '#DC2626', marginTop: '4px' }}>
              {parData.cascadeFlow.critical.percentage.toFixed(2)}%
            </p>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)' }}>
              {parData.cascadeFlow.critical.count} loans (Pre-NPA)
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
