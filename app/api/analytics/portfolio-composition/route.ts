import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const sectors = searchParams.get('sectors')?.split(',').filter(Boolean)
    const geographies = searchParams.get('geographies')?.split(',').filter(Boolean)
    const riskCategories = searchParams.get('riskCategories')?.split(',').filter(Boolean)
    const statuses = searchParams.get('statuses')?.split(',').filter(Boolean)

    // Build filters
    const filters: any = {}

    if (startDate && endDate) {
      filters.disbursement_date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (sectors && sectors.length > 0) {
      filters.sector = { in: sectors }
    }

    if (statuses && statuses.length > 0) {
      filters.status = { in: statuses }
    }

    // Get all loans with risk assessments
    const loans = await prisma.loan.findMany({
      where: filters,
      include: {
        customer: true,
        risk_assessments: {
          orderBy: { assessment_date: 'desc' },
          take: 1,
        },
      },
    })

    // Apply geography filter
    let filteredLoans = loans
    if (geographies && geographies.length > 0) {
      filteredLoans = loans.filter(l => l.customer && geographies.includes(l.customer.geography))
    }

    // Apply risk category filter
    if (riskCategories && riskCategories.length > 0) {
      filteredLoans = filteredLoans.filter(l =>
        l.risk_assessments[0] && riskCategories.includes(l.risk_assessments[0].risk_category)
      )
    }

    // Calculate risk distribution
    const riskDistribution = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    }

    filteredLoans.forEach(loan => {
      if (loan.risk_assessments && loan.risk_assessments[0]) {
        const category = loan.risk_assessments[0].risk_category
        riskDistribution[category]++
      }
    })

    // Calculate status distribution
    const statusDistribution = {
      ACTIVE: 0,
      CLOSED: 0,
      NPA: 0,
      RESTRUCTURED: 0,
    }

    filteredLoans.forEach(loan => {
      statusDistribution[loan.status]++
    })

    // Format for pie charts
    const riskData = [
      { category: 'Low Risk', value: riskDistribution.LOW, color: '#10b981' },
      { category: 'Medium Risk', value: riskDistribution.MEDIUM, color: '#f59e0b' },
      { category: 'High Risk', value: riskDistribution.HIGH, color: '#ef4444' },
    ].filter(item => item.value > 0)

    const statusData = [
      { category: 'Active', value: statusDistribution.ACTIVE, color: '#3b82f6' },
      { category: 'Closed', value: statusDistribution.CLOSED, color: '#10b981' },
      { category: 'NPA', value: statusDistribution.NPA, color: '#ef4444' },
      { category: 'Restructured', value: statusDistribution.RESTRUCTURED, color: '#f59e0b' },
    ].filter(item => item.value > 0)

    return NextResponse.json({
      success: true,
      data: {
        riskDistribution: riskData,
        statusDistribution: statusData,
        totalLoans: filteredLoans.length,
      },
    })
  } catch (error) {
    console.error('Error fetching portfolio composition:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch portfolio composition',
      },
      { status: 500 }
    )
  }
}
