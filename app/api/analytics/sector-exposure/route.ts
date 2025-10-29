/**
 * GET /api/analytics/sector-exposure
 *
 * Returns sector-wise portfolio exposure and concentration analysis
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateSectorConcentration } from '@/lib/risk-engine'

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

    // Calculate sector concentration using risk engine
    const sectorAnalysis = calculateSectorConcentration(loans)

    // Calculate total exposure for percentage calculations
    const totalExposure = loans.reduce((sum, loan) => sum + loan.outstanding_amount, 0)

    // Format response
    const formattedData = sectorAnalysis.map(sector => ({
      sector: sector.sector,
      total_exposure: sector.totalExposure,
      percentage: sector.percentageOfPortfolio,
      loan_count: sector.loanCount,
      avg_risk_score: sector.avgRiskScore,
      at_risk_loans: sector.atRiskLoans,
      flagged: sector.flagged,
      recommendation: sector.flagged
        ? `ALERT: ${sector.sector} sector concentration exceeds 30% threshold`
        : sector.percentageOfPortfolio > 25
        ? `Monitor ${sector.sector} sector exposure closely`
        : 'Sector exposure within acceptable limits',
    }))

    // Identify highest risk sector
    const highestRiskSector = formattedData.reduce((max, sector) =>
      sector.avg_risk_score > max.avg_risk_score ? sector : max
    , formattedData[0])

    return NextResponse.json({
      success: true,
      data: formattedData,
      summary: {
        total_sectors: formattedData.length,
        flagged_sectors: formattedData.filter(s => s.flagged).length,
        highest_exposure_sector: formattedData[0]?.sector || null,
        highest_risk_sector: highestRiskSector?.sector || null,
        total_portfolio_exposure: Math.round(totalExposure),
      },
    })
  } catch (error) {
    console.error('Error fetching sector exposure:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch sector exposure',
      },
      { status: 500 }
    )
  }
}
