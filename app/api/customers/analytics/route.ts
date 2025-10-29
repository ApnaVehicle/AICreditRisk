/**
 * GET /api/customers/analytics
 *
 * Customer-level analytics endpoint
 *
 * Query Parameters:
 * - sector: enum (MANUFACTURING, RETAIL, IT, HEALTHCARE, REAL_ESTATE, AGRICULTURE)
 * - geography: string (Mumbai, Delhi, etc.)
 * - groupBy: enum (sector, geography, employment_status, age_group)
 * - minCreditScore: number
 * - maxCreditScore: number
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const sector = searchParams.get('sector')
    const geography = searchParams.get('geography')
    const groupBy = searchParams.get('groupBy')
    const minCreditScore = searchParams.get('minCreditScore')
    const maxCreditScore = searchParams.get('maxCreditScore')

    // Build where clause for filtering customers through loans
    const loanWhere: any = {}
    if (sector) loanWhere.sector = sector

    const customerWhere: any = {}
    if (geography) {
      customerWhere.geography = {
        contains: geography,
      }
    }
    if (minCreditScore || maxCreditScore) {
      customerWhere.credit_score = {}
      if (minCreditScore) customerWhere.credit_score.gte = Number(minCreditScore)
      if (maxCreditScore) customerWhere.credit_score.lte = Number(maxCreditScore)
    }

    // If sector is specified, we need to filter customers who have loans in that sector
    if (sector) {
      customerWhere.loans = {
        some: loanWhere,
      }
    }

    // Fetch customers
    const customers = await prisma.customer.findMany({
      where: customerWhere,
      include: {
        loans: {
          select: {
            sector: true,
          },
        },
      },
    })

    // Calculate overall statistics
    const totalCustomers = customers.length

    if (totalCustomers === 0) {
      return NextResponse.json({
        success: true,
        data: {
          overall: {
            total_customers: 0,
            avg_credit_score: 0,
            avg_dti_ratio: 0,
            avg_age: 0,
            avg_monthly_income: 0,
            employment_distribution: {},
          },
          grouped: [],
        },
      })
    }

    const avgCreditScore =
      customers.reduce((sum, c) => sum + c.credit_score, 0) / totalCustomers
    const avgDtiRatio =
      customers.reduce((sum, c) => sum + Number(c.dti_ratio), 0) / totalCustomers
    const avgAge = customers.reduce((sum, c) => sum + c.age, 0) / totalCustomers
    const avgMonthlyIncome =
      customers.reduce((sum, c) => sum + Number(c.monthly_income), 0) / totalCustomers

    // Employment distribution
    const employmentDistribution: Record<string, number> = {}
    customers.forEach(c => {
      employmentDistribution[c.employment_status] =
        (employmentDistribution[c.employment_status] || 0) + 1
    })

    const overall = {
      total_customers: totalCustomers,
      avg_credit_score: avgCreditScore,
      avg_dti_ratio: avgDtiRatio,
      avg_age: avgAge,
      avg_monthly_income: avgMonthlyIncome,
      employment_distribution: employmentDistribution,
    }

    // Grouped analytics
    let grouped: any[] = []

    if (groupBy) {
      const groups: Map<string, any[]> = new Map()

      customers.forEach(customer => {
        let groupKey: string

        switch (groupBy) {
          case 'sector':
            // Group by primary sector (sector of first loan)
            groupKey = customer.loans[0]?.sector || 'No Loans'
            break
          case 'geography':
            groupKey = customer.geography
            break
          case 'employment_status':
            groupKey = customer.employment_status
            break
          case 'age_group':
            // Group by age ranges
            const age = customer.age
            if (age < 25) groupKey = 'Under 25'
            else if (age < 35) groupKey = '25-34'
            else if (age < 45) groupKey = '35-44'
            else if (age < 55) groupKey = '45-54'
            else groupKey = '55+'
            break
          default:
            groupKey = 'Unknown'
        }

        if (!groups.has(groupKey)) {
          groups.set(groupKey, [])
        }
        groups.get(groupKey)!.push(customer)
      })

      // Calculate stats for each group
      grouped = Array.from(groups.entries()).map(([groupValue, groupCustomers]) => {
        const count = groupCustomers.length
        return {
          group_value: groupValue,
          customer_count: count,
          avg_credit_score:
            groupCustomers.reduce((sum, c) => sum + c.credit_score, 0) / count,
          avg_dti_ratio:
            groupCustomers.reduce((sum, c) => sum + Number(c.dti_ratio), 0) / count,
          avg_age: groupCustomers.reduce((sum, c) => sum + c.age, 0) / count,
          avg_monthly_income:
            groupCustomers.reduce((sum, c) => sum + Number(c.monthly_income), 0) / count,
        }
      })

      // Sort by customer count descending
      grouped.sort((a, b) => b.customer_count - a.customer_count)
    }

    return NextResponse.json({
      success: true,
      data: {
        overall,
        grouped,
      },
      filters: {
        sector,
        geography,
        groupBy,
        minCreditScore,
        maxCreditScore,
      },
    })
  } catch (error: any) {
    console.error('Error fetching customer analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch customer analytics',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
