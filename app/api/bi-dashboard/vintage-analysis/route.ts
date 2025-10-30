import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { buildLoanWhereClause } from '@/lib/utils/filter-builder'

/**
 * GET /api/bi-dashboard/vintage-analysis
 *
 * Analyzes loan performance by origination cohort (vintage)
 * Tracks delinquency progression, default rates, and repayment behavior
 * across different disbursement periods
 *
 * Key Metrics:
 * - Cohort default rate progression (months on book)
 * - NPL rate by vintage
 * - Recovery rate by vintage
 * - Portfolio maturation curve
 *
 * Query Parameters: Supports all filters from filter store
 */

export async function GET(request: NextRequest) {
  try {
    // Extract and build WHERE clause from query parameters
    const { searchParams } = new URL(request.url)
    const where = buildLoanWhereClause(searchParams)

    // Fetch loans with filters applied
    const loans = await prisma.loan.findMany({
      where,
      include: {
        customer: true,
        repayments: {
          orderBy: { due_date: 'asc' },
        },
        risk_assessments: {
          orderBy: { assessment_date: 'desc' },
          take: 1,
        },
      },
    })

    // ========================================
    // 1. GROUP LOANS BY VINTAGE (COHORT)
    // ========================================
    interface Cohort {
      vintage: string // YYYY-MM format
      vintageDate: Date
      loanCount: number
      totalDisbursed: number
      totalOutstanding: number
      npaCount: number
      npaExposure: number
      writtenOffCount: number
      writtenOffAmount: number
      avgTenure: number // months on book
      avgDPD: number
      collectionRate: number
      defaultRate: number
      recoveryRate: number
      avgRiskScore: number
    }

    const cohortMap = new Map<string, Cohort>()

    loans.forEach((loan) => {
      const disbursementDate = new Date(loan.disbursement_date)
      const vintage = `${disbursementDate.getFullYear()}-${String(
        disbursementDate.getMonth() + 1
      ).padStart(2, '0')}`

      // Calculate metrics
      const isNPA = loan.status === 'NPA'
      const isWrittenOff = false // No WRITTEN_OFF status in schema
      const latestRepayment = loan.repayments[loan.repayments.length - 1]
      const currentDPD = latestRepayment?.dpd || 0

      // Calculate tenure (months since disbursement)
      const today = new Date()
      const tenureMonths =
        (today.getTime() - disbursementDate.getTime()) / (1000 * 60 * 60 * 24 * 30)

      // Calculate collection rate for this loan
      const totalExpected = loan.repayments.reduce(
        (sum, r) => sum + r.emi_amount,
        0
      )
      const totalCollected = loan.repayments.reduce(
        (sum, r) => sum + (r.payment_amount || 0),
        0
      )
      const loanCollectionRate =
        totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0

      const riskScore = loan.risk_assessments?.[0]?.risk_score || 50

      const existing = cohortMap.get(vintage)
      if (existing) {
        existing.loanCount += 1
        existing.totalDisbursed += loan.loan_amount
        existing.totalOutstanding += loan.outstanding_amount
        if (isNPA) {
          existing.npaCount += 1
          existing.npaExposure += loan.outstanding_amount
        }
        if (isWrittenOff) {
          existing.writtenOffCount += 1
          existing.writtenOffAmount += loan.outstanding_amount
        }
        existing.avgTenure =
          (existing.avgTenure * (existing.loanCount - 1) + tenureMonths) /
          existing.loanCount
        existing.avgDPD =
          (existing.avgDPD * (existing.loanCount - 1) + currentDPD) /
          existing.loanCount
        existing.collectionRate =
          (existing.collectionRate * (existing.loanCount - 1) + loanCollectionRate) /
          existing.loanCount
        existing.avgRiskScore =
          (existing.avgRiskScore * (existing.loanCount - 1) + riskScore) /
          existing.loanCount
      } else {
        cohortMap.set(vintage, {
          vintage,
          vintageDate: new Date(disbursementDate.getFullYear(), disbursementDate.getMonth(), 1),
          loanCount: 1,
          totalDisbursed: loan.loan_amount,
          totalOutstanding: loan.outstanding_amount,
          npaCount: isNPA ? 1 : 0,
          npaExposure: isNPA ? loan.outstanding_amount : 0,
          writtenOffCount: isWrittenOff ? 1 : 0,
          writtenOffAmount: isWrittenOff ? loan.outstanding_amount : 0,
          avgTenure: tenureMonths,
          avgDPD: currentDPD,
          collectionRate: loanCollectionRate,
          defaultRate: 0, // Calculate after
          recoveryRate: 0, // Calculate after
          avgRiskScore: riskScore,
        })
      }
    })

    // Calculate derived metrics
    cohortMap.forEach((cohort) => {
      cohort.defaultRate = cohort.loanCount > 0 ? (cohort.npaCount / cohort.loanCount) * 100 : 0

      // Recovery rate: % of disbursed amount recovered
      const amountRecovered = cohort.totalDisbursed - cohort.totalOutstanding
      cohort.recoveryRate = cohort.totalDisbursed > 0
        ? (amountRecovered / cohort.totalDisbursed) * 100
        : 0

      // Round values
      cohort.avgTenure = Math.round(cohort.avgTenure * 10) / 10
      cohort.avgDPD = Math.round(cohort.avgDPD * 10) / 10
      cohort.collectionRate = Math.round(cohort.collectionRate * 100) / 100
      cohort.defaultRate = Math.round(cohort.defaultRate * 100) / 100
      cohort.recoveryRate = Math.round(cohort.recoveryRate * 100) / 100
      cohort.avgRiskScore = Math.round(cohort.avgRiskScore * 10) / 10
    })

    // Convert to sorted array (oldest to newest)
    const cohorts = Array.from(cohortMap.values()).sort(
      (a, b) => a.vintageDate.getTime() - b.vintageDate.getTime()
    )

    // ========================================
    // 2. MATURATION CURVES
    // ========================================
    // Show how default rate evolves as loans mature
    interface MaturationPoint {
      monthsOnBook: number
      defaultRate: number
      collectionRate: number
      avgDPD: number
      sampleSize: number
    }

    const maturationMap = new Map<number, MaturationPoint>()

    loans.forEach((loan) => {
      const disbursementDate = new Date(loan.disbursement_date)
      const today = new Date()
      const tenureMonths = Math.floor(
        (today.getTime() - disbursementDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      )

      const isNPA = loan.status === 'NPA'
      const latestRepayment = loan.repayments[loan.repayments.length - 1]
      const currentDPD = latestRepayment?.dpd || 0

      const totalExpected = loan.repayments.reduce((sum, r) => sum + r.emi_amount, 0)
      const totalCollected = loan.repayments.reduce(
        (sum, r) => sum + (r.payment_amount || 0),
        0
      )
      const loanCollectionRate =
        totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0

      const existing = maturationMap.get(tenureMonths)
      if (existing) {
        const n = existing.sampleSize
        existing.defaultRate = (existing.defaultRate * n + (isNPA ? 100 : 0)) / (n + 1)
        existing.collectionRate =
          (existing.collectionRate * n + loanCollectionRate) / (n + 1)
        existing.avgDPD = (existing.avgDPD * n + currentDPD) / (n + 1)
        existing.sampleSize += 1
      } else {
        maturationMap.set(tenureMonths, {
          monthsOnBook: tenureMonths,
          defaultRate: isNPA ? 100 : 0,
          collectionRate: loanCollectionRate,
          avgDPD: currentDPD,
          sampleSize: 1,
        })
      }
    })

    const maturationCurve = Array.from(maturationMap.values())
      .sort((a, b) => a.monthsOnBook - b.monthsOnBook)
      .map((point) => ({
        monthsOnBook: point.monthsOnBook,
        defaultRate: Math.round(point.defaultRate * 100) / 100,
        collectionRate: Math.round(point.collectionRate * 100) / 100,
        avgDPD: Math.round(point.avgDPD * 10) / 10,
        sampleSize: point.sampleSize,
      }))

    // ========================================
    // 3. COHORT COMPARISON
    // ========================================
    // Compare best vs worst performing cohorts
    const bestCohort = cohorts.reduce((best, current) =>
      current.defaultRate < best.defaultRate ? current : best
    )

    const worstCohort = cohorts.reduce((worst, current) =>
      current.defaultRate > worst.defaultRate ? current : worst
    )

    // ========================================
    // 4. VINTAGE TRENDS
    // ========================================
    const vintageTrends = {
      labels: cohorts.map((c) => c.vintage),
      datasets: [
        {
          id: 'default_rate',
          name: 'Default Rate',
          data: cohorts.map((c) => c.defaultRate),
          color: '#EF4444',
        },
        {
          id: 'collection_rate',
          name: 'Collection Rate',
          data: cohorts.map((c) => c.collectionRate),
          color: '#10B981',
        },
        {
          id: 'avg_dpd',
          name: 'Avg DPD',
          data: cohorts.map((c) => c.avgDPD),
          color: '#F59E0B',
        },
      ],
    }

    // ========================================
    // 5. PORTFOLIO AGING ANALYSIS
    // ========================================
    const agingBuckets = {
      new: cohorts.filter((c) => c.avgTenure <= 6),
      mature: cohorts.filter((c) => c.avgTenure > 6 && c.avgTenure <= 24),
      seasoned: cohorts.filter((c) => c.avgTenure > 24),
    }

    const agingMetrics = {
      new: {
        count: agingBuckets.new.reduce((sum, c) => sum + c.loanCount, 0),
        exposure: agingBuckets.new.reduce((sum, c) => sum + c.totalOutstanding, 0),
        avgDefaultRate: agingBuckets.new.length > 0
          ? agingBuckets.new.reduce((sum, c) => sum + c.defaultRate, 0) / agingBuckets.new.length
          : 0,
      },
      mature: {
        count: agingBuckets.mature.reduce((sum, c) => sum + c.loanCount, 0),
        exposure: agingBuckets.mature.reduce((sum, c) => sum + c.totalOutstanding, 0),
        avgDefaultRate: agingBuckets.mature.length > 0
          ? agingBuckets.mature.reduce((sum, c) => sum + c.defaultRate, 0) / agingBuckets.mature.length
          : 0,
      },
      seasoned: {
        count: agingBuckets.seasoned.reduce((sum, c) => sum + c.loanCount, 0),
        exposure: agingBuckets.seasoned.reduce((sum, c) => sum + c.totalOutstanding, 0),
        avgDefaultRate: agingBuckets.seasoned.length > 0
          ? agingBuckets.seasoned.reduce((sum, c) => sum + c.defaultRate, 0) / agingBuckets.seasoned.length
          : 0,
      },
    }

    return NextResponse.json({
      success: true,
      data: {
        cohorts,
        vintageTrends,
        maturationCurve: maturationCurve.slice(0, 36), // First 36 months
        comparison: {
          bestCohort,
          worstCohort,
          spread: Math.round((worstCohort.defaultRate - bestCohort.defaultRate) * 100) / 100,
        },
        agingAnalysis: {
          buckets: agingMetrics,
          totalCohorts: cohorts.length,
        },
        context: {
          totalLoans: loans.length,
          oldestVintage: cohorts[0]?.vintage,
          newestVintage: cohorts[cohorts.length - 1]?.vintage,
          avgCohortSize: Math.round(loans.length / cohorts.length),
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error generating vintage analysis:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate vintage analysis',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
