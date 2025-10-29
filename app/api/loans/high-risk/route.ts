/**
 * GET /api/loans/high-risk
 *
 * Returns top high-risk loans based on risk score
 *
 * Query Parameters:
 * - limit: number (default: 10) - Number of loans to return
 * - sector: string (optional) - Filter by sector
 * - minRiskScore: number (default: 60) - Minimum risk score threshold
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const sector = searchParams.get('sector')
    const minRiskScore = parseFloat(searchParams.get('minRiskScore') || '60')

    // Build where clause
    const where: any = {
      status: {
        in: ['ACTIVE', 'RESTRUCTURED'],
      },
    }

    if (sector) {
      where.sector = sector
    }

    // Fetch loans with risk assessments
    const loans = await prisma.loan.findMany({
      where,
      include: {
        customer: {
          select: {
            customer_name: true,
            credit_score: true,
            geography: true,
          },
        },
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

    // Filter by risk score and sort
    const highRiskLoans = loans
      .filter(loan => {
        const latestAssessment = loan.risk_assessments[0]
        return latestAssessment && latestAssessment.risk_score >= minRiskScore
      })
      .sort((a, b) => {
        const scoreA = a.risk_assessments[0]?.risk_score || 0
        const scoreB = b.risk_assessments[0]?.risk_score || 0
        return scoreB - scoreA
      })
      .slice(0, limit)

    // Format response
    const formattedLoans = highRiskLoans.map(loan => {
      const assessment = loan.risk_assessments[0]
      const latestRepayment = loan.repayments[0]

      return {
        loan_id: loan.id,
        customer_name: loan.customer.customer_name,
        customer_credit_score: loan.customer.credit_score,
        geography: loan.customer.geography,
        loan_amount: loan.loan_amount,
        outstanding_amount: loan.outstanding_amount,
        interest_rate: loan.interest_rate,
        sector: loan.sector,
        loan_type: loan.loan_type,
        status: loan.status,
        disbursement_date: loan.disbursement_date,
        next_due_date: loan.next_due_date,
        risk_score: assessment?.risk_score || 0,
        risk_category: assessment?.risk_category || 'UNKNOWN',
        flags: assessment?.flags ? JSON.parse(assessment.flags) : {},
        dpd: latestRepayment?.dpd || 0,
        notes: assessment?.notes,
        assessment_date: assessment?.assessment_date,
      }
    })

    return NextResponse.json({
      success: true,
      data: formattedLoans,
      count: formattedLoans.length,
      filters: {
        limit,
        sector: sector || 'all',
        minRiskScore,
      },
    })
  } catch (error) {
    console.error('Error fetching high-risk loans:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch high-risk loans',
      },
      { status: 500 }
    )
  }
}
