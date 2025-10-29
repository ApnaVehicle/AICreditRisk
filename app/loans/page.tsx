'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, getRiskColor, getStatusColor } from '@/lib/utils'
import { ArrowLeft, Filter, Search } from 'lucide-react'
import Link from 'next/link'
import { PageNavigation } from '@/components/navigation/page-navigation'

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
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Loan Portfolio Explorer</h1>
                <p className="text-sm text-muted-foreground">
                  Browse and analyze all loans in the portfolio
                </p>
              </div>
            </div>
            <div className="flex items-center" style={{ gap: '12px' }}>
              <PageNavigation currentPage="loans" />
              <Badge variant="outline" className="h-8 px-4">
                {filteredLoans.length} Loans
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filter by Risk Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
              >
                All Loans
              </Button>
              <Button
                variant={filter === 'high-risk' ? 'default' : 'outline'}
                onClick={() => setFilter('high-risk')}
              >
                High Risk
              </Button>
              <Button
                variant={filter === 'medium-risk' ? 'default' : 'outline'}
                onClick={() => setFilter('medium-risk')}
              >
                Medium Risk
              </Button>
              <Button
                variant={filter === 'low-risk' ? 'default' : 'outline'}
                onClick={() => setFilter('low-risk')}
              >
                Low Risk
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loans Table */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Portfolio</CardTitle>
            <CardDescription>
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
      </div>
    </div>
  )
}
