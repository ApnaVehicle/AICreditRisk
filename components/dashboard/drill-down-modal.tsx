'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatPercentage } from '@/lib/utils'

interface DrillDownData {
  title: string
  subtitle?: string
  metrics: Array<{
    label: string
    value: string | number
    badge?: string
    badgeVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'warning'
  }>
  loans?: Array<{
    id: string
    customer_name: string
    loan_amount: number
    outstanding_amount: number
    status: string
    risk_score?: number
    days_past_due?: number | null
  }>
}

interface DrillDownModalProps {
  isOpen: boolean
  onClose: () => void
  data: DrillDownData | null
}

export function DrillDownModal({ isOpen, onClose, data }: DrillDownModalProps) {
  if (!data) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data.title}</DialogTitle>
          {data.subtitle && <DialogDescription>{data.subtitle}</DialogDescription>}
        </DialogHeader>

        {/* Key Metrics */}
        <div className="grid gap-4 py-4 md:grid-cols-3">
          {data.metrics.map((metric, index) => (
            <div key={index} className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">{metric.label}</div>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-2xl font-bold">{metric.value}</div>
                {metric.badge && (
                  <Badge variant={metric.badgeVariant || 'outline'} className="text-xs">
                    {metric.badge}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Loans Table */}
        {data.loans && data.loans.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-3 font-semibold">Loans in this segment</h4>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left font-semibold">Loan ID</th>
                    <th className="p-3 text-left font-semibold">Customer</th>
                    <th className="p-3 text-right font-semibold">Loan Amount</th>
                    <th className="p-3 text-right font-semibold">Outstanding</th>
                    <th className="p-3 text-center font-semibold">Status</th>
                    {data.loans[0].risk_score !== undefined && (
                      <th className="p-3 text-center font-semibold">Risk Score</th>
                    )}
                    {data.loans[0].days_past_due !== undefined && (
                      <th className="p-3 text-center font-semibold">DPD</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {data.loans.slice(0, 20).map((loan) => (
                    <tr key={loan.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-mono text-xs">{loan.id.slice(0, 8)}...</td>
                      <td className="p-3">{loan.customer_name}</td>
                      <td className="p-3 text-right font-mono">
                        {formatCurrency(loan.loan_amount)}
                      </td>
                      <td className="p-3 text-right font-mono">
                        {formatCurrency(loan.outstanding_amount)}
                      </td>
                      <td className="p-3 text-center">
                        <Badge
                          variant={
                            loan.status === 'ACTIVE'
                              ? 'success'
                              : loan.status === 'NPA'
                              ? 'destructive'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {loan.status}
                        </Badge>
                      </td>
                      {loan.risk_score !== undefined && (
                        <td className="p-3 text-center">
                          <Badge
                            variant={
                              loan.risk_score >= 66
                                ? 'destructive'
                                : loan.risk_score >= 36
                                ? 'warning'
                                : 'success'
                            }
                            className="text-xs"
                          >
                            {loan.risk_score.toFixed(0)}
                          </Badge>
                        </td>
                      )}
                      {loan.days_past_due !== undefined && (
                        <td className="p-3 text-center">
                          {loan.days_past_due !== null && loan.days_past_due > 0 ? (
                            <Badge variant="warning" className="text-xs">
                              {loan.days_past_due} days
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.loans.length > 20 && (
                <div className="border-t bg-muted/30 p-3 text-center text-xs text-muted-foreground">
                  Showing 20 of {data.loans.length} loans
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
