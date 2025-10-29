'use client'

import { useState, useEffect } from 'react'
import { CommandCenterLayout } from '@/components/layout/command-center-layout'
import { AISidebar } from '@/components/layout/ai-sidebar'
import { LiveInsightsPanel } from '@/components/layout/live-insights-panel-enhanced'
import { LoanDetailModal } from '@/components/modals/loan-detail-modal'
import { AnimatedProgressRing } from '@/components/dashboard/animated-progress-ring'
import { PremiumStatCard } from '@/components/dashboard/premium-stat-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Users, Target, BarChart3, Activity } from 'lucide-react'
import CountUp from 'react-countup'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  const [kpis, setKpis] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchKPIs()
  }, [])

  const fetchKPIs = async () => {
    try {
      const response = await fetch('/api/analytics/enhanced-kpis')
      const data = await response.json()
      if (data.success) {
        setKpis(data.data)
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <CommandCenterLayout
      sidebar={<AISidebar />}
      insights={<LiveInsightsPanel />}
      userName="Shahabaj Sheikh"
      appName="Credit Risk Monitor"
    >
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ marginBottom: '32px' }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <div>
            <h1 className="text-premium-h2" style={{
              background: 'linear-gradient(135deg, var(--accent-primary) 0%, #A78BFA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              AI Credit Risk Command Center
            </h1>
            <p className="text-premium-body" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
              Real-time portfolio monitoring with intelligent insights
            </p>
          </div>
          <div className="flex" style={{ gap: '12px' }}>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="premium-button">
                <BarChart3 className="h-4 w-4" style={{ marginRight: '8px' }} />
                Full Dashboard
              </Button>
            </Link>
            <Link href="/loans">
              <Button variant="outline" size="sm" className="premium-button">
                <Target className="h-4 w-4" style={{ marginRight: '8px' }} />
                Loan Explorer
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass-dark">
                  <CardHeader className="space-y-2">
                    <div className="h-4 w-24 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded" />
                    <div className="h-8 w-32 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 w-20 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i + 4}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
              >
                <Card className="glass-dark">
                  <CardHeader className="pb-2">
                    <div className="h-4 w-32 bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse rounded mx-auto" />
                  </CardHeader>
                  <CardContent className="flex justify-center pt-4">
                    <div className="h-32 w-32 rounded-full bg-gradient-to-r from-muted via-muted-foreground/20 to-muted animate-pulse" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Portfolio Overview - Premium */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            style={{ marginBottom: '32px' }}
          >
            <h2 className="text-premium-h2 flex items-center" style={{
              color: 'var(--text-primary)',
              marginBottom: '16px',
              gap: '8px'
            }}>
              <DollarSign className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
              Portfolio Overview
            </h2>

            <div className="grid" style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              <PremiumStatCard
                icon={Activity}
                label="Total Loans"
                value={kpis?.portfolio?.totalLoans || 0}
                change={8.3}
                accentColor="primary"
                delay={0.1}
              />

              <PremiumStatCard
                icon={DollarSign}
                label="Total Exposure"
                value={(kpis?.portfolio?.totalExposure || 0) / 10000000}
                prefix="₹"
                unit="Cr"
                decimals={1}
                change={5.2}
                accentColor="success"
                delay={0.2}
              />

              <PremiumStatCard
                icon={AlertTriangle}
                label="NPA Loans"
                value={kpis?.portfolio?.npaLoans || 0}
                change={-2.1}
                accentColor="danger"
                delay={0.3}
              />

              <PremiumStatCard
                icon={Target}
                label="Avg Loan Size"
                value={(kpis?.portfolio?.avgLoanSize || 0) / 100000}
                prefix="₹"
                unit="L"
                decimals={1}
                change={3.7}
                accentColor="info"
                delay={0.4}
              />
            </div>
          </motion.div>

          {/* Risk Metrics - Premium */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ marginBottom: '32px' }}
          >
            <h2 className="text-premium-h2 flex items-center" style={{
              color: 'var(--text-primary)',
              marginBottom: '16px',
              gap: '8px'
            }}>
              <AlertTriangle className="h-5 w-5" style={{ color: '#F59E0B' }} />
              Risk Metrics
            </h2>

            <div className="grid" style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, ease: [0.4, 0, 0.2, 1] }}
              >
                <Card className="premium-card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '24px',
                }}>
                  <CardDescription className="text-center text-premium-label" style={{
                    color: 'var(--text-quaternary)',
                    marginBottom: '16px'
                  }}>
                    Gross NPA Rate
                  </CardDescription>
                  <AnimatedProgressRing
                    value={kpis?.npa?.grossNPARate || 0}
                    size={120}
                    strokeWidth={10}
                  />
                  <p className="text-premium-caption" style={{
                    color: 'var(--text-tertiary)',
                    marginTop: '12px',
                    textAlign: 'center'
                  }}>
                    Exposure: ₹{((kpis?.npa?.npaExposure || 0) / 10000000).toFixed(2)}Cr
                  </p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, ease: [0.4, 0, 0.2, 1] }}
              >
                <Card className="premium-card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '24px',
                }}>
                  <CardDescription className="text-center text-premium-label" style={{
                    color: 'var(--text-quaternary)',
                    marginBottom: '16px'
                  }}>
                    Collection Efficiency
                  </CardDescription>
                  <AnimatedProgressRing
                    value={kpis?.collections?.collectionEfficiency || 0}
                    size={120}
                    strokeWidth={10}
                    color="#10B981"
                  />
                  <p className="text-premium-caption" style={{
                    color: 'var(--text-tertiary)',
                    marginTop: '12px',
                    textAlign: 'center'
                  }}>
                    {kpis?.collections?.successfulRepayments || 0}/{kpis?.collections?.totalRepayments || 0} successful
                  </p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7, ease: [0.4, 0, 0.2, 1] }}
              >
                <Card className="premium-card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '24px',
                }}>
                  <CardDescription className="text-center text-premium-label" style={{
                    color: 'var(--text-quaternary)',
                    marginBottom: '16px'
                  }}>
                    PAR 30+ Rate
                  </CardDescription>
                  <AnimatedProgressRing
                    value={kpis?.delinquency?.par30Rate || 0}
                    size={120}
                    strokeWidth={10}
                  />
                  <p className="text-premium-caption" style={{
                    color: 'var(--text-tertiary)',
                    marginTop: '12px',
                    textAlign: 'center'
                  }}>
                    {kpis?.delinquency?.par30Count || 0} loans overdue 30+ days
                  </p>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, ease: [0.4, 0, 0.2, 1] }}
              >
                <Card className="premium-card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '24px',
                }}>
                  <CardDescription className="text-center text-premium-label" style={{
                    color: 'var(--text-quaternary)',
                    marginBottom: '16px'
                  }}>
                    Avg Risk Score
                  </CardDescription>
                  <AnimatedProgressRing
                    value={kpis?.risk?.avgRiskScore || 0}
                    size={120}
                    strokeWidth={10}
                    showPercentage={false}
                    unit=""
                  />
                  <p className="text-premium-caption" style={{
                    color: 'var(--text-tertiary)',
                    marginTop: '12px',
                    textAlign: 'center'
                  }}>
                    {kpis?.risk?.highRiskCount || 0} high risk loans
                  </p>
                </Card>
              </motion.div>
            </div>
          </motion.div>

          {/* Quick Actions - Premium */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="premium-card" style={{
              borderColor: 'rgba(99, 102, 241, 0.2)',
              padding: '24px'
            }}>
              <CardHeader style={{ padding: 0, marginBottom: '16px' }}>
                <CardTitle className="text-premium-h3" style={{ color: 'var(--text-primary)' }}>
                  Quick Insights
                </CardTitle>
                <CardDescription className="text-premium-body" style={{
                  color: 'var(--text-tertiary)',
                  marginTop: '4px'
                }}>
                  Ask the AI assistant on the left for detailed analysis
                </CardDescription>
              </CardHeader>
              <CardContent style={{ padding: 0 }}>
                <div className="grid" style={{
                  gap: '12px',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
                }}>
                  {[
                    'Analyze high-risk loans in detail',
                    'Show DPD trend analysis',
                    'Review sector concentration risks',
                    'Identify top NPA accounts',
                    'Generate recovery recommendations',
                    'Compare portfolio health metrics'
                  ].map((action, i) => (
                    <div
                      key={i}
                      className="text-premium-body"
                      style={{
                        borderRadius: '8px',
                        border: '1px solid var(--border-primary)',
                        background: 'var(--bg-tertiary)',
                        padding: '12px',
                        color: 'var(--text-secondary)',
                        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'default',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'
                        e.currentTarget.style.borderColor = 'var(--border-hover)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-tertiary)'
                        e.currentTarget.style.borderColor = 'var(--border-primary)'
                      }}
                    >
                      <span style={{ marginRight: '8px' }}>💡</span>
                      {action}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}

      {/* Loan Detail Modal */}
      <LoanDetailModal />
    </CommandCenterLayout>
  )
}
