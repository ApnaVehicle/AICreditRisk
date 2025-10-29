import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  sparkline?: number[]
  badge?: {
    label: string
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'warning'
  }
  onClick?: () => void
}

export function KPICard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'blue',
  trend,
  sparkline,
  badge,
  onClick,
}: KPICardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-500',
    red: 'bg-red-500/10 text-red-500',
    green: 'bg-green-500/10 text-green-500',
    amber: 'bg-amber-500/10 text-amber-500',
    purple: 'bg-purple-500/10 text-purple-500',
    cyan: 'bg-cyan-500/10 text-cyan-500',
  }

  // Prepare sparkline data
  const sparklineData = sparkline
    ? sparkline.map((value, index) => ({
        index,
        value,
      }))
    : []

  return (
    <Card
      className={`metric-card transition-all hover:shadow-lg ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${colorClasses[iconColor] || colorClasses.blue}`}>
            <Icon className="h-6 w-6" />
          </div>
          {badge && (
            <Badge variant={badge.variant || 'outline'} className="text-xs">
              {badge.label}
            </Badge>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          <div className="metric-value text-3xl font-bold">{value}</div>
          <p className="metric-label text-sm font-medium text-muted-foreground">{title}</p>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          {/* Subtitle or Trend */}
          <div className="flex items-center gap-2">
            {trend && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(trend.value).toFixed(1)}%</span>
              </div>
            )}
            {subtitle && !trend && (
              <span className="text-sm text-muted-foreground">{subtitle}</span>
            )}
          </div>

          {/* Sparkline */}
          {sparklineData.length > 0 && (
            <div className="h-8 w-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparklineData}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={trend?.isPositive ? '#10b981' : '#ef4444'}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
