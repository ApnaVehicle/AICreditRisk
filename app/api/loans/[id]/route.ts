/**
 * GET /api/loans/[id]
 *
 * Returns detailed information about a specific loan including:
 * - Loan details
 * - Customer information
 * - Complete repayment history
 * - Risk assessment history
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: loanId } = await params

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        customer: true,
        repayments: {
          orderBy: {
            due_date: 'desc',
          },
        },
        risk_assessments: {
          orderBy: {
            assessment_date: 'desc',
          },
        },
      },
    })

    if (!loan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Loan not found',
        },
        { status: 404 }
      )
    }

    // Calculate payment statistics
    const totalPayments = loan.repayments.length
    const paidPayments = loan.repayments.filter(r => r.payment_status === 'PAID').length
    const delayedPayments = loan.repayments.filter(r => r.dpd > 0).length
    const missedPayments = loan.repayments.filter(r => r.payment_status === 'MISSED').length

    const avgDPD =
      totalPayments > 0
        ? loan.repayments.reduce((sum, r) => sum + r.dpd, 0) / totalPayments
        : 0

    // Get latest assessment
    const latestAssessment = loan.risk_assessments[0]

    // Format response
    return NextResponse.json({
      success: true,
      data: {
        loan: {
          id: loan.id,
          loan_amount: loan.loan_amount,
          outstanding_amount: loan.outstanding_amount,
          interest_rate: loan.interest_rate,
          loan_tenure_months: loan.loan_tenure_months,
          sector: loan.sector,
          loan_type: loan.loan_type,
          status: loan.status,
          disbursement_date: loan.disbursement_date,
          next_due_date: loan.next_due_date,
        },
        customer: {
          id: loan.customer.id,
          customer_name: loan.customer.customer_name,
          age: loan.customer.age,
          monthly_income: loan.customer.monthly_income,
          credit_score: loan.customer.credit_score,
          employment_status: loan.customer.employment_status,
          dti_ratio: loan.customer.dti_ratio,
          geography: loan.customer.geography,
          registration_date: loan.customer.registration_date,
        },
        payment_statistics: {
          total_payments: totalPayments,
          paid_payments: paidPayments,
          delayed_payments: delayedPayments,
          missed_payments: missedPayments,
          avg_dpd: Math.round(avgDPD * 10) / 10,
          payment_rate: totalPayments > 0 ? Math.round((paidPayments / totalPayments) * 100) : 0,
        },
        repayments: loan.repayments.map(r => ({
          id: r.id,
          emi_amount: r.emi_amount,
          due_date: r.due_date,
          payment_date: r.payment_date,
          payment_status: r.payment_status,
          dpd: r.dpd,
          payment_amount: r.payment_amount,
        })),
        risk_assessment: latestAssessment
          ? {
              risk_score: latestAssessment.risk_score,
              risk_category: latestAssessment.risk_category,
              assessment_date: latestAssessment.assessment_date,
              flags: JSON.parse(latestAssessment.flags),
              notes: latestAssessment.notes,
            }
          : null,
        risk_history: loan.risk_assessments.map(a => ({
          risk_score: a.risk_score,
          risk_category: a.risk_category,
          assessment_date: a.assessment_date,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching loan details:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch loan details',
      },
      { status: 500 }
    )
  }
}
