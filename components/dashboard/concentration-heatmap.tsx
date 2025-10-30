'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, TrendingUp, AlertTriangle } from 'lucide-react'
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
} from 'recharts'

interface ConcentrationHeatmapProps {
  isLoading?: boolean
  queryParams?: string
}

export function ConcentrationHeatmap({ isLoading = false, queryParams = '' }: ConcentrationHeatmapProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<'sector' | 'geography' | 'borrower'>('sector')

  useEffect(() => {
    fetchData()
  }, [queryParams])

  const fetchData = async () => {
    try {
      setLoading(true)
      const url = queryParams
        ? `/api/bi-dashboard/concentration-matrix?${queryParams}`
        : '/api/bi-dashboard/concentration-matrix'
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

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW':
        return '#10B981'
      case 'MODERATE':
        return '#F59E0B'
      case 'HIGH':
        return '#EF4444'
      default:
        return '#6B7280'
    }
  }

  const getBarColor = (percentage: number) => {
    if (percentage >= 30) return '#EF4444' // High concentration
    if (percentage >= 20) return '#F59E0B' // Moderate concentration
    if (percentage >= 10) return '#FBBF24' // Elevated concentration
    return '#10B981' // Good diversification
  }

  // Prepare chart data based on selected view
  let chartData: any[] = []
  let title = ''
  let hhi = 0
  let riskLevel = ''

  switch (view) {
    case 'sector':
      chartData = data.sectorConcentration.data.slice(0, 10)
      title = 'Sector Concentration'
      hhi = data.sectorConcentration.hhi
      riskLevel = data.sectorConcentration.riskLevel
      break
    case 'geography':
      chartData = data.geographyConcentration.data.slice(0, 10)
      title = 'Geographic Concentration'
      hhi = data.geographyConcentration.hhi
      riskLevel = data.geographyConcentration.riskLevel
      break
    case 'borrower':
      chartData = data.borrowerConcentration.topBorrowers.slice(0, 10)
      title = 'Top Borrower Concentration'
      hhi = 0
      riskLevel = data.borrowerConcentration.riskLevel
      break
  }

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
            Portfolio Concentration Risk
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
            {['sector', 'geography', 'borrower'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v as any)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  background: view === v ? 'var(--accent-primary)' : 'transparent',
                  color: view === v ? '#FFFFFF' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                  fontSize: '13px',
                  fontWeight: '600',
                  textTransform: 'capitalize',
                }}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <p className="text-premium-body" style={{ color: 'var(--text-tertiary)' }}>
          {title} - Diversification analysis
        </p>
      </div>

      {/* HHI Metrics */}
      {view !== 'borrower' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: `2px solid ${getRiskColor(riskLevel)}`,
            }}
          >
            <p
              className="text-premium-caption"
              style={{
                color: 'var(--text-quaternary)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              HHI Score
            </p>
            <p
              className="text-premium-h2"
              style={{
                color: getRiskColor(riskLevel),
                fontWeight: '700',
                marginBottom: '8px',
              }}
            >
              {hhi.toLocaleString()}
            </p>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)' }}>
              {hhi < 1500 && 'Unconcentrated - Low risk'}
              {hhi >= 1500 && hhi < 2500 && 'Moderate concentration'}
              {hhi >= 2500 && 'High concentration - Review needed'}
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: `2px solid ${getRiskColor(riskLevel)}`,
            }}
          >
            <p
              className="text-premium-caption"
              style={{
                color: 'var(--text-quaternary)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Risk Level
            </p>
            <div className="flex items-center" style={{ gap: '8px', marginBottom: '8px' }}>
              {riskLevel === 'HIGH' ? (
                <AlertTriangle size={24} style={{ color: getRiskColor(riskLevel) }} />
              ) : (
                <TrendingUp size={24} style={{ color: getRiskColor(riskLevel) }} />
              )}
              <p
                className="text-premium-h2"
                style={{
                  color: getRiskColor(riskLevel),
                  fontWeight: '700',
                }}
              >
                {riskLevel}
              </p>
            </div>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)' }}>
              Overall {view} risk assessment
            </p>
          </div>

          {view === 'sector' && (
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
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Top Sector Share
              </p>
              <p
                className="text-premium-h2"
                style={{
                  color: 'var(--accent-primary)',
                  fontWeight: '700',
                  marginBottom: '8px',
                }}
              >
                {chartData[0]?.percentage.toFixed(1)}%
              </p>
              <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)' }}>
                {chartData[0]?.sector || 'N/A'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Borrower-specific metrics */}
      {view === 'borrower' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              border: `2px solid ${getRiskColor(riskLevel)}`,
            }}
          >
            <p
              className="text-premium-caption"
              style={{
                color: 'var(--text-quaternary)',
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Top-10 Concentration
            </p>
            <p
              className="text-premium-h2"
              style={{
                color: getRiskColor(riskLevel),
                fontWeight: '700',
                marginBottom: '8px',
              }}
            >
              {data.borrowerConcentration.top10Concentration.toFixed(1)}%
            </p>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)' }}>
              of total portfolio exposure
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
                marginBottom: '8px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Limit Violations
            </p>
            <p
              className="text-premium-h2"
              style={{
                color: data.borrowerConcentration.limitViolations.length > 0 ? '#EF4444' : '#10B981',
                fontWeight: '700',
                marginBottom: '8px',
              }}
            >
              {data.borrowerConcentration.limitViolations.length}
            </p>
            <p className="text-premium-caption" style={{ color: 'var(--text-tertiary)' }}>
              exceed 10% single-name limit
            </p>
          </div>
        </div>
      )}

      {/* Bar Chart */}
      <div style={{ height: '300px', marginTop: '24px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 80 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" opacity={0.3} />
            <XAxis
              dataKey={view === 'sector' ? 'sector' : view === 'geography' ? 'geography' : 'name'}
              stroke="var(--text-quaternary)"
              style={{ fontSize: '11px' }}
              tick={{ fill: 'var(--text-tertiary)' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="var(--text-quaternary)"
              style={{ fontSize: '12px' }}
              tick={{ fill: 'var(--text-tertiary)' }}
              label={{
                value: '% of Portfolio',
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
              formatter={(value: any) => [`${Number(value).toFixed(2)}%`, 'Concentration']}
            />
            <Bar
              dataKey="percentage"
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
              animationEasing="ease-in-out"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div
          style={{
            marginTop: '24px',
            padding: '20px',
            borderRadius: '8px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--accent-warning)',
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
            Risk Mitigation Recommendations
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {data.recommendations.slice(0, 3).map((rec: string, index: number) => (
              <li
                key={index}
                className="text-premium-body"
                style={{
                  color: 'var(--text-secondary)',
                  paddingLeft: '20px',
                  position: 'relative',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    left: '0',
                    top: '0',
                    color: 'var(--accent-warning)',
                    fontWeight: '700',
                  }}
                >
                  •
                </span>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}
