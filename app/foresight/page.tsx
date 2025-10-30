'use client'

import { useState, useEffect } from 'react'
import { CommandCenterLayout } from '@/components/layout/command-center-layout'
import { AISidebar } from '@/components/layout/ai-sidebar'
import { LiveInsightsPanel } from '@/components/layout/live-insights-panel-enhanced'
import { LoanDetailModal } from '@/components/modals/loan-detail-modal'
import { HealthScoreGauge } from '@/components/foresight/health-score-gauge'
import { SmartActionsPanel } from '@/components/foresight/smart-actions-panel'
import { PredictiveAnalyticsDashboard } from '@/components/foresight/predictive-analytics-dashboard'
import { EarlyWarningSignals } from '@/components/foresight/early-warning-signals'
import { motion } from 'framer-motion'
import { Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageNavigation } from '@/components/navigation/page-navigation'

export default function ForesightPage() {
  const [healthData, setHealthData] = useState<any>(null)
  const [actionsData, setActionsData] = useState<any>(null)
  const [predictionsData, setPredictionsData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)

      // Fetch all three endpoints in parallel
      const [healthRes, actionsRes, predictionsRes] = await Promise.all([
        fetch('/api/analytics/health-score'),
        fetch('/api/analytics/smart-actions'),
        fetch('/api/analytics/predictions'),
      ])

      const [health, actions, predictions] = await Promise.all([
        healthRes.json(),
        actionsRes.json(),
        predictionsRes.json(),
      ])

      if (health.success) setHealthData(health.data)
      if (actions.success) setActionsData(actions.data)
      if (predictions.success) setPredictionsData(predictions.data)
    } catch (error) {
      console.error('Error fetching Foresight data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAllData()
  }

  return (
    <CommandCenterLayout
      sidebar={<AISidebar />}
      insights={<LiveInsightsPanel />}
      userName="Shahabaj Sheikh"
      appName="Argus Credit Risk Platform"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        style={{ marginBottom: '32px' }}
      >
        <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
          <div>
            <h1
              className="text-premium-h2 flex items-center"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #A78BFA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                gap: '12px',
              }}
            >
              <Sparkles className="h-6 w-6" style={{ color: 'var(--accent-primary)' }} />
              Argus Foresight
            </h1>
            <p className="text-premium-body" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
              Predictive risk intelligence powered by machine learning
            </p>
          </div>

          <div className="flex" style={{ gap: '12px', alignItems: 'center' }}>
            <PageNavigation currentPage="foresight" />
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
              size="sm"
              className="premium-button"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                style={{ marginRight: '8px' }}
              />
              {refreshing ? 'Refreshing...' : 'Refresh Data'}
            </Button>
          </div>
        </div>

        {/* Last Updated */}
        {!loading && (healthData || actionsData || predictionsData) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-premium-caption"
            style={{ color: 'var(--text-quaternary)' }}
          >
            Last updated: {new Date(healthData?.timestamp || actionsData?.timestamp || predictionsData?.timestamp).toLocaleString()}
          </motion.p>
        )}
      </motion.div>

      {/* Row 1: Health Score + Smart Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid"
        style={{
          gridTemplateColumns: '2fr 3fr',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        <HealthScoreGauge data={healthData} loading={loading} />
        <SmartActionsPanel actions={actionsData?.actions || []} loading={loading} />
      </motion.div>

      {/* Row 2: Early Warning Signals */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{ marginBottom: '24px' }}
      >
        <EarlyWarningSignals
          data={predictionsData?.earlyWarnings}
          loading={loading}
        />
      </motion.div>

      {/* Row 3: Predictive Analytics Dashboard */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <PredictiveAnalyticsDashboard
          data={predictionsData}
          loading={loading}
        />
      </motion.div>

      {/* Loan Detail Modal */}
      <LoanDetailModal />
    </CommandCenterLayout>
  )
}
