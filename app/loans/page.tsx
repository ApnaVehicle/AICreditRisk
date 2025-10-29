'use client'

import { useEffect, useState } from 'react'
import { CommandCenterLayout } from '@/components/layout/command-center-layout'
import { AISidebar } from '@/components/layout/ai-sidebar'
import { LoanDetailModal } from '@/components/modals/loan-detail-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, getRiskColor, getStatusColor } from '@/lib/utils'
import { Filter } from 'lucide-react'
import { PageNavigation } from '@/components/navigation/page-navigation'
import { motion } from 'framer-motion'

interface Loan {
  loan_id: string
  customer_name: string
  loan_amount: number
  outstanding_amount: number
  sector: string
  status: string
  risk_score: number
  risk_category: string
  dpd: number
}

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetch('/api/loans/high-risk?limit=50&minRiskScore=0')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setLoans(data.data)
        }
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching loans:', err)
        setLoading(false)
      })
  }, [])

  const filteredLoans = loans.filter(loan => {
    if (filter === 'all') return true
    if (filter === 'high-risk') return loan.risk_category === 'HIGH'
    if (filter === 'medium-risk') return loan.risk_category === 'MEDIUM'
    if (filter === 'low-risk') return loan.risk_category === 'LOW'
    return true
  })

  if (loading) {
    return (
      <CommandCenterLayout
        sidebar={<AISidebar />}
        userName="Shahabaj Sheikh"
        appName="Credit Risk Monitor"
      >
        <div className="flex h-full items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </CommandCenterLayout>
    )
  }

  return (
    <CommandCenterLayout
      sidebar={<AISidebar />}
      userName="Shahabaj Sheikh"
      appName="Credit Risk Monitor"
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
              className="text-premium-h2"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary) 0%, #A78BFA 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Loan Portfolio Explorer
            </h1>
            <p className="text-premium-body" style={{ color: 'var(--text-tertiary)', marginTop: '8px' }}>
              Browse and analyze all loans in the portfolio
            </p>
          </div>
          <div className="flex items-center" style={{ gap: '12px' }}>
            <PageNavigation currentPage="loans" />
            <Badge variant="outline" className="h-8 px-4">
              {filteredLoans.length} Loans
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ marginBottom: '24px' }}
      >
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-premium-h3 flex items-center" style={{ gap: '8px' }}>
              <Filter className="h-5 w-5" style={{ color: 'var(--accent-primary)' }} />
              Filter by Risk Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className="premium-button"
              >
                All Loans
              </Button>
              <Button
                variant={filter === 'high-risk' ? 'default' : 'outline'}
                onClick={() => setFilter('high-risk')}
                className="premium-button"
              >
                High Risk
              </Button>
              <Button
                variant={filter === 'medium-risk' ? 'default' : 'outline'}
                onClick={() => setFilter('medium-risk')}
                className="premium-button"
              >
                Medium Risk
              </Button>
              <Button
                variant={filter === 'low-risk' ? 'default' : 'outline'}
                onClick={() => setFilter('low-risk')}
                className="premium-button"
              >
                Low Risk
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loans Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="premium-card">
          <CardHeader>
            <CardTitle className="text-premium-h3">Loan Portfolio</CardTitle>
            <CardDescription className="text-premium-body" style={{ color: 'var(--text-tertiary)' }}>
              Detailed view of all loans with risk scores and payment status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Loan Amount</th>
                    <th>Outstanding</th>
                    <th>Sector</th>
                    <th>Status</th>
                    <th>Risk Score</th>
                    <th>DPD</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.map(loan => (
                    <tr key={loan.loan_id}>
                      <td>
                        <div>
                          <div className="font-medium">{loan.customer_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {loan.loan_id.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td>{formatCurrency(loan.loan_amount)}</td>
                      <td>{formatCurrency(loan.outstanding_amount)}</td>
                      <td>{loan.sector}</td>
                      <td>
                        <Badge className={getStatusColor(loan.status)} variant="outline">
                          {loan.status}
                        </Badge>
                      </td>
                      <td>
                        <Badge className={getRiskColor(loan.risk_category)} variant="outline">
                          {loan.risk_score.toFixed(0)} - {loan.risk_category}
                        </Badge>
                      </td>
                      <td>
                        <span
                          className={
                            loan.dpd > 30
                              ? 'font-semibold text-red-600'
                              : loan.dpd > 15
                              ? 'font-semibold text-amber-600'
                              : 'text-muted-foreground'
                          }
                        >
                          {loan.dpd} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredLoans.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  No loans found for the selected filter
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loan Detail Modal */}
      <LoanDetailModal />
    </CommandCenterLayout>
  )
}
