/**
 * Loan Detail Modal Component
 *
 * Displays comprehensive loan information with AI-powered insights
 * Includes:
 * - Customer & loan details
 * - Payment statistics
 * - Risk assessment
 * - AI-generated summary and action items
 */

'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { useLoanModal } from '@/lib/hooks/use-loan-modal'
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Briefcase,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  BarChart3,
  Lightbulb,
  ArrowRight,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

interface LoanData {
  loan: any
  customer: any
  payment_statistics: any
  risk_assessment: any
  repayments: any[]
}

interface AISummary {
  executive_summary: string
  risk_narrative: string
  action_items: Array<{
    title: string
    description: string
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
  }>
  next_steps: string
}

export function LoanDetailModal() {
  const { isOpen, loanId, closeModal } = useLoanModal()
  const [loanData, setLoanData] = useState<LoanData | null>(null)
  const [aiSummary, setAiSummary] = useState<AISummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch loan data when modal opens
  useEffect(() => {
    if (isOpen && loanId) {
      fetchLoanData(loanId)
      fetchAISummary(loanId)
    } else {
      // Reset state when modal closes
      setLoanData(null)
      setAiSummary(null)
      setError(null)
    }
  }, [isOpen, loanId])

  const fetchLoanData = async (id: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/loans/${id}`)
      if (!response.ok) throw new Error('Failed to fetch loan details')
      const result = await response.json()
      setLoanData(result.data)
    } catch (err: any) {
      setError(err.message || 'Failed to load loan details')
      console.error('Error fetching loan data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchAISummary = async (id: string) => {
    setAiLoading(true)
    try {
      const response = await fetch(`/api/loans/${id}/ai-summary`)
      if (!response.ok) throw new Error('Failed to fetch AI summary')
      const result = await response.json()
      setAiSummary(result.data)
    } catch (err: any) {
      console.error('Error fetching AI summary:', err)
      // Don't set error - AI summary is optional
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-hidden p-0"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        }}
      >
        {/* Always include DialogTitle for accessibility */}
        <DialogHeader className="sr-only">
          <DialogTitle>
            {loading ? 'Loading Loan Details' : error ? 'Error Loading Loan' : 'Loan Details'}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto custom-scrollbar" style={{ maxHeight: '90vh' }}>
          {loading && <LoadingState />}
          {error && <ErrorState error={error} onClose={closeModal} />}
          {!loading && !error && loanData && (
            <>
              <div
                className="px-8 py-6 border-b"
                style={{ borderColor: 'var(--border-primary)' }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-premium-h2" style={{ color: 'var(--text-primary)' }}>
                      Loan Details
                    </h2>
                    <p className="text-premium-body mt-2" style={{ color: 'var(--text-secondary)' }}>
                      Comprehensive analysis for {loanData.customer.customer_name}
                    </p>
                  </div>
                  <StatusBadge status={loanData.loan.status} />
                </div>
              </div>

              <div className="px-8 py-6 space-y-6">
                {/* Customer & Loan Details Section */}
                <div className="grid grid-cols-2 gap-6">
                  <CustomerInfoCard customer={loanData.customer} />
                  <LoanInfoCard loan={loanData.loan} />
                </div>

                {/* Payment Statistics & Risk Assessment */}
                <div className="grid grid-cols-2 gap-6">
                  <PaymentStatsCard stats={loanData.payment_statistics} />
                  <RiskAssessmentCard assessment={loanData.risk_assessment} />
                </div>

                {/* AI Insights Section */}
                {aiLoading && <AILoadingState />}
                {!aiLoading && aiSummary && <AIInsightsSection summary={aiSummary} />}

                {/* Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                  <Link
                    href={`/loans/${loanId}`}
                    className="text-premium-body flex items-center gap-2 hover:underline"
                    style={{ color: 'var(--accent-primary)' }}
                    onClick={closeModal}
                  >
                    View Full Loan Details
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={closeModal}
                    className="px-6 py-2 rounded-lg text-premium-body font-medium transition-all"
                    style={{
                      background: 'var(--accent-primary)',
                      color: '#FFFFFF',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ===== SUB-COMPONENTS =====

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <Loader2 className="h-12 w-12 animate-spin" style={{ color: 'var(--accent-primary)' }} />
      <p className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
        Loading loan details...
      </p>
    </div>
  )
}

function ErrorState({ error, onClose }: { error: string; onClose: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4 px-8">
      <AlertTriangle className="h-12 w-12" style={{ color: 'var(--danger-primary)' }} />
      <p className="text-premium-h3" style={{ color: 'var(--text-primary)' }}>
        Failed to Load Loan
      </p>
      <p className="text-premium-body text-center" style={{ color: 'var(--text-secondary)' }}>
        {error}
      </p>
      <button
        onClick={onClose}
        className="mt-4 px-6 py-2 rounded-lg text-premium-body font-medium"
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-primary)',
          color: 'var(--text-primary)',
        }}
      >
        Close
      </button>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const getStatusColor = () => {
    switch (status) {
      case 'ACTIVE':
        return { bg: 'rgba(16, 185, 129, 0.1)', text: '#10B981', border: 'rgba(16, 185, 129, 0.2)' }
      case 'CLOSED':
        return { bg: 'rgba(107, 114, 128, 0.1)', text: '#9CA3AF', border: 'rgba(107, 114, 128, 0.2)' }
      case 'NPA':
        return { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' }
      case 'RESTRUCTURED':
        return { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' }
      default:
        return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.2)' }
    }
  }

  const colors = getStatusColor()

  return (
    <span
      className="px-3 py-1 rounded-full text-premium-label font-semibold"
      style={{
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {status}
    </span>
  )
}

function CustomerInfoCard({ customer }: { customer: any }) {
  const monthlyIncomeLakhs = (customer.monthly_income / 100000).toFixed(2)

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="p-2 rounded-lg"
          style={{ background: 'rgba(99, 102, 241, 0.1)' }}
        >
          <User className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h3 className="text-premium-h3" style={{ color: 'var(--text-primary)' }}>
          Customer Profile
        </h3>
      </div>

      <div className="space-y-3">
        <InfoRow
          icon={<User className="h-4 w-4" />}
          label="Name"
          value={customer.customer_name}
        />
        <InfoRow
          icon={<Calendar className="h-4 w-4" />}
          label="Age"
          value={`${customer.age} years`}
        />
        <InfoRow
          icon={<DollarSign className="h-4 w-4" />}
          label="Monthly Income"
          value={`₹${monthlyIncomeLakhs}L`}
        />
        <InfoRow
          icon={<CreditCard className="h-4 w-4" />}
          label="Credit Score"
          value={`${customer.credit_score}/850`}
        />
        <InfoRow
          icon={<Briefcase className="h-4 w-4" />}
          label="Employment"
          value={customer.employment_status}
        />
        <InfoRow
          icon={<BarChart3 className="h-4 w-4" />}
          label="DTI Ratio"
          value={`${(customer.dti_ratio * 100).toFixed(1)}%`}
        />
        <InfoRow
          icon={<MapPin className="h-4 w-4" />}
          label="Location"
          value={customer.geography}
        />
      </div>
    </div>
  )
}

function LoanInfoCard({ loan }: { loan: any }) {
  const loanAmountLakhs = (loan.loan_amount / 100000).toFixed(2)
  const outstandingLakhs = (loan.outstanding_amount / 100000).toFixed(2)

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="p-2 rounded-lg"
          style={{ background: 'rgba(99, 102, 241, 0.1)' }}
        >
          <DollarSign className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h3 className="text-premium-h3" style={{ color: 'var(--text-primary)' }}>
          Loan Information
        </h3>
      </div>

      <div className="space-y-3">
        <InfoRow
          icon={<DollarSign className="h-4 w-4" />}
          label="Loan Amount"
          value={`₹${loanAmountLakhs}L`}
        />
        <InfoRow
          icon={<TrendingDown className="h-4 w-4" />}
          label="Outstanding"
          value={`₹${outstandingLakhs}L`}
        />
        <InfoRow
          icon={<BarChart3 className="h-4 w-4" />}
          label="Interest Rate"
          value={`${loan.interest_rate}% p.a.`}
        />
        <InfoRow
          icon={<Clock className="h-4 w-4" />}
          label="Tenure"
          value={`${loan.loan_tenure_months} months`}
        />
        <InfoRow
          icon={<Briefcase className="h-4 w-4" />}
          label="Sector"
          value={loan.sector}
        />
        <InfoRow
          icon={<CreditCard className="h-4 w-4" />}
          label="Loan Type"
          value={loan.loan_type}
        />
        <InfoRow
          icon={<Calendar className="h-4 w-4" />}
          label="Disbursement"
          value={new Date(loan.disbursement_date).toLocaleDateString('en-IN')}
        />
      </div>
    </div>
  )
}

function PaymentStatsCard({ stats }: { stats: any }) {
  const paymentRate = stats.payment_rate || 0

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="p-2 rounded-lg"
          style={{ background: 'rgba(16, 185, 129, 0.1)' }}
        >
          <CheckCircle2 className="h-5 w-5" style={{ color: '#10B981' }} />
        </div>
        <h3 className="text-premium-h3" style={{ color: 'var(--text-primary)' }}>
          Payment Performance
        </h3>
      </div>

      <div className="space-y-4">
        {/* Payment Rate Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
              Payment Rate
            </span>
            <span className="text-premium-body font-semibold" style={{ color: paymentRate >= 80 ? '#10B981' : paymentRate >= 60 ? '#F59E0B' : '#EF4444' }}>
              {paymentRate}%
            </span>
          </div>
          <div className="h-2 rounded-full" style={{ background: 'var(--bg-secondary)' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${paymentRate}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full"
              style={{
                background: paymentRate >= 80 ? '#10B981' : paymentRate >= 60 ? '#F59E0B' : '#EF4444',
              }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatBox label="Total" value={stats.total_payments} color="#3B82F6" />
          <StatBox label="Paid" value={stats.paid_payments} color="#10B981" />
          <StatBox label="Delayed" value={stats.delayed_payments} color="#F59E0B" />
          <StatBox label="Missed" value={stats.missed_payments} color="#EF4444" />
        </div>

        <InfoRow
          icon={<Clock className="h-4 w-4" />}
          label="Avg DPD"
          value={`${stats.avg_dpd} days`}
        />
      </div>
    </div>
  )
}

function RiskAssessmentCard({ assessment }: { assessment: any }) {
  if (!assessment) {
    return (
      <div
        className="p-6 rounded-xl flex items-center justify-center"
        style={{
          background: 'var(--bg-tertiary)',
          border: '1px solid var(--border-primary)',
        }}
      >
        <p className="text-premium-body" style={{ color: 'var(--text-quaternary)' }}>
          No risk assessment available
        </p>
      </div>
    )
  }

  const riskScore = assessment.risk_score || 0
  const getRiskColor = () => {
    if (riskScore >= 70) return '#EF4444'
    if (riskScore >= 40) return '#F59E0B'
    return '#10B981'
  }

  const riskFlags = assessment.flags
    ? Object.entries(assessment.flags)
        .filter(([_, value]) => value === true)
        .map(([key, _]) => key.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()))
    : []

  return (
    <div
      className="p-6 rounded-xl"
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div
          className="p-2 rounded-lg"
          style={{ background: 'rgba(239, 68, 68, 0.1)' }}
        >
          <AlertTriangle className="h-5 w-5" style={{ color: '#EF4444' }} />
        </div>
        <h3 className="text-premium-h3" style={{ color: 'var(--text-primary)' }}>
          Risk Assessment
        </h3>
      </div>

      <div className="space-y-4">
        {/* Risk Score Circle */}
        <div className="flex items-center justify-center py-4">
          <div className="relative">
            <svg width="120" height="120" className="transform -rotate-90">
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="var(--bg-secondary)"
                strokeWidth="8"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke={getRiskColor()}
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ strokeDasharray: '0 314' }}
                animate={{ strokeDasharray: `${(riskScore / 100) * 314} 314` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-premium-metric-lg font-bold" style={{ color: getRiskColor() }}>
                {Math.round(riskScore)}
              </span>
              <span className="text-premium-caption" style={{ color: 'var(--text-quaternary)' }}>
                / 100
              </span>
            </div>
          </div>
        </div>

        <InfoRow
          icon={<BarChart3 className="h-4 w-4" />}
          label="Category"
          value={assessment.risk_category}
        />

        {riskFlags.length > 0 && (
          <div>
            <p className="text-premium-label mb-2" style={{ color: 'var(--text-quaternary)' }}>
              Risk Flags
            </p>
            <div className="flex flex-wrap gap-2">
              {riskFlags.map((flag: string, i: number) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded text-premium-caption"
                  style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: '#EF4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                  }}
                >
                  {flag}
                </span>
              ))}
            </div>
          </div>
        )}

        {assessment.notes && (
          <div>
            <p className="text-premium-label mb-2" style={{ color: 'var(--text-quaternary)' }}>
              Notes
            </p>
            <p className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
              {assessment.notes}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function AILoadingState() {
  return (
    <div
      className="p-8 rounded-xl"
      style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-center justify-center space-x-3 py-8">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--accent-primary)' }} />
        <p className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
          Generating AI insights...
        </p>
      </div>
    </div>
  )
}

function AIInsightsSection({ summary }: { summary: AISummary }) {
  return (
    <div
      className="p-8 rounded-xl space-y-6"
      style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
        border: '1px solid var(--border-primary)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ background: 'rgba(99, 102, 241, 0.15)' }}
        >
          <Lightbulb className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
        </div>
        <h3 className="text-premium-h3" style={{ color: 'var(--text-primary)' }}>
          AI-Powered Insights
        </h3>
      </div>

      {/* Executive Summary */}
      <div
        className="p-4 rounded-lg"
        style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.15)',
        }}
      >
        <p className="text-premium-body leading-relaxed" style={{ color: 'var(--text-primary)' }}>
          {summary.executive_summary}
        </p>
      </div>

      {/* Risk Narrative */}
      {summary.risk_narrative && (
        <div>
          <h4 className="text-premium-h3 mb-2" style={{ color: 'var(--text-primary)' }}>
            Risk Analysis
          </h4>
          <p className="text-premium-body leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {summary.risk_narrative}
          </p>
        </div>
      )}

      {/* Action Items */}
      {summary.action_items && summary.action_items.length > 0 && (
        <div>
          <h4 className="text-premium-h3 mb-3" style={{ color: 'var(--text-primary)' }}>
            Recommended Actions
          </h4>
          <div className="space-y-3">
            {summary.action_items.map((item, index) => (
              <ActionItemCard key={index} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {summary.next_steps && (
        <div
          className="p-4 rounded-lg flex items-start gap-3"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-primary)',
          }}
        >
          <ArrowRight className="h-5 w-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h4 className="text-premium-label font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
              Next Steps
            </h4>
            <p className="text-premium-body" style={{ color: 'var(--text-primary)' }}>
              {summary.next_steps}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function ActionItemCard({ item }: { item: { title: string; description: string; priority: string } }) {
  const getPriorityColor = () => {
    switch (item.priority) {
      case 'HIGH':
        return { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.2)' }
      case 'MEDIUM':
        return { bg: 'rgba(245, 158, 11, 0.1)', text: '#F59E0B', border: 'rgba(245, 158, 11, 0.2)' }
      case 'LOW':
        return { bg: 'rgba(59, 130, 246, 0.1)', text: '#3B82F6', border: 'rgba(59, 130, 246, 0.2)' }
      default:
        return { bg: 'rgba(107, 114, 128, 0.1)', text: '#9CA3AF', border: 'rgba(107, 114, 128, 0.2)' }
    }
  }

  const colors = getPriorityColor()

  return (
    <div
      className="p-4 rounded-lg"
      style={{
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <h5 className="text-premium-body font-semibold" style={{ color: 'var(--text-primary)' }}>
          {item.title}
        </h5>
        <span
          className="px-2 py-0.5 rounded text-premium-caption font-semibold flex-shrink-0 ml-3"
          style={{
            background: colors.bg,
            color: colors.text,
            border: `1px solid ${colors.border}`,
          }}
        >
          {item.priority}
        </span>
      </div>
      <p className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
        {item.description}
      </p>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--text-quaternary)' }}>{icon}</span>
        <span className="text-premium-body" style={{ color: 'var(--text-secondary)' }}>
          {label}
        </span>
      </div>
      <span className="text-premium-body font-medium" style={{ color: 'var(--text-primary)' }}>
        {value}
      </span>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="p-3 rounded-lg"
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
      }}
    >
      <p className="text-premium-caption" style={{ color: 'var(--text-quaternary)' }}>
        {label}
      </p>
      <p className="text-premium-h3 font-bold mt-1" style={{ color }}>
        {value}
      </p>
    </div>
  )
}
