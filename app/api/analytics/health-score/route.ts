import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  calculateHealthScore,
  HealthScoreInput,
} from '@/lib/utils/health-score-calculator'

export async function GET(request: NextRequest) {
  try {
    // Get all loans with their latest repayments
    const loans = await prisma.loan.findMany({
      include: {
        repayments: {
          orderBy: { due_date: 'desc' },
          take: 1,
        },
        risk_assessments: {
          orderBy: { assessment_date: 'desc' },
          take: 1,
        },
      },
    })

    const totalLoans = loans.length
    const activeLoans = loans.filter((l) => l.status === 'ACTIVE')
    const npaLoans = loans.filter((l) => l.status === 'NPA')
    const totalOutstanding = loans.reduce(
      (sum, l) => sum + l.outstanding_amount,
      0
    )
    const npaExposure = npaLoans.reduce(
      (sum, l) => sum + l.outstanding_amount,
      0
    )

    // Calculate NPA metrics
    const grossNPARate =
      totalOutstanding > 0 ? (npaExposure / totalOutstanding) * 100 : 0

    // Calculate PAR metrics
    const par30Loans = loans.filter((l) => {
      const latestRepayment = l.repayments[0]
      return (
        latestRepayment &&
        latestRepayment.dpd >= 30 &&
        l.status === 'ACTIVE'
      )
    })

    const par30Rate =
      activeLoans.length > 0
        ? (par30Loans.length / activeLoans.length) * 100
        : 0

    // Calculate average DPD across all active loans
    const activeDPDValues = activeLoans
      .map((l) => l.repayments[0]?.dpd || 0)
      .filter((dpd) => dpd > 0)
    const avgDPD =
      activeDPDValues.length > 0
        ? activeDPDValues.reduce((sum, dpd) => sum + dpd, 0) /
          activeDPDValues.length
        : 0

    // Get all repayments for collection efficiency
    const allRepayments = await prisma.repayment.findMany()
    const totalRepayments = allRepayments.length
    const successfulRepayments = allRepayments.filter(
      (r) => r.payment_status === 'PAID'
    ).length
    const collectionEfficiency =
      totalRepayments > 0 ? (successfulRepayments / totalRepayments) * 100 : 0

    // Calculate risk metrics
    const loansWithRisk = loans.filter(
      (l) => l.risk_assessments && l.risk_assessments.length > 0
    )
    const avgRiskScore =
      loansWithRisk.length > 0
        ? loansWithRisk.reduce(
            (sum, l) => sum + (l.risk_assessments?.[0]?.risk_score || 0),
            0
          ) / loansWithRisk.length
        : 0

    const highRiskLoans = loansWithRisk.filter(
      (l) => l.risk_assessments?.[0]?.risk_category === 'HIGH'
    )

    // Build input for health score calculator
    const input: HealthScoreInput = {
      grossNPARate,
      npaExposure,
      totalExposure: totalOutstanding,
      collectionEfficiency,
      successfulRepayments,
      totalRepayments,
      avgRiskScore,
      highRiskCount: highRiskLoans.length,
      totalLoans,
      par30Rate,
      par30Count: par30Loans.length,
      avgDPD,
    }

    // Calculate health score
    // TODO: Store historical scores in database and pass previousScore for trend calculation
    const healthScore = calculateHealthScore(input)

    return NextResponse.json({
      success: true,
      data: {
        ...healthScore,
        timestamp: new Date().toISOString(),
        portfolioMetrics: {
          totalLoans,
          activeLoans: activeLoans.length,
          npaLoans: npaLoans.length,
          totalExposure: totalOutstanding,
        },
      },
    })
  } catch (error) {
    console.error('Error calculating health score:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate health score',
      },
      { status: 500 }
    )
  }
}
