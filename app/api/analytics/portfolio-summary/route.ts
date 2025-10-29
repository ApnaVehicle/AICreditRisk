/**
 * GET /api/analytics/portfolio-summary
 *
 * Returns overall portfolio health metrics including:
 * - Total loans and exposure
 * - NPA rate
 * - Risk distribution
 * - Overdue statistics
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    // Fetch all loans with relationships
    const loans = await prisma.loan.findMany({
      include: {
        risk_assessments: {
          orderBy: {
            assessment_date: 'desc',
          },
          take: 1,
        },
        repayments: {
          orderBy: {
            due_date: 'desc',
          },
          take: 1,
        },
      },
    })

    const totalLoans = loans.length
    const totalExposure = loans.reduce((sum, loan) => sum + loan.outstanding_amount, 0)

    // Count by status
    const activeLoans = loans.filter(l => l.status === 'ACTIVE').length
    const closedLoans = loans.filter(l => l.status === 'CLOSED').length
    const npaLoans = loans.filter(l => l.status === 'NPA').length
    const restructuredLoans = loans.filter(l => l.status === 'RESTRUCTURED').length

    const npaRate = totalLoans > 0 ? (npaLoans / totalLoans) * 100 : 0

    // Count by risk category
    const lowRiskLoans = loans.filter(l => {
      const assessment = l.risk_assessments[0]
      return assessment && assessment.risk_category === 'LOW'
    }).length

    const mediumRiskLoans = loans.filter(l => {
      const assessment = l.risk_assessments[0]
      return assessment && assessment.risk_category === 'MEDIUM'
    }).length

    const highRiskLoans = loans.filter(l => {
      const assessment = l.risk_assessments[0]
      return assessment && assessment.risk_category === 'HIGH'
    }).length

    // Calculate average risk score
    const totalRiskScore = loans.reduce((sum, loan) => {
      const assessment = loan.risk_assessments[0]
      return sum + (assessment?.risk_score || 0)
    }, 0)
    const avgRiskScore = totalLoans > 0 ? totalRiskScore / totalLoans : 0

    // Calculate overdue statistics
    const overdueLoans = loans.filter(l => {
      const latestRepayment = l.repayments[0]
      return latestRepayment && latestRepayment.dpd > 0
    })

    const totalOverdue = overdueLoans.reduce((sum, loan) => sum + loan.outstanding_amount, 0)
    const overduePercentage = totalExposure > 0 ? (totalOverdue / totalExposure) * 100 : 0

    // Calculate average DPD across all loans
    const totalDPD = loans.reduce((sum, loan) => {
      const latestRepayment = loan.repayments[0]
      return sum + (latestRepayment?.dpd || 0)
    }, 0)
    const avgDPD = totalLoans > 0 ? totalDPD / totalLoans : 0

    // High DPD loans (DPD > 15)
    const highDPDLoans = loans.filter(l => {
      const latestRepayment = l.repayments[0]
      return latestRepayment && latestRepayment.dpd > 15
    }).length

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          total_loans: totalLoans,
          total_exposure: Math.round(totalExposure),
          active_loans: activeLoans,
          closed_loans: closedLoans,
          npa_loans: npaLoans,
          restructured_loans: restructuredLoans,
          npa_rate: Math.round(npaRate * 10) / 10,
        },
        risk_distribution: {
          low_risk: lowRiskLoans,
          medium_risk: mediumRiskLoans,
          high_risk: highRiskLoans,
          avg_risk_score: Math.round(avgRiskScore * 10) / 10,
          at_risk_percentage: totalLoans > 0 ? Math.round((highRiskLoans / totalLoans) * 1000) / 10 : 0,
        },
        delinquency: {
          overdue_loans: overdueLoans.length,
          total_overdue_exposure: Math.round(totalOverdue),
          overdue_percentage: Math.round(overduePercentage * 10) / 10,
          avg_dpd: Math.round(avgDPD * 10) / 10,
          high_dpd_loans: highDPDLoans,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching portfolio summary:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch portfolio summary',
      },
      { status: 500 }
    )
  }
}
