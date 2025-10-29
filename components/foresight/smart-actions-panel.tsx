'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, AlertTriangle, Shield, DollarSign, XCircle, PieChart, Eye } from 'lucide-react'
import { SmartAction, getPriorityColor, getPriorityEmoji } from '@/lib/utils/action-generator'
import Link from 'next/link'

interface SmartActionsPanelProps {
  actions: SmartAction[]
  loading?: boolean
}

const CATEGORY_ICONS = {
  delinquency: AlertTriangle,
  risk: Shield,
  collection: DollarSign,
  npa: XCircle,
  concentration: PieChart,
  monitoring: Eye,
}

export function SmartActionsPanel({ actions, loading }: SmartActionsPanelProps) {
  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <Card className="premium-card" style={{ height: '100%' }}>
      <CardHeader style={{ paddingBottom: '16px' }}>
        <CardTitle className="text-premium-h3 flex items-center" style={{ color: 'var(--text-primary)', gap: '8px' }}>
          <Shield className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
          Smart Actions
        </CardTitle>
        <CardDescription className="text-premium-body" style={{ color: 'var(--text-tertiary)' }}>
          AI-generated priority recommendations
        </CardDescription>
      </CardHeader>

      <CardContent style={{ padding: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {actions.map((action, index) => (
            <ActionCard key={action.id} action={action} index={index} />
          ))}

          {actions.length === 0 && (
            <div
              className="text-center"
              style={{
                padding: '32px 16px',
                color: 'var(--text-tertiary)',
              }}
            >
              <Eye className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--text-quaternary)' }} />
              <p className="text-premium-body">No priority actions at this time</p>
              <p className="text-premium-caption" style={{ marginTop: '4px' }}>
                Portfolio health is stable
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface ActionCardProps {
  action: SmartAction
  index: number
}

function ActionCard({ action, index }: ActionCardProps) {
  const priorityColor = getPriorityColor(action.priority)
  const priorityEmoji = getPriorityEmoji(action.priority)
  const IconComponent = CATEGORY_ICONS[action.category]

  const cardContent = (
        <div
          className="premium-card"
          style={{
            padding: '14px',
            borderLeft: `3px solid ${priorityColor}`,
            cursor: action.actionLink ? 'pointer' : 'default',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            if (action.actionLink) {
              e.currentTarget.style.transform = 'translateX(4px)'
              e.currentTarget.style.borderLeftColor = priorityColor
              e.currentTarget.style.boxShadow = `0 0 20px ${priorityColor}30`
            }
          }}
          onMouseLeave={(e) => {
            if (action.actionLink) {
              e.currentTarget.style.transform = 'translateX(0)'
              e.currentTarget.style.boxShadow = ''
            }
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between" style={{ marginBottom: '8px' }}>
            <div className="flex items-start" style={{ gap: '8px', flex: 1 }}>
              <div
                style={{
                  padding: '6px',
                  borderRadius: '6px',
                  background: `${priorityColor}15`,
                  flexShrink: 0,
                }}
              >
                <IconComponent className="h-4 w-4" style={{ color: priorityColor }} />
              </div>
              <div style={{ flex: 1 }}>
                <h4
                  className="text-premium-body"
                  style={{
                    color: 'var(--text-primary)',
                    fontWeight: '600',
                    lineHeight: '1.4',
                  }}
                >
                  {action.title}
                </h4>
              </div>
            </div>

            {/* Priority Badge */}
            <div
              style={{
                padding: '2px 8px',
                borderRadius: '12px',
                background: `${priorityColor}15`,
                border: `1px solid ${priorityColor}30`,
                flexShrink: 0,
                marginLeft: '8px',
              }}
            >
              <span
                className="text-premium-caption"
                style={{
                  color: priorityColor,
                  fontWeight: '600',
                  fontSize: '10px',
                }}
              >
                {priorityEmoji} {action.priority}
              </span>
            </div>
          </div>

          {/* Description */}
          <p
            className="text-premium-caption"
            style={{
              color: 'var(--text-tertiary)',
              lineHeight: '1.5',
              marginBottom: '8px',
            }}
          >
            {action.description}
          </p>

          {/* Metrics */}
          {action.metrics && (
            <div
              className="flex flex-wrap items-center"
              style={{
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              {action.metrics.count !== undefined && (
                <Metric label="Loans" value={action.metrics.count.toString()} />
              )}
              {action.metrics.exposure !== undefined && (
                <Metric
                  label="Exposure"
                  value={`₹${(action.metrics.exposure / 10000000).toFixed(2)}Cr`}
                />
              )}
              {action.metrics.percentage !== undefined && (
                <Metric label="Rate" value={`${action.metrics.percentage.toFixed(1)}%`} />
              )}
            </div>
          )}

          {/* Impact */}
          <div
            className="flex items-center justify-between"
            style={{
              paddingTop: '8px',
              borderTop: '1px solid var(--border-primary)',
            }}
          >
            <div className="flex items-center" style={{ gap: '6px' }}>
              <span
                className="text-premium-caption"
                style={{
                  color: 'var(--text-quaternary)',
                  fontWeight: '500',
                }}
              >
                Impact:
              </span>
              <span
                className="text-premium-caption"
                style={{
                  color: 'var(--text-secondary)',
                }}
              >
                {action.impact}
              </span>
            </div>

            {action.actionLink && (
              <ArrowRight
                className="h-4 w-4"
                style={{ color: 'var(--accent-primary)' }}
              />
            )}
          </div>
        </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      {action.actionLink ? (
        <Link href={action.actionLink}>{cardContent}</Link>
      ) : (
        cardContent
      )}
    </motion.div>
  )
}

interface MetricProps {
  label: string
  value: string
}

function Metric({ label, value }: MetricProps) {
  return (
    <div
      style={{
        padding: '4px 8px',
        borderRadius: '6px',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <span
        className="text-premium-caption"
        style={{
          color: 'var(--text-quaternary)',
          fontSize: '10px',
        }}
      >
        {label}:
      </span>{' '}
      <span
        className="text-premium-caption"
        style={{
          color: 'var(--text-secondary)',
          fontWeight: '600',
          fontSize: '10px',
        }}
      >
        {value}
      </span>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <Card className="premium-card" style={{ height: '100%' }}>
      <CardHeader>
        <div className="h-5 w-40 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded" />
        <div className="h-4 w-56 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="premium-card"
              style={{ padding: '14px' }}
            >
              <div className="h-4 w-3/4 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-full bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded mb-2" />
              <div className="h-3 w-2/3 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
