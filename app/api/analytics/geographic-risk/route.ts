/**
 * GET /api/analytics/geographic-risk
 *
 * Returns geographic distribution of loans and overdue exposure by region
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateGeographicConcentration } from '@/lib/risk-engine'

export async function GET() {
  try {
    // Fetch all loans with relationships
    const loans = await prisma.loan.findMany({
      include: {
        customer: true,
        repayments: {
          orderBy: {
            due_date: 'desc',
          },
        },
        risk_assessments: {
          orderBy: {
            assessment_date: 'desc',
          },
        },
      },
    })

    // Calculate geographic concentration using risk engine
    const geoAnalysis = calculateGeographicConcentration(loans)

    // Format response
    const formattedData = geoAnalysis.map(geo => ({
      geography: geo.geography,
      total_loans: geo.loanCount,
      total_exposure: geo.totalExposure,
      overdue_exposure: geo.overdueExposure,
      percentage_of_portfolio: geo.percentageOfPortfolio,
      overdue_percentage: geo.totalExposure > 0
        ? Math.round((geo.overdueExposure / geo.totalExposure) * 1000) / 10
        : 0,
      avg_dpd: geo.avgDPD,
      flagged: geo.flagged,
      risk_level: geo.flagged
        ? 'high'
        : geo.percentageOfPortfolio > 30
        ? 'medium'
        : 'low',
    }))

    // Identify highest risk geography
    const highestOverdueGeo = formattedData.reduce((max, geo) =>
      geo.overdue_percentage > max.overdue_percentage ? geo : max
    , formattedData[0])

    return NextResponse.json({
      success: true,
      data: formattedData,
      summary: {
        total_geographies: formattedData.length,
        flagged_geographies: formattedData.filter(g => g.flagged).length,
        highest_exposure_geography: formattedData[0]?.geography || null,
        highest_overdue_geography: highestOverdueGeo?.geography || null,
        total_overdue_exposure: Math.round(formattedData.reduce((sum, g) => sum + g.overdue_exposure, 0)),
      },
    })
  } catch (error) {
    console.error('Error fetching geographic risk:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch geographic risk',
      },
      { status: 500 }
    )
  }
}
