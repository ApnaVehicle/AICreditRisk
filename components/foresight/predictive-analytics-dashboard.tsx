'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingUp, Activity } from 'lucide-react'
import { DefaultPrediction, getProbabilityColor, getActionLabel } from '@/lib/utils/default-probability'
import CountUp from 'react-countup'
import { useLoanModal } from '@/lib/hooks/use-loan-modal'

interface PredictionData {
  summary: {
    totalLoans: number
    avgDefaultProbability: number
    avgConfidence: number
    highRiskCount: number
    mediumRiskCount: number
    lowRiskCount: number
    highRiskExposure: number
    mediumRiskExposure: number
    lowRiskExposure: number
    totalExposure: number
    highRiskPercentage: number
  }
  riskDistribution: {
    high: { count: number; exposure: number; percentage: number }
    medium: { count: number; exposure: number; percentage: number }
    low: { count: number; exposure: number; percentage: number }
  }
  top10HighRisk: DefaultPrediction[]
}

interface PredictiveAnalyticsDashboardProps {
  data: PredictionData
  loading?: boolean
}

export function PredictiveAnalyticsDashboard({ data, loading }: PredictiveAnalyticsDashboardProps) {
  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Risk Distribution Summary */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="text-premium-h3 flex items-center" style={{ color: 'var(--text-primary)', gap: '8px' }}>
            <Activity className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
            Predictive Risk Distribution
          </CardTitle>
          <CardDescription className="text-premium-body" style={{ color: 'var(--text-tertiary)' }}>
            ML-based default probability analysis across {data.summary.totalLoans} loans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <RiskDistributionCard
              level="High Risk"
              probability="70-100%"
              count={data.riskDistribution.high.count}
              exposure={data.riskDistribution.high.exposure}
              percentage={data.riskDistribution.high.percentage}
              color="#EF4444"
              delay={0.1}
            />
            <RiskDistributionCard
              level="Medium Risk"
              probability="40-69%"
              count={data.riskDistribution.medium.count}
              exposure={data.riskDistribution.medium.exposure}
              percentage={data.riskDistribution.medium.percentage}
              color="#F59E0B"
              delay={0.2}
            />
            <RiskDistributionCard
              level="Low Risk"
              probability="<40%"
              count={data.riskDistribution.low.count}
              exposure={data.riskDistribution.low.exposure}
              percentage={data.riskDistribution.low.percentage}
              color="#10B981"
              delay={0.3}
            />
          </div>

          {/* Portfolio Stats */}
          <div
            className="grid grid-cols-3 gap-4"
            style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-primary)',
            }}
          >
            <StatItem
              label="Avg Default Probability"
              value={`${data.summary.avgDefaultProbability}%`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatItem
              label="Model Confidence"
              value={`${data.summary.avgConfidence}%`}
              icon={<Activity className="h-4 w-4" />}
            />
            <StatItem
              label="High Risk Exposure"
              value={`${data.summary.highRiskPercentage}%`}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Top 10 Predicted Defaults */}
      <Card className="premium-card">
        <CardHeader>
          <CardTitle className="text-premium-h3" style={{ color: 'var(--text-primary)' }}>
            Top 10 Predicted Defaults
          </CardTitle>
          <CardDescription className="text-premium-body" style={{ color: 'var(--text-tertiary)' }}>
            Loans with highest default probability - immediate attention recommended
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-primary)' }}>
                  <th className="text-premium-overline" style={{ textAlign: 'left', padding: '8px', color: 'var(--text-quaternary)' }}>
                    Rank
                  </th>
                  <th className="text-premium-overline" style={{ textAlign: 'left', padding: '8px', color: 'var(--text-quaternary)' }}>
                    Borrower
                  </th>
                  <th className="text-premium-overline" style={{ textAlign: 'left', padding: '8px', color: 'var(--text-quaternary)' }}>
                    Outstanding
                  </th>
                  <th className="text-premium-overline" style={{ textAlign: 'left', padding: '8px', color: 'var(--text-quaternary)' }}>
                    Sector
                  </th>
                  <th className="text-premium-overline" style={{ textAlign: 'left', padding: '8px', color: 'var(--text-quaternary)' }}>
                    Probability
                  </th>
                  <th className="text-premium-overline" style={{ textAlign: 'left', padding: '8px', color: 'var(--text-quaternary)' }}>
                    Confidence
                  </th>
                  <th className="text-premium-overline" style={{ textAlign: 'left', padding: '8px', color: 'var(--text-quaternary)' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.top10HighRisk.map((prediction, index) => (
                  <PredictionRow
                    key={prediction.loan_id}
                    prediction={prediction}
                    rank={index + 1}
                    delay={0.4 + index * 0.05}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface RiskDistributionCardProps {
  level: string
  probability: string
  count: number
  exposure: number
  percentage: number
  color: string
  delay: number
}

function RiskDistributionCard({
  level,
  probability,
  count,
  exposure,
  percentage,
  color,
  delay,
}: RiskDistributionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="premium-card"
      style={{
        padding: '16px',
        borderLeft: `3px solid ${color}`,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
        <span
          className="text-premium-label"
          style={{
            color: 'var(--text-secondary)',
            fontWeight: '600',
          }}
        >
          {level}
        </span>
        <span
          className="text-premium-caption"
          style={{
            padding: '2px 6px',
            borderRadius: '4px',
            background: `${color}15`,
            color,
            fontSize: '10px',
          }}
        >
          {probability}
        </span>
      </div>

      <div style={{ marginBottom: '12px' }}>
        <div
          className="text-premium-h2"
          style={{
            color,
            fontSize: '28px',
            lineHeight: '1',
          }}
        >
          <CountUp end={count} duration={1.5} delay={delay + 0.2} />
        </div>
        <div
          className="text-premium-caption"
          style={{
            color: 'var(--text-quaternary)',
            marginTop: '2px',
          }}
        >
          loans ({percentage.toFixed(1)}%)
        </div>
      </div>

      <div
        style={{
          paddingTop: '8px',
          borderTop: '1px solid var(--border-primary)',
        }}
      >
        <div className="text-premium-caption" style={{ color: 'var(--text-quaternary)' }}>
          Exposure at Risk
        </div>
        <div
          className="text-premium-body"
          style={{
            color: 'var(--text-secondary)',
            fontWeight: '600',
            marginTop: '2px',
          }}
        >
          ₹<CountUp end={exposure / 10000000} decimals={2} duration={1.5} delay={delay + 0.3} />Cr
        </div>
      </div>
    </motion.div>
  )
}

interface StatItemProps {
  label: string
  value: string
  icon: React.ReactNode
}

function StatItem({ label, value, icon }: StatItemProps) {
  return (
    <div className="flex items-start" style={{ gap: '8px' }}>
      <div
        style={{
          padding: '6px',
          borderRadius: '6px',
          background: 'var(--bg-tertiary)',
          color: 'var(--accent-primary)',
        }}
      >
        {icon}
      </div>
      <div>
        <div className="text-premium-caption" style={{ color: 'var(--text-quaternary)' }}>
          {label}
        </div>
        <div
          className="text-premium-body"
          style={{
            color: 'var(--text-primary)',
            fontWeight: '600',
            marginTop: '2px',
          }}
        >
          {value}
        </div>
      </div>
    </div>
  )
}

interface PredictionRowProps {
  prediction: DefaultPrediction
  rank: number
  delay: number
}

function PredictionRow({ prediction, rank, delay }: PredictionRowProps) {
  const { openModal } = useLoanModal()
  const probabilityColor = getProbabilityColor(prediction.default_probability)

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      style={{
        borderBottom: '1px solid var(--border-primary)',
        cursor: 'pointer',
        transition: 'background 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--bg-tertiary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'transparent'
      }}
      onClick={() => openModal(prediction.loan_id)}
    >
      <td className="text-premium-body" style={{ padding: '12px 8px', color: 'var(--text-quaternary)' }}>
        #{rank}
      </td>
      <td className="text-premium-body" style={{ padding: '12px 8px', color: 'var(--text-primary)' }}>
        {prediction.borrower_name}
      </td>
      <td className="text-premium-body" style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
        ₹{(prediction.outstanding_amount / 100000).toFixed(1)}L
      </td>
      <td className="text-premium-caption" style={{ padding: '12px 8px', color: 'var(--text-tertiary)' }}>
        {prediction.sector}
      </td>
      <td style={{ padding: '12px 8px' }}>
        <div className="flex items-center" style={{ gap: '6px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: probabilityColor,
            }}
          />
          <span
            className="text-premium-body"
            style={{
              color: probabilityColor,
              fontWeight: '600',
            }}
          >
            {prediction.default_probability.toFixed(1)}%
          </span>
        </div>
      </td>
      <td className="text-premium-body" style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>
        {prediction.confidence}%
      </td>
      <td style={{ padding: '12px 8px' }}>
        <span
          className="text-premium-caption"
          style={{
            padding: '4px 8px',
            borderRadius: '4px',
            background: `${probabilityColor}15`,
            color: probabilityColor,
            fontSize: '10px',
            fontWeight: '600',
            whiteSpace: 'nowrap',
          }}
        >
          {getActionLabel(prediction.recommended_action)}
        </span>
      </td>
    </motion.tr>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="premium-card">
        <CardHeader>
          <div className="h-5 w-64 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded" />
          <div className="h-4 w-96 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="premium-card" style={{ padding: '16px' }}>
                <div className="h-6 w-24 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded mb-4" />
                <div className="h-8 w-16 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded mb-2" />
                <div className="h-4 w-32 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="premium-card">
        <CardHeader>
          <div className="h-5 w-48 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 w-full bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
