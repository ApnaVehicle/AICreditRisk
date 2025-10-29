/**
 * GET /api/loans
 *
 * General loan query endpoint with flexible filtering
 *
 * Query Parameters:
 * - geography: string (Mumbai, Delhi, etc.)
 * - sector: enum (MANUFACTURING, RETAIL, IT, HEALTHCARE, REAL_ESTATE, AGRICULTURE)
 * - status: enum (ACTIVE, CLOSED, NPA, RESTRUCTURED)
 * - riskCategory: enum (LOW, MEDIUM, HIGH)
 * - minAmount: number (minimum loan amount)
 * - maxAmount: number (maximum loan amount)
 * - minOutstanding: number (minimum outstanding amount)
 * - maxOutstanding: number (maximum outstanding amount)
 * - limit: number (max results, default 50, max 200)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Build where clause dynamically
    const where: Prisma.LoanWhereInput = {}

    // Geography filter (through customer relation)
    const geography = searchParams.get('geography')
    if (geography) {
      where.customer = {
        geography: {
          contains: geography,
        },
      }
    }

    // Sector filter
    const sector = searchParams.get('sector')
    if (sector) {
      where.sector = sector as any
    }

    // Status filter
    const status = searchParams.get('status')
    if (status) {
      where.status = status as any
    }

    // Loan amount range
    const minAmount = searchParams.get('minAmount')
    const maxAmount = searchParams.get('maxAmount')
    if (minAmount || maxAmount) {
      where.loan_amount = {}
      if (minAmount) where.loan_amount.gte = Number(minAmount)
      if (maxAmount) where.loan_amount.lte = Number(maxAmount)
    }

    // Outstanding amount range
    const minOutstanding = searchParams.get('minOutstanding')
    const maxOutstanding = searchParams.get('maxOutstanding')
    if (minOutstanding || maxOutstanding) {
      where.outstanding_amount = {}
      if (minOutstanding) where.outstanding_amount.gte = Number(minOutstanding)
      if (maxOutstanding) where.outstanding_amount.lte = Number(maxOutstanding)
    }

    // Risk category filter (through risk_assessments relation)
    const riskCategory = searchParams.get('riskCategory')
    if (riskCategory) {
      where.risk_assessments = {
        some: {
          risk_category: riskCategory as any,
        },
      }
    }

    // Limit (default 50, max 200)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(Number(limitParam), 200) : 50

    // Query loans
    const loans = await prisma.loan.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            customer_name: true,
            geography: true,
            credit_score: true,
            dti_ratio: true,
            employment_status: true,
          },
        },
        risk_assessments: {
          select: {
            risk_score: true,
            risk_category: true,
            assessment_date: true,
          },
          orderBy: {
            assessment_date: 'desc',
          },
          take: 1, // Get latest risk assessment
        },
      },
      take: limit,
      orderBy: {
        disbursement_date: 'desc',
      },
    })

    // Calculate summary statistics
    const summary = {
      total_loans: loans.length,
      total_amount: loans.reduce((sum, loan) => sum + Number(loan.loan_amount), 0),
      total_outstanding: loans.reduce((sum, loan) => sum + Number(loan.outstanding_amount), 0),
      avg_risk_score:
        loans.length > 0
          ? loans.reduce((sum, loan) => sum + (loan.risk_assessments[0]?.risk_score || 0), 0) /
            loans.length
          : 0,
    }

    return NextResponse.json({
      success: true,
      data: loans,
      summary,
      filters: {
        geography,
        sector,
        status,
        riskCategory,
        minAmount,
        maxAmount,
        minOutstanding,
        maxOutstanding,
        limit,
      },
    })
  } catch (error: any) {
    console.error('Error fetching loans:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch loans',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
