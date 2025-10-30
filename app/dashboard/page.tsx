'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { CommandCenterLayout } from '@/components/layout/command-center-layout'
import { AISidebar } from '@/components/layout/ai-sidebar'
import { PageNavigation } from '@/components/navigation/page-navigation'
import { FilterPanel } from '@/components/dashboard/filter-panel'
import { useFilterStore } from '@/lib/stores/filter-store'
import { ExecutiveSummary } from '@/components/dashboard/executive-summary'
import { PARCascade } from '@/components/dashboard/par-cascade'
import { ConcentrationHeatmap } from '@/components/dashboard/concentration-heatmap'
import { VintageAnalysis } from '@/components/dashboard/vintage-analysis'
import { CollectionFunnel } from '@/components/dashboard/collection-funnel'
import { BarChart3, TrendingUp, Activity, Info } from 'lucide-react'

export default function DashboardPage() {
  const { getQueryParams } = useFilterStore()
  const [refreshKey, setRefreshKey] = useState(0)

  const handleFilterChange = () => {
    setRefreshKey((prev) => prev + 1)
  }

  const queryParams = getQueryParams().toString()

  return (
    <CommandCenterLayout
      sidebar={<AISidebar />}
      userName="Shahabaj Sheikh"
      appName="Argus Credit Risk Platform"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Title and Navigation */}
          <div className="flex items-start justify-between">
            <div style={{ flex: 1 }}>
              <div className="flex items-center" style={{ gap: '16px', marginBottom: '12px' }}>
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                    boxShadow: '0 0 24px rgba(99, 102, 241, 0.4)',
                  }}
                >
                  <BarChart3 className="text-white" size={28} />
                </div>
                <div>
                  <h1
                    className="text-premium-hero"
                    style={{
                      background: 'linear-gradient(135deg, #F9FAFB 0%, #9CA3AF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontWeight: '700',
                      letterSpacing: '-0.03em',
                    }}
                  >
                    Business Intelligence Dashboard
                  </h1>
                  <p
                    className="text-premium-body"
                    style={{
                      color: 'var(--text-tertiary)',
                      marginTop: '4px',
                    }}
                  >
                    Comprehensive portfolio analytics and risk insights
                  </p>
                </div>
              </div>
            </div>

            <PageNavigation currentPage="dashboard" />
          </div>

          {/* Info Banner */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '10px',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Info size={18} style={{ color: '#3B82F6', flexShrink: 0 }} />
            <p
              className="text-premium-body"
              style={{
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
              }}
            >
              Real-time portfolio analytics powered by advanced risk models. All metrics calculated from live database.
            </p>
          </div>
        </motion.div>

        {/* Filter Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
        >
          <FilterPanel onFilterChange={handleFilterChange} />
        </motion.div>

        {/* Section 1: Executive Summary KPIs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        >
          <div style={{ marginBottom: '20px' }}>
            <div className="flex items-center" style={{ gap: '12px', marginBottom: '8px' }}>
              <TrendingUp size={20} style={{ color: 'var(--accent-primary)' }} />
              <h2 className="text-premium-h2" style={{ color: 'var(--text-primary)' }}>
                Executive Overview
              </h2>
            </div>
            <p className="text-premium-body" style={{ color: 'var(--text-tertiary)' }}>
              Top-level portfolio health indicators and key performance metrics
            </p>
          </div>
          <ExecutiveSummary key={`exec-${refreshKey}`} queryParams={queryParams} />
        </motion.section>

        {/* Section 2: PAR Cascade */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          <PARCascade key={`par-${refreshKey}`} queryParams={queryParams} />
        </motion.section>

        {/* Section 3: Two Column Layout - Concentration and Vintage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
          }}
        >
          {/* Concentration Risk */}
          <div>
            <ConcentrationHeatmap key={`conc-${refreshKey}`} queryParams={queryParams} />
          </div>

          {/* Vintage Analysis */}
          <div>
            <VintageAnalysis key={`vintage-${refreshKey}`} queryParams={queryParams} />
          </div>
        </motion.div>

        {/* Section 4: Collection Funnel (Full Width) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
        >
          <CollectionFunnel key={`funnel-${refreshKey}`} queryParams={queryParams} />
        </motion.section>

        {/* Section 5: Data Freshness Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          style={{
            padding: '16px 20px',
            borderRadius: '10px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div className="flex items-center" style={{ gap: '12px' }}>
            <Activity size={16} style={{ color: '#10B981' }} />
            <div>
              <p
                className="text-premium-caption"
                style={{
                  color: 'var(--text-secondary)',
                  fontWeight: '600',
                }}
              >
                Live Data Source
              </p>
              <p
                className="text-premium-caption"
                style={{
                  color: 'var(--text-quaternary)',
                }}
              >
                All analytics computed from Prisma ORM with PostgreSQL
              </p>
            </div>
          </div>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <p
              className="text-premium-caption"
              style={{
                color: '#10B981',
                fontWeight: '600',
              }}
            >
              Real-time
            </p>
          </div>
        </motion.div>

        {/* Bottom Spacer */}
        <div style={{ height: '32px' }} />
      </div>
    </CommandCenterLayout>
  )
}
