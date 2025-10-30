'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface VintageAnalysisProps {
  isLoading?: boolean
  queryParams?: string
}

export function VintageAnalysis({ isLoading = false, queryParams = '' }: VintageAnalysisProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metric, setMetric] = useState<'defaultRate' | 'collectionRate' | 'avgDPD'>('defaultRate')

  useEffect(() => {
    fetchData()
  }, [queryParams])

  const fetchData = async () => {
    try {
      setLoading(true)
      const url = queryParams
        ? `/api/bi-dashboard/vintage-analysis?${queryParams}`
        : '/api/bi-dashboard/vintage-analysis'
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch data')

      const result = await response.json()
      if (result.success) {
        setData(result.data)
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

  if (!data) return null

  // Prepare chart data - show top 12 cohorts
  const chartData = data.cohorts.slice(-12).map((cohort: any) => ({
    vintage: cohort.vintage,
    defaultRate: cohort.defaultRate,
    collectionRate: cohort.collectionRate,
    avgDPD: cohort.avgDPD,
    loanCount: cohort.loanCount,
  }))

  const metricConfig = {
    defaultRate: {
      label: 'Default Rate',
      color: '#EF4444',
      unit: '%',
      description: 'Percentage of loans in NPA status',
    },
    collectionRate: {
      label: 'Collection Rate',
      color: '#10B981',
      unit: '%',
      description: 'Percentage of EMI collected',
    },
    avgDPD: {
      label: 'Average DPD',
      color: '#F59E0B',
      unit: ' days',
      description: 'Mean days past due',
    },
  }

  const config = metricConfig[metric]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      style={{
        padding: '28px',
        borderRadius: '12px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
          <h2 className="text-premium-h2" style={{ color: 'var(--text-primary)' }}>
            Vintage Cohort Analysis
          </h2>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '4px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
            }}
          >
            {(['defaultRate', 'collectionRate', 'avgDPD'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: metric === m ? 'var(--accent-primary)' : 'transparent',
                  color: metric === m ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                {metricConfig[m].label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-premium-body" style={{ color: 'var(--text-tertiary)' }}>
          Performance tracking by disbursement cohort - {config.description}
        </p>
      </div>

      {/* Cohort Comparison Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'var(--bg-tertiary)',
            border: '2px solid #10B981',
          }}
        >
          <div className="flex items-center" style={{ gap: '8px', marginBottom: '8px' }}>
            <TrendingUp size={18} style={{ color: '#10B981' }} />
            <p
              className="text-premium-caption"
              style={{
                color: 'var(--text-quaternary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Best Cohort
            </p>
          </div>
          <p
            className="text-premium-h3"
            style={{
              color: '#10B981',
              fontWeight: '700',
              marginBottom: '4px',
            }}
          >
            {data.comparison.bestCohort.vintage}
          </p>
          <p className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
            {data.comparison.bestCohort.defaultRate.toFixed(2)}% default rate
          </p>
          <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {data.comparison.bestCohort.loanCount} loans • {data.comparison.bestCohort.collectionRate.toFixed(1)}% collection
          </p>
        </div>

        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'var(--bg-tertiary)',
            border: '2px solid #EF4444',
          }}
        >
          <div className="flex items-center" style={{ gap: '8px', marginBottom: '8px' }}>
            <TrendingDown size={18} style={{ color: '#EF4444' }} />
            <p
              className="text-premium-caption"
              style={{
                color: 'var(--text-quaternary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Worst Cohort
            </p>
          </div>
          <p
            className="text-premium-h3"
            style={{
              color: '#EF4444',
              fontWeight: '700',
              marginBottom: '4px',
            }}
          >
            {data.comparison.worstCohort.vintage}
          </p>
          <p className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
            {data.comparison.worstCohort.defaultRate.toFixed(2)}% default rate
          </p>
          <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {data.comparison.worstCohort.loanCount} loans • {data.comparison.worstCohort.collectionRate.toFixed(1)}% collection
          </p>
        </div>

        <div
          style={{
            padding: '16px',
            borderRadius: '8px',
            background: 'var(--bg-tertiary)',
            border: '2px solid var(--border-primary)',
          }}
        >
          <p
            className="text-premium-caption"
            style={{
              color: 'var(--text-quaternary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}
          >
            Performance Spread
          </p>
          <p
            className="text-premium-h3"
            style={{
              color: 'var(--accent-primary)',
              fontWeight: '700',
              marginBottom: '4px',
            }}
          >
            {data.comparison.spread.toFixed(2)}%
          </p>
          <p className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
            Default rate variance
          </p>
          <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {data.context.totalCohorts} cohorts analyzed
          </p>
        </div>
      </div>

      {/* Line Chart */}
      <div style={{ height: '300px', marginTop: '24px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
          >
            <defs>
              <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.3} />
            <XAxis
              dataKey="vintage"
              stroke="var(--text-quaternary)"
              style={{ fontSize: '11px' }}
              tick={{ fill: 'var(--text-tertiary)' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              stroke="var(--text-quaternary)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'var(--text-tertiary)' }}
              label={{
                value: `${config.label} (${config.unit.trim()})`,
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
              formatter={(value: any, name: string, props: any) => [
                <>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>{config.label}:</strong> {Number(value).toFixed(2)}{config.unit}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                    {props.payload.loanCount} loans in cohort
                  </div>
                </>,
              ]}
            />
            <Line
              type="monotone"
              dataKey={metric}
              stroke={config.color}
              strokeWidth={3}
              dot={{ fill: config.color, r: 5 }}
              activeDot={{ r: 7 }}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Portfolio Aging Summary */}
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
          Portfolio Aging Analysis
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <div>
            <p className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
              New Loans (0-6 months)
            </p>
            <p className="text-premium-h3" style={{ color: '#3B82F6', marginTop: '4px' }}>
              {data.agingAnalysis.buckets.new.count.toLocaleString()}
            </p>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)' }}>
              {data.agingAnalysis.buckets.new.avgDefaultRate.toFixed(2)}% avg default rate
            </p>
          </div>
          <div>
            <p className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
              Mature Loans (7-24 months)
            </p>
            <p className="text-premium-h3" style={{ color: '#10B981', marginTop: '4px' }}>
              {data.agingAnalysis.buckets.mature.count.toLocaleString()}
            </p>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)' }}>
              {data.agingAnalysis.buckets.mature.avgDefaultRate.toFixed(2)}% avg default rate
            </p>
          </div>
          <div>
            <p className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
              Seasoned Loans (24+ months)
            </p>
            <p className="text-premium-h3" style={{ color: '#F59E0B', marginTop: '4px' }}>
              {data.agingAnalysis.buckets.seasoned.count.toLocaleString()}
            </p>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)' }}>
              {data.agingAnalysis.buckets.seasoned.avgDefaultRate.toFixed(2)}% avg default rate
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
