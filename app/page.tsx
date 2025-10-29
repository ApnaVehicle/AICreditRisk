'use client'

import { useState, useEffect } from 'react'
import { CommandCenterLayout } from '@/components/layout/command-center-layout'
import { AISidebar } from '@/components/layout/ai-sidebar'
import { LiveInsightsPanel } from '@/components/layout/live-insights-panel'
import { AnimatedProgressRing } from '@/components/dashboard/animated-progress-ring'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, Users, Target, BarChart3 } from 'lucide-react'
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
    >
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                AI Credit Risk Command Center
              </h1>
              <p className="text-muted-foreground mt-1">
                Real-time portfolio monitoring with intelligent insights
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Full Dashboard
                </Button>
              </Link>
              <Link href="/loans">
                <Button variant="outline" size="sm">
                  <Target className="h-4 w-4 mr-2" />
                  Loan Explorer
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

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
          {/* Portfolio Overview */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Portfolio Overview
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="glass-dark hover-lift">
                  <CardHeader>
                    <CardDescription>Total Loans</CardDescription>
                    <CardTitle className="text-3xl tabular-nums">
                      <CountUp end={kpis?.portfolio?.totalLoans || 0} duration={1.5} separator="," />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-emerald-400">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      <span>{kpis?.portfolio?.activeLoans || 0} Active</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="glass-dark hover-lift">
                  <CardHeader>
                    <CardDescription>Total Exposure</CardDescription>
                    <CardTitle className="text-3xl tabular-nums">
                      ₹<CountUp end={(kpis?.portfolio?.totalExposure || 0) / 10000000} duration={1.5} decimals={1} />Cr
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>Outstanding: ₹{((kpis?.portfolio?.totalOutstanding || 0) / 10000000).toFixed(1)}Cr</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="glass-dark hover-lift">
                  <CardHeader>
                    <CardDescription>NPA Loans</CardDescription>
                    <CardTitle className="text-3xl tabular-nums text-red-400">
                      <CountUp end={kpis?.portfolio?.npaLoans || 0} duration={1.5} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-red-400">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      <span>Requires attention</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="glass-dark hover-lift">
                  <CardHeader>
                    <CardDescription>Avg Loan Size</CardDescription>
                    <CardTitle className="text-3xl tabular-nums">
                      ₹<CountUp end={(kpis?.portfolio?.avgLoanSize || 0) / 100000} duration={1.5} decimals={1} />L
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>Per loan average</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>

          {/* Risk Metrics */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              Risk Metrics
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <Card className="glass-dark hover-lift">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-center">Gross NPA Rate</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center pt-4">
                    <AnimatedProgressRing
                      value={kpis?.npa?.grossNPARate || 0}
                      size={120}
                      strokeWidth={10}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Exposure: ₹{((kpis?.npa?.npaExposure || 0) / 10000000).toFixed(2)}Cr
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="glass-dark hover-lift">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-center">Collection Efficiency</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center pt-4">
                    <AnimatedProgressRing
                      value={kpis?.collections?.collectionEfficiency || 0}
                      size={120}
                      strokeWidth={10}
                      color="oklch(0.65 0.18 160)"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpis?.collections?.successfulRepayments || 0}/{kpis?.collections?.totalRepayments || 0} successful
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
              >
                <Card className="glass-dark hover-lift">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-center">PAR 30+ Rate</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center pt-4">
                    <AnimatedProgressRing
                      value={kpis?.delinquency?.par30Rate || 0}
                      size={120}
                      strokeWidth={10}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpis?.delinquency?.par30Count || 0} loans overdue 30+ days
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
              >
                <Card className="glass-dark hover-lift">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-center">Avg Risk Score</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col items-center pt-4">
                    <AnimatedProgressRing
                      value={kpis?.risk?.avgRiskScore || 0}
                      size={120}
                      strokeWidth={10}
                      showPercentage={false}
                      unit=""
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      {kpis?.risk?.highRiskCount || 0} high risk loans
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <Card className="glass-dark border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Quick Insights</CardTitle>
                <CardDescription>Ask the AI assistant on the left for detailed analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                      className="rounded-lg border border-border bg-card/50 p-3 text-sm hover:bg-accent/50 transition-colors cursor-default"
                    >
                      <span className="text-muted-foreground">💡</span> {action}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </CommandCenterLayout>
  )
}
