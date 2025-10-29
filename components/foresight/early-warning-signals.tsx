'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, TrendingUp, AlertTriangle, MapPin } from 'lucide-react'
import CountUp from 'react-countup'

interface EarlyWarningData {
  consecutiveMissedPayments: number
  dpdAcceleration: number
  riskScoreDeterioration: number
  sectorStress: number
}

interface EarlyWarningSignalsProps {
  data: EarlyWarningData
  loading?: boolean
}

export function EarlyWarningSignals({ data, loading }: EarlyWarningSignalsProps) {
  if (loading) {
    return <LoadingSkeleton />
  }

  const signals = [
    {
      label: 'Consecutive Missed Payments',
      value: data.consecutiveMissedPayments,
      description: 'Loans with 2+ consecutive missed payments',
      icon: AlertCircle,
      color: '#EF4444',
      delay: 0.1,
    },
    {
      label: 'DPD Acceleration',
      value: data.dpdAcceleration,
      description: 'Loans showing worsening delinquency trends',
      icon: TrendingUp,
      color: '#F59E0B',
      delay: 0.2,
    },
    {
      label: 'Risk Score Deterioration',
      value: data.riskScoreDeterioration,
      description: 'Loans with elevated risk indicators',
      icon: AlertTriangle,
      color: '#F97316',
      delay: 0.3,
    },
    {
      label: 'Sector Stress Clusters',
      value: data.sectorStress,
      description: 'Sectors with multiple high-risk loans',
      icon: MapPin,
      color: '#EC4899',
      delay: 0.4,
    },
  ]

  return (
    <Card className="premium-card">
      <CardHeader>
        <CardTitle className="text-premium-h3 flex items-center" style={{ color: 'var(--text-primary)', gap: '8px' }}>
          <AlertCircle className="h-5 w-5" style={{ color: '#F59E0B' }} />
          Early Warning Signals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {signals.map((signal) => (
            <SignalCard key={signal.label} {...signal} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface SignalCardProps {
  label: string
  value: number
  description: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
  delay: number
}

function SignalCard({ label, value, description, icon: Icon, color, delay }: SignalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="premium-card"
      style={{
        padding: '14px',
        borderTop: `2px solid ${color}`,
      }}
    >
      <div className="flex items-start justify-between" style={{ marginBottom: '12px' }}>
        <div
          style={{
            padding: '8px',
            borderRadius: '8px',
            background: `${color}15`,
          }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div
          className="text-premium-h2"
          style={{
            color,
            fontSize: '32px',
            lineHeight: '1',
          }}
        >
          <CountUp end={value} duration={1.5} delay={delay + 0.2} />
        </div>
      </div>

      <div>
        <div
          className="text-premium-label"
          style={{
            color: 'var(--text-secondary)',
            fontWeight: '600',
            marginBottom: '4px',
          }}
        >
          {label}
        </div>
        <div
          className="text-premium-caption"
          style={{
            color: 'var(--text-quaternary)',
            lineHeight: '1.4',
          }}
        >
          {description}
        </div>
      </div>
    </motion.div>
  )
}

function LoadingSkeleton() {
  return (
    <Card className="premium-card">
      <CardHeader>
        <div className="h-5 w-48 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="premium-card" style={{ padding: '14px' }}>
              <div className="h-10 w-10 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded mb-4" />
              <div className="h-8 w-16 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded mb-2" />
              <div className="h-4 w-full bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-3/4 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
