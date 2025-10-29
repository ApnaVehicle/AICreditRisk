import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build date filter
    const dateFilter: any = {}
    if (startDate && endDate) {
      dateFilter.disbursement_date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Get all loans with relationships
    const loans = await prisma.loan.findMany({
      where: dateFilter,
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
    const totalExposure = loans.reduce((sum, l) => sum + l.loan_amount, 0)
    const totalOutstanding = loans.reduce((sum, l) => sum + l.outstanding_amount, 0)
    const npaExposure = npaLoans.reduce((sum, l) => sum + l.outstanding_amount, 0)

    // Calculate provision amount (assume 50% provision on NPAs)
    const provisionAmount = npaExposure * 0.5

    // NPA Rates
    const grossNPARate = totalOutstanding > 0 ? (npaExposure / totalOutstanding) * 100 : 0
    const netNPARate = totalOutstanding > 0 ? ((npaExposure - provisionAmount) / totalOutstanding) * 100 : 0

    // Provision Coverage Ratio
    const provisionCoverageRatio = npaExposure > 0 ? (provisionAmount / npaExposure) * 100 : 0

    // Portfolio at Risk - using repayment DPD
    const overdueLoans = loans.filter((l) => {
      const latestRepayment = l.repayments[0]
      return latestRepayment && latestRepayment.dpd > 0 && l.status === 'ACTIVE'
    })
    
    const par30Loans = loans.filter((l) => {
      const latestRepayment = l.repayments[0]
      return latestRepayment && latestRepayment.dpd >= 30 && l.status === 'ACTIVE'
    })
    
    const par60Loans = loans.filter((l) => {
      const latestRepayment = l.repayments[0]
      return latestRepayment && latestRepayment.dpd >= 60 && l.status === 'ACTIVE'
    })
    
    const par90Loans = loans.filter((l) => {
      const latestRepayment = l.repayments[0]
      return latestRepayment && latestRepayment.dpd >= 90 && l.status === 'ACTIVE'
    })

    const parRate = activeLoans.length > 0 ? (overdueLoans.length / activeLoans.length) * 100 : 0
    const par30Rate = activeLoans.length > 0 ? (par30Loans.length / activeLoans.length) * 100 : 0
    const par60Rate = activeLoans.length > 0 ? (par60Loans.length / activeLoans.length) * 100 : 0
    const par90Rate = activeLoans.length > 0 ? (par90Loans.length / activeLoans.length) * 100 : 0

    // Calculate repayment metrics
    const totalRepayments = loans.reduce((sum, l) => sum + (l.repayments?.length || 0), 0)
    const delayedRepayments = loans.reduce(
      (sum, l) => sum + (l.repayments?.filter((r: any) => r.payment_status === 'DELAYED').length || 0),
      0
    )
    const missedRepayments = loans.reduce(
      (sum, l) => sum + (l.repayments?.filter((r: any) => r.payment_status === 'MISSED').length || 0),
      0
    )

    const successfulRepayments = totalRepayments - delayedRepayments - missedRepayments
    const collectionEfficiency = totalRepayments > 0 ? (successfulRepayments / totalRepayments) * 100 : 0

    // Risk metrics
    const loansWithRisk = loans.filter((l) => l.risk_assessments && l.risk_assessments.length > 0)
    const avgRiskScore = loansWithRisk.length > 0
      ? loansWithRisk.reduce((sum, l) => sum + (l.risk_assessments?.[0]?.risk_score || 0), 0) / loansWithRisk.length
      : 0

    const highRiskLoans = loansWithRisk.filter((l) => l.risk_assessments?.[0]?.risk_category === 'HIGH')
    const mediumRiskLoans = loansWithRisk.filter((l) => l.risk_assessments?.[0]?.risk_category === 'MEDIUM')
    const lowRiskLoans = loansWithRisk.filter((l) => l.risk_assessments?.[0]?.risk_category === 'LOW')

    // Concentration Risk - HHI
    const sectorExposures = new Map<string, number>()
    loans.forEach((loan) => {
      const current = sectorExposures.get(loan.sector) || 0
      sectorExposures.set(loan.sector, current + loan.outstanding_amount)
    })

    let hhi = 0
    sectorExposures.forEach((exposure) => {
      const marketShare = totalOutstanding > 0 ? (exposure / totalOutstanding) * 100 : 0
      hhi += marketShare * marketShare
    })

    // Mock values for demo
    const lossGivenDefault = 65.0
    const cureRate = 15.5
    const recoveryRate = 34.5
    const avgInterestRate = 12.5
    const costOfFunds = 7.5
    const netInterestMargin = avgInterestRate - costOfFunds
    const yieldOnAdvances = 13.2
    const creditCostRatio = (provisionAmount / totalOutstanding) * 100
    const returnOnAssets = 1.8

    // Generate sparkline data
    const generateSparkline = (baseValue: number, variance: number = 0.1) => {
      return Array.from({ length: 7 }, () => {
        const randomVariance = (Math.random() - 0.5) * 2 * variance * baseValue
        return Math.max(0, baseValue + randomVariance)
      })
    }

    const kpis = {
      portfolio: {
        totalLoans,
        activeLoans: activeLoans.length,
        npaLoans: npaLoans.length,
        totalExposure,
        totalOutstanding,
        avgLoanSize: totalLoans > 0 ? totalExposure / totalLoans : 0,
        sparkline: generateSparkline(totalLoans, 0.02),
      },
      npa: {
        grossNPARate,
        netNPARate,
        npaExposure,
        provisionAmount,
        provisionCoverageRatio,
        sparkline: generateSparkline(grossNPARate, 0.05),
      },
      delinquency: {
        parRate,
        par30Rate,
        par60Rate,
        par90Rate,
        overdueLoans: overdueLoans.length,
        par30Count: par30Loans.length,
        par60Count: par60Loans.length,
        par90Count: par90Loans.length,
        sparkline: generateSparkline(parRate, 0.1),
      },
      collections: {
        collectionEfficiency,
        totalRepayments,
        successfulRepayments,
        delayedRepayments,
        missedRepayments,
        cureRate,
        recoveryRate,
        sparkline: generateSparkline(collectionEfficiency, 0.03),
      },
      risk: {
        avgRiskScore,
        highRiskCount: highRiskLoans.length,
        mediumRiskCount: mediumRiskLoans.length,
        lowRiskCount: lowRiskLoans.length,
        lossGivenDefault,
        sparkline: generateSparkline(avgRiskScore, 0.05),
      },
      concentration: {
        hhi,
        topSectorExposure: Math.max(...Array.from(sectorExposures.values())),
        sectorCount: sectorExposures.size,
        sparkline: generateSparkline(hhi, 0.02),
      },
      profitability: {
        netInterestMargin,
        yieldOnAdvances,
        costOfFunds,
        creditCostRatio,
        returnOnAssets,
        sparkline: generateSparkline(netInterestMargin, 0.08),
      },
    }

    return NextResponse.json({
      success: true,
      data: kpis,
    })
  } catch (error) {
    console.error('Error fetching enhanced KPIs:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch enhanced KPIs',
      },
      { status: 500 }
    )
  }
}
