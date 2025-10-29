import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  generateSmartActions,
  PortfolioMetrics,
} from '@/lib/utils/action-generator'

export async function GET(request: NextRequest) {
  try {
    // Get all loans with relationships
    const loans = await prisma.loan.findMany({
      include: {
        customer: true,
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
    const totalExposure = loans.reduce(
      (sum, l) => sum + l.outstanding_amount,
      0
    )
    const npaExposure = npaLoans.reduce(
      (sum, l) => sum + l.outstanding_amount,
      0
    )

    // Calculate PAR metrics
    const par30Loans = loans.filter((l) => {
      const latestRepayment = l.repayments[0]
      return (
        latestRepayment &&
        latestRepayment.dpd >= 30 &&
        l.status === 'ACTIVE'
      )
    })

    const par60Loans = loans.filter((l) => {
      const latestRepayment = l.repayments[0]
      return (
        latestRepayment &&
        latestRepayment.dpd >= 60 &&
        l.status === 'ACTIVE'
      )
    })

    const par90Loans = loans.filter((l) => {
      const latestRepayment = l.repayments[0]
      return (
        latestRepayment &&
        latestRepayment.dpd >= 90 &&
        l.status === 'ACTIVE'
      )
    })

    const par90Exposure = par90Loans.reduce(
      (sum, l) => sum + l.outstanding_amount,
      0
    )

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

    // Calculate collection efficiency
    const allRepayments = await prisma.repayment.findMany()
    const totalRepayments = allRepayments.length
    const successfulRepayments = allRepayments.filter(
      (r) => r.payment_status === 'PAID'
    ).length
    const collectionEfficiency =
      totalRepayments > 0 ? (successfulRepayments / totalRepayments) * 100 : 0

    // Calculate overdue amount
    const overdueRepayments = allRepayments.filter(
      (r) => r.payment_status === 'MISSED' || r.payment_status === 'DELAYED'
    )
    const overdueAmount = overdueRepayments.reduce(
      (sum, r) => sum + r.emi_amount,
      0
    )

    // Calculate sector concentration
    const sectorExposures = new Map<
      string,
      { count: number; exposure: number }
    >()
    loans.forEach((loan) => {
      const current = sectorExposures.get(loan.sector) || {
        count: 0,
        exposure: 0,
      }
      sectorExposures.set(loan.sector, {
        count: current.count + 1,
        exposure: current.exposure + loan.outstanding_amount,
      })
    })

    // Convert to array and calculate percentages
    const sectorConcentration = Array.from(sectorExposures.entries())
      .map(([sector, data]) => ({
        sector,
        count: data.count,
        exposure: data.exposure,
        percentage: totalLoans > 0 ? (data.count / totalLoans) * 100 : 0,
      }))
      .sort((a, b) => b.exposure - a.exposure) // Sort by exposure descending

    // Build portfolio metrics
    const metrics: PortfolioMetrics = {
      totalLoans,
      npaLoans: npaLoans.length,
      totalExposure,
      npaExposure,
      highRiskCount: highRiskLoans.length,
      avgRiskScore,
      par30Count: par30Loans.length,
      par60Count: par60Loans.length,
      par90Count: par90Loans.length,
      par90Exposure,
      collectionEfficiency,
      overdueAmount,
      sectorConcentration,
      // TODO: Calculate weekly changes from historical data
      // weeklyChanges: {
      //   npaIncrease: 0,
      //   riskScoreChange: 0,
      //   dpdIncrease: 0,
      // },
    }

    // Generate smart actions
    const actions = generateSmartActions(metrics)

    return NextResponse.json({
      success: true,
      data: {
        actions,
        timestamp: new Date().toISOString(),
        portfolioSnapshot: {
          totalLoans,
          activeLoans: activeLoans.length,
          npaLoans: npaLoans.length,
          highRiskLoans: highRiskLoans.length,
          par90Count: par90Loans.length,
          collectionEfficiency: Math.round(collectionEfficiency * 10) / 10,
        },
      },
    })
  } catch (error) {
    console.error('Error generating smart actions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate smart actions',
      },
      { status: 500 }
    )
  }
}
