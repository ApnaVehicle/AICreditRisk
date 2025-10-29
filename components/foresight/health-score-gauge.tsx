'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { getHealthScoreColor, getHealthScoreGradient } from '@/lib/utils/health-score-calculator'
import CountUp from 'react-countup'

interface HealthScoreData {
  overall: number
  components: {
    npaScore: number
    collectionScore: number
    riskScore: number
    dpdScore: number
  }
  weights: {
    npaWeight: number
    collectionWeight: number
    riskWeight: number
    dpdWeight: number
  }
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'
  trend: number
}

interface HealthScoreGaugeProps {
  data: HealthScoreData
  loading?: boolean
}

export function HealthScoreGauge({ data, loading }: HealthScoreGaugeProps) {
  if (loading) {
    return <LoadingSkeleton />
  }

  const gradient = getHealthScoreGradient(data.overall)
  const color = getHealthScoreColor(data.overall)

  // Calculate gauge arc (300 degrees total, starting from -150 to +150)
  const percentage = data.overall / 100
  const degrees = percentage * 300 - 150

  return (
    <Card className="premium-card" style={{ height: '100%' }}>
      <CardHeader style={{ paddingBottom: '16px' }}>
        <CardTitle className="text-premium-h3" style={{ color: 'var(--text-primary)' }}>
          Portfolio Health Score
        </CardTitle>
        <CardDescription className="text-premium-body" style={{ color: 'var(--text-tertiary)' }}>
          Composite health indicator based on 4 key metrics
        </CardDescription>
      </CardHeader>

      <CardContent style={{ padding: '16px' }}>
        {/* Main Gauge */}
        <div className="flex flex-col items-center" style={{ marginBottom: '24px' }}>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            style={{ position: 'relative', width: '200px', height: '200px' }}
          >
            {/* Background arc */}
            <svg
              width="200"
              height="200"
              viewBox="0 0 200 200"
              style={{ transform: 'rotate(-150deg)' }}
            >
              <circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="12"
                strokeDasharray="266.67 133.33"
              />
              <motion.circle
                cx="100"
                cy="100"
                r="85"
                fill="none"
                stroke={`url(#healthGradient)`}
                strokeWidth="12"
                strokeDasharray={`${266.67 * percentage} ${266.67 * (1 - percentage) + 133.33}`}
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 400' }}
                animate={{ strokeDasharray: `${266.67 * percentage} ${266.67 * (1 - percentage) + 133.33}` }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
              />
              <defs>
                <linearGradient id="healthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={gradient.start} />
                  <stop offset="100%" stopColor={gradient.end} />
                </linearGradient>
              </defs>
            </svg>

            {/* Center content */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div
                  className="text-premium-hero"
                  style={{
                    fontSize: '48px',
                    fontWeight: '700',
                    color,
                    lineHeight: '1',
                  }}
                >
                  <CountUp end={data.overall} decimals={1} duration={1.5} delay={0.5} />
                </div>
                <div
                  className="text-premium-label"
                  style={{
                    color: 'var(--text-quaternary)',
                    marginTop: '4px',
                  }}
                >
                  out of 100
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Grade Badge */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              marginTop: '16px',
              padding: '6px 16px',
              borderRadius: '20px',
              background: `${color}15`,
              border: `1px solid ${color}30`,
            }}
          >
            <span
              className="text-premium-label"
              style={{
                color,
                fontWeight: '600',
              }}
            >
              {data.grade}
            </span>
          </motion.div>

          {/* Trend Indicator */}
          {data.trend !== 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex items-center"
              style={{ marginTop: '8px', gap: '4px' }}
            >
              {data.trend > 0 ? (
                <TrendingUp className="h-4 w-4" style={{ color: '#10B981' }} />
              ) : data.trend < 0 ? (
                <TrendingDown className="h-4 w-4" style={{ color: '#EF4444' }} />
              ) : (
                <Minus className="h-4 w-4" style={{ color: 'var(--text-quaternary)' }} />
              )}
              <span
                className="text-premium-caption"
                style={{
                  color: data.trend > 0 ? '#10B981' : data.trend < 0 ? '#EF4444' : 'var(--text-quaternary)',
                }}
              >
                {data.trend > 0 ? '+' : ''}{data.trend.toFixed(1)} vs last week
              </span>
            </motion.div>
          )}
        </div>

        {/* Component Breakdown */}
        <div
          style={{
            borderTop: '1px solid var(--border-primary)',
            paddingTop: '16px',
          }}
        >
          <p
            className="text-premium-overline"
            style={{
              color: 'var(--text-quaternary)',
              marginBottom: '12px',
            }}
          >
            Score Breakdown
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <ComponentBar
              label="NPA Rate"
              score={data.components.npaScore}
              weight={data.weights.npaWeight * 100}
              delay={1.1}
            />
            <ComponentBar
              label="Collection Efficiency"
              score={data.components.collectionScore}
              weight={data.weights.collectionWeight * 100}
              delay={1.2}
            />
            <ComponentBar
              label="Risk Distribution"
              score={data.components.riskScore}
              weight={data.weights.riskWeight * 100}
              delay={1.3}
            />
            <ComponentBar
              label="DPD Performance"
              score={data.components.dpdScore}
              weight={data.weights.dpdWeight * 100}
              delay={1.4}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface ComponentBarProps {
  label: string
  score: number
  weight: number
  delay: number
}

function ComponentBar({ label, score, weight, delay }: ComponentBarProps) {
  const color = getHealthScoreColor(score)
  const percentage = score / 100

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: '4px' }}>
        <span className="text-premium-caption" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <span className="text-premium-caption" style={{ color: 'var(--text-quaternary)' }}>
          {weight}% weight • {score.toFixed(1)}/100
        </span>
      </div>
      <div
        style={{
          height: '6px',
          borderRadius: '3px',
          background: 'var(--bg-tertiary)',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage * 100}%` }}
          transition={{ duration: 0.8, delay, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: color,
            borderRadius: '3px',
          }}
        />
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <Card className="premium-card" style={{ height: '100%' }}>
      <CardHeader>
        <div className="h-5 w-48 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded" />
        <div className="h-4 w-64 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-center mb-6">
          <div className="h-48 w-48 rounded-full bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse" />
        </div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="h-3 w-full bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
