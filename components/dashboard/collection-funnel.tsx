'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, TrendingUp, Activity } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from 'recharts'

interface FunnelStage {
  stage: string
  description: string
  count: number
  amount: number
  percentage: number
  conversionRate: number
  color: string
}

interface CollectionFunnelProps {
  isLoading?: boolean
  queryParams?: string
}

export function CollectionFunnel({ isLoading = false, queryParams = '' }: CollectionFunnelProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [queryParams])

  const fetchData = async () => {
    try {
      setLoading(true)
      const url = queryParams
        ? `/api/bi-dashboard/collection-funnel?${queryParams}`
        : '/api/bi-dashboard/collection-funnel'
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
          <div style={{ height: '24px', background: 'var(--bg-tertiary)', borderRadius: '4px', marginBottom: '16px', width: '250px' }} />
          <div style={{ height: '350px', background: 'var(--bg-tertiary)', borderRadius: '8px' }} />
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

  // Prepare funnel chart data (exclude "Total Due" for better visualization)
  const funnelChartData = data.funnel.slice(1).map((stage: FunnelStage) => ({
    ...stage,
    percentageValue: stage.percentage,
  }))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Collection Funnel Chart */}
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
          <h2 className="text-premium-h2" style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
            Collection Workflow Funnel
          </h2>
          <p className="text-premium-body" style={{ color: 'var(--text-tertiary)' }}>
            Recovery conversion across delinquency stages
          </p>
        </div>

        {/* Efficiency Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
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
            <p
              className="text-premium-caption"
              style={{
                color: 'var(--text-quaternary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Collection Rate
            </p>
            <p
              className="text-premium-h3"
              style={{
                color: '#10B981',
                fontWeight: '700',
              }}
            >
              {data.efficiency.overallCollectionRate.toFixed(1)}%
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: '2px solid #3B82F6',
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
              On-time Rate
            </p>
            <p
              className="text-premium-h3"
              style={{
                color: '#3B82F6',
                fontWeight: '700',
              }}
            >
              {data.efficiency.onTimeRate.toFixed(1)}%
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: '2px solid #F59E0B',
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
              Avg Delay
            </p>
            <p
              className="text-premium-h3"
              style={{
                color: '#F59E0B',
                fontWeight: '700',
              }}
            >
              {data.efficiency.avgCollectionDelay.toFixed(0)} days
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: '2px solid var(--accent-primary)',
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
              Early Recovery
            </p>
            <p
              className="text-premium-h3"
              style={{
                color: 'var(--accent-primary)',
                fontWeight: '700',
              }}
            >
              {data.efficiency.earlyRecoveryRate.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Funnel Bar Chart */}
        <div style={{ height: '320px', marginTop: '24px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={funnelChartData}
              layout="vertical"
              margin={{ top: 10, right: 30, left: 100, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.3} />
              <XAxis
                type="number"
                stroke="var(--text-quaternary)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'var(--text-tertiary)' }}
                label={{
                  value: '% of Total Repayments',
                  position: 'insideBottom',
                  offset: -5,
                  style: { fill: 'var(--text-secondary)', fontSize: '12px' },
                }}
              />
              <YAxis
                type="category"
                dataKey="stage"
                stroke="var(--text-quaternary)"
                style={{ fontSize: '12px' }}
                tick={{ fill: 'var(--text-tertiary)' }}
                width={90}
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
                      <strong>Percentage:</strong> {Number(value).toFixed(2)}%
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {props.payload.count} repayments
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-quaternary)', marginTop: '4px' }}>
                      {props.payload.description}
                    </div>
                  </>,
                ]}
              />
              <Bar dataKey="percentageValue" radius={[0, 8, 8, 0]} animationDuration={1000}>
                {funnelChartData.map((entry: FunnelStage, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Monthly Collection Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        style={{
          padding: '28px',
          borderRadius: '12px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h2 className="text-premium-h2" style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>
            Collection Trend
          </h2>
          <p className="text-premium-body" style={{ color: 'var(--text-tertiary)' }}>
            Monthly collection efficiency over time
          </p>
        </div>

        {/* Recovery Performance Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
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
            <div className="flex items-center" style={{ gap: '8px', marginBottom: '6px' }}>
              <Activity size={16} style={{ color: '#10B981' }} />
              <p
                className="text-premium-caption"
                style={{
                  color: 'var(--text-quaternary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Total Recovered
              </p>
            </div>
            <p
              className="text-premium-h3"
              style={{
                color: '#10B981',
                fontWeight: '700',
              }}
            >
              {data.recovery.totalRecovered.toLocaleString()}
            </p>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
              delinquent repayments collected
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: '2px solid var(--accent-primary)',
            }}
          >
            <div className="flex items-center" style={{ gap: '8px', marginBottom: '6px' }}>
              <TrendingUp size={16} style={{ color: 'var(--accent-primary)' }} />
              <p
                className="text-premium-caption"
                style={{
                  color: 'var(--text-quaternary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Recovery Rate
              </p>
            </div>
            <p
              className="text-premium-h3"
              style={{
                color: 'var(--accent-primary)',
                fontWeight: '700',
              }}
            >
              {data.recovery.recoveryRate.toFixed(1)}%
            </p>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
              of overdue payments recovered
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: '2px solid #34D399',
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
              Early Recovery
            </p>
            <p
              className="text-premium-h3"
              style={{
                color: '#34D399',
                fontWeight: '700',
              }}
            >
              {data.recovery.earlyRecoverySuccess.toLocaleString()}
            </p>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)' }}>
              1-15 DPD recovered
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: '2px solid #F59E0B',
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
              Late Recovery
            </p>
            <p
              className="text-premium-h3"
              style={{
                color: '#F59E0B',
                fontWeight: '700',
              }}
            >
              {data.recovery.lateRecoverySuccess.toLocaleString()}
            </p>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)' }}>
              31+ DPD recovered
            </p>
          </div>
        </div>

        {/* Monthly Trend Line Chart */}
        <div style={{ height: '320px', marginTop: '24px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data.monthlyTrends}
              margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
            >
              <defs>
                <linearGradient id="collectionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.3} />
              <XAxis
                dataKey="month"
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
                domain={[0, 100]}
                label={{
                  value: 'Collection Rate (%)',
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
                      <strong>Collection Rate:</strong> {Number(value).toFixed(2)}%
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {props.payload.collected} of {props.payload.totalDue} repayments
                    </div>
                  </>,
                ]}
              />
              <Line
                type="monotone"
                dataKey="collectionRate"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4 }}
                activeDot={{ r: 6 }}
                fill="url(#collectionGradient)"
                animationDuration={1500}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  )
}
