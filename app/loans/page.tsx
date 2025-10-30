'use client'

import { useEffect, useState } from 'react'
import { CommandCenterLayout } from '@/components/layout/command-center-layout'
import { AISidebar } from '@/components/layout/ai-sidebar'
import { LoanDetailModal } from '@/components/modals/loan-detail-modal'
import { useLoanModal } from '@/lib/hooks/use-loan-modal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, getRiskColor, getStatusColor } from '@/lib/utils'
import { Filter, ChevronLeft, ChevronRight } from 'lucide-react'
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
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(50)
  const { openModal } = useLoanModal()

  useEffect(() => {
    // Fetch ALL loans from database (removed limit=50)
    fetch('/api/loans/high-risk?limit=2000&minRiskScore=0')
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

  // Filter loans by risk category
  const filteredLoans = loans.filter(loan => {
    if (filter === 'all') return true
    if (filter === 'high-risk') return loan.risk_category === 'HIGH'
    if (filter === 'medium-risk') return loan.risk_category === 'MEDIUM'
    if (filter === 'low-risk') return loan.risk_category === 'LOW'
    return true
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredLoans.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedLoans = filteredLoans.slice(startIndex, endIndex)

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [filter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleItemsPerPageChange = (value: string) => {
    const newValue = value === 'all' ? filteredLoans.length : parseInt(value)
    setItemsPerPage(newValue)
    setCurrentPage(1)
  }

  if (loading) {
    return (
      <CommandCenterLayout
        sidebar={<AISidebar />}
        userName="Shahabaj Sheikh"
        appName="Argus Credit Risk Platform"
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
              Browse and analyze all {loans.length} loans in the portfolio
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
                All Loans ({loans.length})
              </Button>
              <Button
                variant={filter === 'high-risk' ? 'default' : 'outline'}
                onClick={() => setFilter('high-risk')}
                className="premium-button"
              >
                High Risk ({loans.filter(l => l.risk_category === 'HIGH').length})
              </Button>
              <Button
                variant={filter === 'medium-risk' ? 'default' : 'outline'}
                onClick={() => setFilter('medium-risk')}
                className="premium-button"
              >
                Medium Risk ({loans.filter(l => l.risk_category === 'MEDIUM').length})
              </Button>
              <Button
                variant={filter === 'low-risk' ? 'default' : 'outline'}
                onClick={() => setFilter('low-risk')}
                className="premium-button"
              >
                Low Risk ({loans.filter(l => l.risk_category === 'LOW').length})
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Premium Loans Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Card
          className="premium-card"
          style={{
            background: 'rgba(17, 24, 39, 0.5)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
          }}
        >
          <CardHeader style={{ borderBottom: '1px solid var(--border-primary)' }}>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-premium-h3">Loan Portfolio</CardTitle>
                <CardDescription className="text-premium-body" style={{ color: 'var(--text-tertiary)', marginTop: '4px' }}>
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredLoans.length)} of {filteredLoans.length} loans
                </CardDescription>
              </div>
              <div className="flex items-center" style={{ gap: '8px' }}>
                <span className="text-premium-caption" style={{ color: 'var(--text-quaternary)' }}>
                  Show:
                </span>
                <select
                  value={itemsPerPage === filteredLoans.length ? 'all' : itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(e.target.value)}
                  className="premium-button"
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-primary)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                  }}
                >
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent style={{ padding: 0 }}>
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                {/* Premium Table Header */}
                <thead>
                  <tr
                    style={{
                      background: 'var(--bg-tertiary)',
                      borderBottom: '2px solid var(--accent-primary)',
                      position: 'sticky',
                      top: 0,
                      backdropFilter: 'blur(20px)',
                    }}
                  >
                    <th
                      className="text-premium-overline"
                      style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        color: 'var(--text-quaternary)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        fontSize: '11px',
                      }}
                    >
                      Customer
                    </th>
                    <th className="text-premium-overline" style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-quaternary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>
                      Loan Amount
                    </th>
                    <th className="text-premium-overline" style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-quaternary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>
                      Outstanding
                    </th>
                    <th className="text-premium-overline" style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-quaternary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>
                      Sector
                    </th>
                    <th className="text-premium-overline" style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-quaternary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>
                      Status
                    </th>
                    <th className="text-premium-overline" style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-quaternary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>
                      Risk Score
                    </th>
                    <th className="text-premium-overline" style={{ padding: '16px 20px', textAlign: 'left', color: 'var(--text-quaternary)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>
                      DPD
                    </th>
                  </tr>
                </thead>
                {/* Premium Table Body */}
                <tbody>
                  {paginatedLoans.map((loan, index) => (
                    <motion.tr
                      key={loan.loan_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02, duration: 0.3 }}
                      onClick={() => openModal(loan.loan_id)}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(99, 102, 241, 0.08)'
                        e.currentTarget.style.borderLeft = '4px solid var(--accent-primary)'
                        e.currentTarget.style.transform = 'translateX(2px)'
                        e.currentTarget.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.2)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.borderLeft = 'none'
                        e.currentTarget.style.transform = 'translateX(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <td style={{ padding: '16px 20px' }}>
                        <div>
                          <div className="text-premium-body" style={{ color: 'var(--text-primary)', fontWeight: '500' }}>
                            {loan.customer_name}
                          </div>
                          <div className="text-premium-caption" style={{ color: 'var(--text-quaternary)', marginTop: '2px' }}>
                            {loan.loan_id.substring(0, 12)}...
                          </div>
                        </div>
                      </td>
                      <td className="text-premium-body" style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                        {formatCurrency(loan.loan_amount)}
                      </td>
                      <td className="text-premium-body" style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        {formatCurrency(loan.outstanding_amount)}
                      </td>
                      <td className="text-premium-caption" style={{ padding: '16px 20px', color: 'var(--text-tertiary)' }}>
                        {loan.sector}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <Badge className={getStatusColor(loan.status)} variant="outline">
                          {loan.status}
                        </Badge>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <Badge className={getRiskColor(loan.risk_category)} variant="outline">
                          {loan.risk_score.toFixed(0)} - {loan.risk_category}
                        </Badge>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span
                          className="text-premium-body"
                          style={{
                            color: loan.dpd > 30 ? '#EF4444' : loan.dpd > 15 ? '#F59E0B' : 'var(--text-quaternary)',
                            fontWeight: loan.dpd > 15 ? '600' : '400',
                          }}
                        >
                          {loan.dpd} days
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>

              {filteredLoans.length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-premium-body" style={{ color: 'var(--text-tertiary)' }}>
                    No loans found for the selected filter
                  </p>
                </div>
              )}
            </div>
          </CardContent>

          {/* Premium Pagination Controls */}
          {filteredLoans.length > 0 && totalPages > 1 && (
            <div
              style={{
                padding: '20px 24px',
                borderTop: '1px solid var(--border-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'var(--bg-tertiary)',
              }}
            >
              <div className="flex items-center" style={{ gap: '12px' }}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="premium-button"
                >
                  <ChevronLeft className="h-4 w-4" style={{ marginRight: '4px' }} />
                  Previous
                </Button>

                <div className="flex items-center" style={{ gap: '4px' }}>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className="premium-button"
                        style={{
                          padding: '6px 12px',
                          minWidth: '36px',
                          borderRadius: '6px',
                          background: currentPage === pageNum ? 'var(--accent-primary)' : 'transparent',
                          border: currentPage === pageNum ? '1px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                          color: currentPage === pageNum ? '#FFFFFF' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 200ms ease',
                        }}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span style={{ color: 'var(--text-quaternary)', padding: '0 8px' }}>...</span>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="premium-button"
                        style={{
                          padding: '6px 12px',
                          minWidth: '36px',
                          borderRadius: '6px',
                          background: 'transparent',
                          border: '1px solid var(--border-primary)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="premium-button"
                >
                  Next
                  <ChevronRight className="h-4 w-4" style={{ marginLeft: '4px' }} />
                </Button>
              </div>

              <p className="text-premium-caption" style={{ color: 'var(--text-quaternary)' }}>
                Page {currentPage} of {totalPages}
              </p>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Loan Detail Modal */}
      <LoanDetailModal />
    </CommandCenterLayout>
  )
}
