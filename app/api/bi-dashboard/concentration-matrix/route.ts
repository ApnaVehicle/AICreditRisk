import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { buildLoanWhereClause } from '@/lib/utils/filter-builder'

/**
 * GET /api/bi-dashboard/concentration-matrix
 *
 * Returns portfolio concentration analysis across multiple dimensions:
 * - Sector × Geography heatmap
 * - Top borrower concentration
 * - Herfindahl-Hirschman Index (HHI) for diversification
 * - Single name concentration limits
 *
 * HHI = Σ(market share)² × 10,000
 * - HHI < 1500: Unconcentrated
 * - HHI 1500-2500: Moderate concentration
 * - HHI > 2500: High concentration
 *
 * Query Parameters: Supports all filters from filter store
 */

export async function GET(request: NextRequest) {
  try {
    // Extract and build WHERE clause from query parameters
    const { searchParams } = new URL(request.url)
    const filterWhere = buildLoanWhereClause(searchParams)

    // Merge filter WHERE with default status filter
    // Default includes ACTIVE + RESTRUCTURED + NPA for concentration analysis
    const where = {
      ...filterWhere,
      status: filterWhere.status || { in: ['ACTIVE', 'RESTRUCTURED', 'NPA'] as any },
    }

    // Fetch loans with filters applied
    const loans = await prisma.loan.findMany({
      where,
      include: {
        customer: true,
        risk_assessments: {
          orderBy: { assessment_date: 'desc' },
          take: 1,
        },
      },
    })

    const totalExposure = loans.reduce((sum, loan) => sum + loan.outstanding_amount, 0)

    // ========================================
    // 1. SECTOR × GEOGRAPHY HEATMAP
    // ========================================
    interface MatrixCell {
      sector: string
      geography: string
      exposure: number
      loanCount: number
      avgRiskScore: number
      npaCount: number
      percentage: number
    }

    const matrixMap = new Map<string, MatrixCell>()

    loans.forEach((loan) => {
      const key = `${loan.sector}|${loan.customer.geography}`
      const existing = matrixMap.get(key)

      const riskScore = loan.risk_assessments?.[0]?.risk_score || 50
      const isNPA = loan.status === 'NPA' ? 1 : 0

      if (existing) {
        existing.exposure += loan.outstanding_amount
        existing.loanCount += 1
        existing.avgRiskScore =
          (existing.avgRiskScore * (existing.loanCount - 1) + riskScore) /
          existing.loanCount
        existing.npaCount += isNPA
      } else {
        matrixMap.set(key, {
          sector: loan.sector,
          geography: loan.customer.geography,
          exposure: loan.outstanding_amount,
          loanCount: 1,
          avgRiskScore: riskScore,
          npaCount: isNPA,
          percentage: 0, // Calculate later
        })
      }
    })

    // Calculate percentages and convert to array
    const heatmapData = Array.from(matrixMap.values()).map((cell) => ({
      ...cell,
      percentage: totalExposure > 0 ? (cell.exposure / totalExposure) * 100 : 0,
      avgRiskScore: Math.round(cell.avgRiskScore * 10) / 10,
    }))

    // Get unique sectors and geographies for matrix axes
    const sectors = Array.from(new Set(loans.map((l) => l.sector))).sort()
    const geographies = Array.from(new Set(loans.map((l) => l.customer.geography))).sort()

    // ========================================
    // 2. SECTOR CONCENTRATION (HHI)
    // ========================================
    const sectorExposure = new Map<string, number>()
    loans.forEach((loan) => {
      sectorExposure.set(
        loan.sector,
        (sectorExposure.get(loan.sector) || 0) + loan.outstanding_amount
      )
    })

    const sectorConcentration = Array.from(sectorExposure.entries())
      .map(([sector, exposure]) => ({
        sector,
        exposure,
        percentage: totalExposure > 0 ? (exposure / totalExposure) * 100 : 0,
        loanCount: loans.filter((l) => l.sector === sector).length,
      }))
      .sort((a, b) => b.exposure - a.exposure)

    // Calculate Herfindahl-Hirschman Index (HHI)
    const sectorHHI =
      sectorConcentration.reduce((sum, item) => {
        const marketShare = item.percentage / 100
        return sum + marketShare * marketShare
      }, 0) * 10000

    // ========================================
    // 3. GEOGRAPHY CONCENTRATION
    // ========================================
    const geoExposure = new Map<string, number>()
    loans.forEach((loan) => {
      const geo = loan.customer.geography
      geoExposure.set(geo, (geoExposure.get(geo) || 0) + loan.outstanding_amount)
    })

    const geographyConcentration = Array.from(geoExposure.entries())
      .map(([geography, exposure]) => ({
        geography,
        exposure,
        percentage: totalExposure > 0 ? (exposure / totalExposure) * 100 : 0,
        loanCount: loans.filter((l) => l.customer.geography === geography).length,
      }))
      .sort((a, b) => b.exposure - a.exposure)

    const geoHHI =
      geographyConcentration.reduce((sum, item) => {
        const marketShare = item.percentage / 100
        return sum + marketShare * marketShare
      }, 0) * 10000

    // ========================================
    // 4. TOP BORROWER CONCENTRATION
    // ========================================
    const borrowerExposure = new Map<
      string,
      { customerId: string; name: string; exposure: number; loanCount: number }
    >()

    loans.forEach((loan) => {
      const existing = borrowerExposure.get(loan.customer_id)
      if (existing) {
        existing.exposure += loan.outstanding_amount
        existing.loanCount += 1
      } else {
        borrowerExposure.set(loan.customer_id, {
          customerId: loan.customer_id,
          name: loan.customer.customer_name,
          exposure: loan.outstanding_amount,
          loanCount: 1,
        })
      }
    })

    const topBorrowers = Array.from(borrowerExposure.values())
      .map((borrower) => ({
        ...borrower,
        percentage: totalExposure > 0 ? (borrower.exposure / totalExposure) * 100 : 0,
      }))
      .sort((a, b) => b.exposure - a.exposure)
      .slice(0, 20) // Top 20 borrowers

    // Calculate top-10 and top-20 concentration
    const top10Concentration = topBorrowers
      .slice(0, 10)
      .reduce((sum, b) => sum + b.percentage, 0)
    const top20Concentration = topBorrowers.reduce((sum, b) => sum + b.percentage, 0)

    // Single name limit violations (typically 10% for unsecured lending)
    const singleNameLimit = 10
    const limitViolations = topBorrowers.filter(
      (b) => b.percentage > singleNameLimit
    )

    // ========================================
    // 5. PRODUCT TYPE CONCENTRATION
    // ========================================
    const productExposure = new Map<string, number>()
    loans.forEach((loan) => {
      productExposure.set(
        loan.loan_type,
        (productExposure.get(loan.loan_type) || 0) + loan.outstanding_amount
      )
    })

    const productConcentration = Array.from(productExposure.entries())
      .map(([product, exposure]) => ({
        product,
        exposure,
        percentage: totalExposure > 0 ? (exposure / totalExposure) * 100 : 0,
        loanCount: loans.filter((l) => l.loan_type === product).length,
      }))
      .sort((a, b) => b.exposure - a.exposure)

    // ========================================
    // 6. CONCENTRATION RISK ASSESSMENT
    // ========================================
    const concentrationRisk = {
      sectorRisk:
        sectorHHI > 2500 ? 'HIGH' : sectorHHI > 1500 ? 'MODERATE' : 'LOW',
      geoRisk: geoHHI > 2500 ? 'HIGH' : geoHHI > 1500 ? 'MODERATE' : 'LOW',
      borrowerRisk:
        top10Concentration > 50
          ? 'HIGH'
          : top10Concentration > 30
          ? 'MODERATE'
          : 'LOW',
      overallRisk: 'MODERATE', // Calculated based on above
    }

    // Set overall risk
    const riskScores: Record<'HIGH' | 'MODERATE' | 'LOW', number> = {
      HIGH: 3,
      MODERATE: 2,
      LOW: 1,
    }
    const avgRisk =
      (riskScores[concentrationRisk.sectorRisk as 'HIGH' | 'MODERATE' | 'LOW'] +
        riskScores[concentrationRisk.geoRisk as 'HIGH' | 'MODERATE' | 'LOW'] +
        riskScores[concentrationRisk.borrowerRisk as 'HIGH' | 'MODERATE' | 'LOW']) /
      3

    concentrationRisk.overallRisk =
      avgRisk > 2.5 ? 'HIGH' : avgRisk > 1.5 ? 'MODERATE' : 'LOW'

    // ========================================
    // 7. DIVERSIFICATION RECOMMENDATIONS
    // ========================================
    const recommendations: string[] = []

    if (sectorHHI > 2500) {
      recommendations.push(
        `High sector concentration (HHI: ${Math.round(sectorHHI)}). Consider diversifying into underrepresented sectors.`
      )
    }

    if (geoHHI > 2500) {
      recommendations.push(
        `High geographic concentration (HHI: ${Math.round(geoHHI)}). Expand lending to new geographies.`
      )
    }

    if (limitViolations.length > 0) {
      recommendations.push(
        `${limitViolations.length} borrower(s) exceed single-name limit of ${singleNameLimit}%. Review exposure limits.`
      )
    }

    if (top10Concentration > 40) {
      recommendations.push(
        `Top-10 borrowers represent ${Math.round(top10Concentration)}% of portfolio. High single-name concentration risk.`
      )
    }

    const topSector = sectorConcentration[0]
    if (topSector && topSector.percentage > 40) {
      recommendations.push(
        `${topSector.sector} sector accounts for ${Math.round(topSector.percentage)}% of portfolio. Diversification needed.`
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        heatmap: {
          data: heatmapData,
          sectors,
          geographies,
        },
        sectorConcentration: {
          data: sectorConcentration.map((item) => ({
            ...item,
            percentage: Math.round(item.percentage * 100) / 100,
          })),
          hhi: Math.round(sectorHHI),
          riskLevel: concentrationRisk.sectorRisk,
        },
        geographyConcentration: {
          data: geographyConcentration.map((item) => ({
            ...item,
            percentage: Math.round(item.percentage * 100) / 100,
          })),
          hhi: Math.round(geoHHI),
          riskLevel: concentrationRisk.geoRisk,
        },
        borrowerConcentration: {
          topBorrowers: topBorrowers.map((item) => ({
            ...item,
            percentage: Math.round(item.percentage * 100) / 100,
          })),
          top10Concentration: Math.round(top10Concentration * 100) / 100,
          top20Concentration: Math.round(top20Concentration * 100) / 100,
          limitViolations: limitViolations.map((item) => ({
            ...item,
            percentage: Math.round(item.percentage * 100) / 100,
          })),
          riskLevel: concentrationRisk.borrowerRisk,
        },
        productConcentration: productConcentration.map((item) => ({
          ...item,
          percentage: Math.round(item.percentage * 100) / 100,
        })),
        riskAssessment: concentrationRisk,
        recommendations,
        context: {
          totalLoans: loans.length,
          totalExposure,
          uniqueBorrowers: borrowerExposure.size,
          sectorCount: sectors.length,
          geoCount: geographies.length,
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error generating concentration matrix:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate concentration matrix',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
