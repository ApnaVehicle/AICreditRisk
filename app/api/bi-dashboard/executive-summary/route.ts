import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/bi-dashboard/executive-summary
 *
 * Returns executive-level KPIs with trends and sparkline data
 *
 * Metrics:
 * 1. Portfolio Quality Index (PQI) - Composite health score (0-100)
 * 2. Gross NPA Rate - Percentage of non-performing assets
 * 3. Collection Efficiency - Percentage of successful collections
 * 4. Credit Cost Ratio - Provisions and write-offs as % of portfolio
 */

export async function GET(request: NextRequest) {
  try {
    // Fetch all loans with relationships
    const loans = await prisma.loan.findMany({
      include: {
        customer: true,
        repayments: {
          orderBy: { due_date: 'desc' },
        },
        risk_assessments: {
          orderBy: { assessment_date: 'desc' },
          take: 1,
        },
      },
    })

    const allRepayments = await prisma.repayment.findMany({
      orderBy: { due_date: 'asc' },
    })

    // Calculate total exposure
    const totalExposure = loans.reduce((sum, loan) => sum + loan.outstanding_amount, 0)
    const totalDisbursed = loans.reduce((sum, loan) => sum + loan.loan_amount, 0)

    // ========================================
    // 1. GROSS NPA RATE
    // ========================================
    const npaLoans = loans.filter((l) => l.status === 'NPA')
    const npaExposure = npaLoans.reduce((sum, l) => sum + l.outstanding_amount, 0)
    const grossNPARate = totalExposure > 0 ? (npaExposure / totalExposure) * 100 : 0

    // Calculate NPA trend (last 6 months)
    // For now, we'll simulate trend based on current data
    // In production, this would query historical snapshots
    const npaSparkline = [
      Math.max(0, grossNPARate - 1.5),
      Math.max(0, grossNPARate - 1.2),
      Math.max(0, grossNPARate - 0.8),
      Math.max(0, grossNPARate - 0.5),
      Math.max(0, grossNPARate - 0.2),
      grossNPARate,
    ]

    // ========================================
    // 2. COLLECTION EFFICIENCY
    // ========================================
    const totalRepayments = allRepayments.length
    const successfulRepayments = allRepayments.filter(
      (r) => r.payment_status === 'PAID'
    ).length
    const collectionEfficiency =
      totalRepayments > 0 ? (successfulRepayments / totalRepayments) * 100 : 0

    // Collection efficiency trend
    const collectionSparkline = [
      Math.min(100, collectionEfficiency - 3),
      Math.min(100, collectionEfficiency - 2.5),
      Math.min(100, collectionEfficiency - 1.8),
      Math.min(100, collectionEfficiency - 1.2),
      Math.min(100, collectionEfficiency - 0.5),
      collectionEfficiency,
    ]

    // ========================================
    // 3. CREDIT COST RATIO
    // ========================================
    // Calculate provisions for NPA and high-risk loans
    // Note: Since there's no WRITTEN_OFF status, we treat CLOSED NPAs as write-offs
    const closedNPALoans = loans.filter((l) => l.status === 'CLOSED' && npaLoans.some(npa => npa.id === l.id))
    const writeOffAmount = closedNPALoans.reduce(
      (sum, l) => sum + l.loan_amount - l.outstanding_amount,
      0
    )

    // Provision estimate: 100% for NPA, 25% for high-risk loans
    const highRiskLoans = loans.filter(
      (l) =>
        l.risk_assessments?.[0]?.risk_category === 'HIGH' &&
        l.status !== 'NPA'
    )
    const highRiskExposure = highRiskLoans.reduce(
      (sum, l) => sum + l.outstanding_amount,
      0
    )
    const provisionAmount = npaExposure + highRiskExposure * 0.25

    const totalCreditCost = writeOffAmount + provisionAmount
    const creditCostRatio =
      totalDisbursed > 0 ? (totalCreditCost / totalDisbursed) * 100 : 0

    // Credit cost trend
    const creditCostSparkline = [
      Math.max(0, creditCostRatio - 0.8),
      Math.max(0, creditCostRatio - 0.6),
      Math.max(0, creditCostRatio - 0.4),
      Math.max(0, creditCostRatio - 0.25),
      Math.max(0, creditCostRatio - 0.1),
      creditCostRatio,
    ]

    // ========================================
    // 4. PORTFOLIO QUALITY INDEX (PQI)
    // ========================================
    // Composite score (0-100) based on:
    // - NPA Rate (40% weight): Lower is better
    // - Collection Efficiency (30% weight): Higher is better
    // - Average Risk Score (30% weight): Lower is better

    const loansWithRisk = loans.filter(
      (l) => l.risk_assessments && l.risk_assessments.length > 0
    )
    const avgRiskScore =
      loansWithRisk.length > 0
        ? loansWithRisk.reduce(
            (sum, l) => sum + (l.risk_assessments?.[0]?.risk_score || 0),
            0
          ) / loansWithRisk.length
        : 50

    // Calculate PQI components (0-100 scale)
    const npaComponent = Math.max(0, 100 - grossNPARate * 10) // 10% NPA = 0 points
    const collectionComponent = collectionEfficiency // Already 0-100
    const riskComponent = Math.max(0, 100 - avgRiskScore) // Risk score 0-100, inverted

    const portfolioQualityIndex =
      npaComponent * 0.4 + collectionComponent * 0.3 + riskComponent * 0.3

    // PQI trend
    const pqiSparkline = [
      Math.max(0, portfolioQualityIndex - 4),
      Math.max(0, portfolioQualityIndex - 3),
      Math.max(0, portfolioQualityIndex - 2),
      Math.max(0, portfolioQualityIndex - 1.2),
      Math.max(0, portfolioQualityIndex - 0.5),
      portfolioQualityIndex,
    ]

    // ========================================
    // ADDITIONAL CONTEXT METRICS
    // ========================================
    const par30Loans = loans.filter((l) => {
      const latestRepayment = l.repayments[0]
      return latestRepayment && latestRepayment.dpd >= 30 && l.status === 'ACTIVE'
    })

    const par90Loans = loans.filter((l) => {
      const latestRepayment = l.repayments[0]
      return latestRepayment && latestRepayment.dpd >= 90 && l.status === 'ACTIVE'
    })

    return NextResponse.json({
      success: true,
      data: {
        kpis: [
          {
            id: 'pqi',
            name: 'Portfolio Quality Index',
            value: Math.round(portfolioQualityIndex * 10) / 10,
            unit: '',
            suffix: '/100',
            change: -0.5, // Simulated month-over-month change
            changeLabel: 'vs last month',
            trend: pqiSparkline.map((v) => Math.round(v * 10) / 10),
            status:
              portfolioQualityIndex >= 75
                ? 'excellent'
                : portfolioQualityIndex >= 60
                ? 'good'
                : portfolioQualityIndex >= 45
                ? 'warning'
                : 'critical',
            description:
              'Composite health score based on NPA rate, collection efficiency, and risk profile',
          },
          {
            id: 'npa_rate',
            name: 'Gross NPA Rate',
            value: Math.round(grossNPARate * 100) / 100,
            unit: '%',
            suffix: '',
            change: 0.3, // Simulated increase
            changeLabel: 'vs last month',
            trend: npaSparkline.map((v) => Math.round(v * 100) / 100),
            status:
              grossNPARate <= 2
                ? 'excellent'
                : grossNPARate <= 5
                ? 'good'
                : grossNPARate <= 8
                ? 'warning'
                : 'critical',
            description: `${npaLoans.length} loans (${formatCurrency(
              npaExposure
            )}) classified as NPA`,
            metadata: {
              npaCount: npaLoans.length,
              npaExposure: npaExposure,
              totalExposure: totalExposure,
            },
          },
          {
            id: 'collection_efficiency',
            name: 'Collection Efficiency',
            value: Math.round(collectionEfficiency * 100) / 100,
            unit: '%',
            suffix: '',
            change: -1.2, // Simulated decline
            changeLabel: 'vs last month',
            trend: collectionSparkline.map((v) => Math.round(v * 100) / 100),
            status:
              collectionEfficiency >= 95
                ? 'excellent'
                : collectionEfficiency >= 90
                ? 'good'
                : collectionEfficiency >= 85
                ? 'warning'
                : 'critical',
            description: `${successfulRepayments} successful out of ${totalRepayments} total repayments`,
            metadata: {
              successfulRepayments,
              totalRepayments,
              missedRepayments: totalRepayments - successfulRepayments,
            },
          },
          {
            id: 'credit_cost',
            name: 'Credit Cost Ratio',
            value: Math.round(creditCostRatio * 100) / 100,
            unit: '%',
            suffix: '',
            change: 0.15, // Simulated increase
            changeLabel: 'vs last month',
            trend: creditCostSparkline.map((v) => Math.round(v * 100) / 100),
            status:
              creditCostRatio <= 1
                ? 'excellent'
                : creditCostRatio <= 2
                ? 'good'
                : creditCostRatio <= 3
                ? 'warning'
                : 'critical',
            description: `${formatCurrency(
              totalCreditCost
            )} in provisions and write-offs`,
            metadata: {
              writeOffAmount,
              provisionAmount,
              totalCreditCost,
              writeOffCount: closedNPALoans.length,
            },
          },
        ],
        context: {
          totalLoans: loans.length,
          totalExposure,
          totalDisbursed,
          activeLoans: loans.filter((l) => l.status === 'ACTIVE').length,
          npaLoans: npaLoans.length,
          par30Count: par30Loans.length,
          par90Count: par90Loans.length,
          avgRiskScore: Math.round(avgRiskScore * 10) / 10,
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error generating executive summary:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate executive summary',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)}Cr`
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)}L`
  } else {
    return `₹${amount.toLocaleString('en-IN')}`
  }
}
