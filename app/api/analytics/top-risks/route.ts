import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const sectors = searchParams.get('sectors')?.split(',').filter(Boolean)
    const geographies = searchParams.get('geographies')?.split(',').filter(Boolean)
    const riskCategories = searchParams.get('riskCategories')?.split(',').filter(Boolean)

    // Build filters
    const filters: any = {
      status: { in: ['ACTIVE', 'RESTRUCTURED'] }, // Only active risks
    }

    if (sectors && sectors.length > 0) {
      filters.sector = { in: sectors }
    }

    // Get loans with risk assessments and repayments
    const loans = await prisma.loan.findMany({
      where: filters,
      include: {
        customer: true,
        risk_assessments: {
          orderBy: { assessment_date: 'desc' },
          take: 1,
        },
        repayments: {
          orderBy: { due_date: 'desc' },
          take: 1,
        },
      },
    })

    // Apply geography filter
    let filteredLoans = loans
    if (geographies && geographies.length > 0) {
      filteredLoans = loans.filter(l => l.customer && geographies.includes(l.customer.geography))
    }

    // Apply risk category filter and calculate risk scores
    let loansWithRisk = filteredLoans
      .filter(l => l.risk_assessments && l.risk_assessments[0])
      .map(loan => {
        const riskAssessment = loan.risk_assessments[0]
        const latestRepayment = loan.repayments[0]

        // Calculate risk score: base risk score + DPD penalty + exposure weight
        const baseRiskScore = riskAssessment.risk_score
        const dpdPenalty = latestRepayment ? (latestRepayment.dpd * 0.5) : 0
        const exposureWeight = (loan.outstanding_amount / 1000000) * 2 // ₹1M = 2 points

        const totalRiskScore = baseRiskScore + dpdPenalty + exposureWeight

        return {
          loanId: loan.id,
          customerName: loan.customer?.customer_name || 'Unknown',
          loanAmount: loan.loan_amount,
          outstandingAmount: loan.outstanding_amount,
          sector: loan.sector,
          geography: loan.customer?.geography || 'Unknown',
          riskScore: riskAssessment.risk_score,
          riskCategory: riskAssessment.risk_category,
          dpd: latestRepayment?.dpd || 0,
          status: loan.status,
          totalRiskScore,
          disbursementDate: loan.disbursement_date,
        }
      })

    if (riskCategories && riskCategories.length > 0) {
      loansWithRisk = loansWithRisk.filter(l => riskCategories.includes(l.riskCategory))
    }

    // Sort by total risk score descending
    loansWithRisk.sort((a, b) => b.totalRiskScore - a.totalRiskScore)

    // Return top N
    const topRisks = loansWithRisk.slice(0, limit)

    return NextResponse.json({
      success: true,
      data: topRisks,
      total: loansWithRisk.length,
    })
  } catch (error) {
    console.error('Error fetching top risks:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch top risks',
      },
      { status: 500 }
    )
  }
}
