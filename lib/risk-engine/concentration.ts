/**
 * Concentration Risk Analysis Module
 *
 * Detects portfolio concentration risks across:
 * - Sectors (Manufacturing, Retail, IT, etc.)
 * - Geographies (Mumbai, Delhi, Bangalore, etc.)
 * - Individual customer exposure
 */

import { Sector } from '@prisma/client'
import { ConcentrationRiskResult, GeographicConcentrationResult, LoanWithAll } from './types'

/**
 * Thresholds for concentration risk
 */
export const SECTOR_CONCENTRATION_THRESHOLD = 30 // % of portfolio
export const GEOGRAPHY_CONCENTRATION_THRESHOLD = 35 // % of portfolio
export const CUSTOMER_CONCENTRATION_THRESHOLD = 10 // % of portfolio

/**
 * Calculate sector-wise concentration risk
 */
export function calculateSectorConcentration(loans: LoanWithAll[]): ConcentrationRiskResult[] {
  if (loans.length === 0) return []

  // Calculate total portfolio exposure
  const totalExposure = loans.reduce((sum, loan) => sum + loan.outstanding_amount, 0)

  // Group loans by sector
  const sectorGroups = new Map<Sector, LoanWithAll[]>()

  for (const loan of loans) {
    if (!sectorGroups.has(loan.sector)) {
      sectorGroups.set(loan.sector, [])
    }
    sectorGroups.get(loan.sector)!.push(loan)
  }

  // Calculate concentration metrics for each sector
  const results: ConcentrationRiskResult[] = []

  for (const [sector, sectorLoans] of sectorGroups.entries()) {
    const sectorExposure = sectorLoans.reduce((sum, loan) => sum + loan.outstanding_amount, 0)
    const percentageOfPortfolio = (sectorExposure / totalExposure) * 100

    // Calculate average risk score for sector
    const avgRiskScore =
      sectorLoans.reduce((sum, loan) => {
        const latestAssessment = loan.risk_assessments[loan.risk_assessments.length - 1]
        return sum + (latestAssessment?.risk_score || 0)
      }, 0) / sectorLoans.length

    // Count at-risk loans (risk score > 60)
    const atRiskLoans = sectorLoans.filter(loan => {
      const latestAssessment = loan.risk_assessments[loan.risk_assessments.length - 1]
      return latestAssessment && latestAssessment.risk_score > 60
    }).length

    results.push({
      sector,
      totalExposure: Math.round(sectorExposure),
      loanCount: sectorLoans.length,
      percentageOfPortfolio: Math.round(percentageOfPortfolio * 10) / 10,
      flagged: percentageOfPortfolio > SECTOR_CONCENTRATION_THRESHOLD,
      avgRiskScore: Math.round(avgRiskScore * 10) / 10,
      atRiskLoans,
    })
  }

  // Sort by exposure (descending)
  results.sort((a, b) => b.totalExposure - a.totalExposure)

  return results
}

/**
 * Calculate geographic concentration risk
 */
export function calculateGeographicConcentration(
  loans: LoanWithAll[]
): GeographicConcentrationResult[] {
  if (loans.length === 0) return []

  // Calculate total portfolio exposure
  const totalExposure = loans.reduce((sum, loan) => sum + loan.outstanding_amount, 0)

  // Group loans by geography
  const geographyGroups = new Map<string, LoanWithAll[]>()

  for (const loan of loans) {
    const geography = loan.customer.geography
    if (!geographyGroups.has(geography)) {
      geographyGroups.set(geography, [])
    }
    geographyGroups.get(geography)!.push(loan)
  }

  // Calculate concentration metrics for each geography
  const results: GeographicConcentrationResult[] = []

  for (const [geography, geoLoans] of geographyGroups.entries()) {
    const geoExposure = geoLoans.reduce((sum, loan) => sum + loan.outstanding_amount, 0)
    const percentageOfPortfolio = (geoExposure / totalExposure) * 100

    // Calculate overdue exposure (loans with DPD > 0)
    const overdueExposure = geoLoans
      .filter(loan => {
        const latestRepayment = loan.repayments[loan.repayments.length - 1]
        return latestRepayment && latestRepayment.dpd > 0
      })
      .reduce((sum, loan) => sum + loan.outstanding_amount, 0)

    // Calculate average DPD
    const avgDPD =
      geoLoans.reduce((sum, loan) => {
        const latestRepayment = loan.repayments[loan.repayments.length - 1]
        return sum + (latestRepayment?.dpd || 0)
      }, 0) / geoLoans.length

    results.push({
      geography,
      totalExposure: Math.round(geoExposure),
      overdueExposure: Math.round(overdueExposure),
      loanCount: geoLoans.length,
      percentageOfPortfolio: Math.round(percentageOfPortfolio * 10) / 10,
      avgDPD: Math.round(avgDPD * 10) / 10,
      flagged: percentageOfPortfolio > GEOGRAPHY_CONCENTRATION_THRESHOLD,
    })
  }

  // Sort by exposure (descending)
  results.sort((a, b) => b.totalExposure - a.totalExposure)

  return results
}

/**
 * Calculate customer-level concentration risk
 * Returns customers with > 10% of portfolio exposure
 */
export function calculateCustomerConcentration(loans: LoanWithAll[]): Array<{
  customerId: string
  customerName: string
  totalExposure: number
  loanCount: number
  percentageOfPortfolio: number
  flagged: boolean
}> {
  if (loans.length === 0) return []

  // Calculate total portfolio exposure
  const totalExposure = loans.reduce((sum, loan) => sum + loan.outstanding_amount, 0)

  // Group loans by customer
  const customerGroups = new Map<string, LoanWithAll[]>()

  for (const loan of loans) {
    const customerId = loan.customer_id
    if (!customerGroups.has(customerId)) {
      customerGroups.set(customerId, [])
    }
    customerGroups.get(customerId)!.push(loan)
  }

  // Calculate concentration metrics for each customer
  const results = []

  for (const [customerId, customerLoans] of customerGroups.entries()) {
    const customerExposure = customerLoans.reduce((sum, loan) => sum + loan.outstanding_amount, 0)
    const percentageOfPortfolio = (customerExposure / totalExposure) * 100

    // Only include customers with significant exposure
    if (percentageOfPortfolio >= 1) {
      results.push({
        customerId,
        customerName: customerLoans[0].customer.customer_name,
        totalExposure: Math.round(customerExposure),
        loanCount: customerLoans.length,
        percentageOfPortfolio: Math.round(percentageOfPortfolio * 10) / 10,
        flagged: percentageOfPortfolio > CUSTOMER_CONCENTRATION_THRESHOLD,
      })
    }
  }

  // Sort by exposure (descending)
  results.sort((a, b) => b.totalExposure - a.totalExposure)

  return results
}

/**
 * Get overall portfolio concentration score (0-100)
 * Higher score = more concentrated = higher risk
 */
export function getPortfolioConcentrationScore(loans: LoanWithAll[]): {
  score: number
  risks: string[]
} {
  const sectorConc = calculateSectorConcentration(loans)
  const geoConc = calculateGeographicConcentration(loans)
  const customerConc = calculateCustomerConcentration(loans)

  let score = 0
  const risks: string[] = []

  // Check sector concentration
  const flaggedSectors = sectorConc.filter(s => s.flagged)
  if (flaggedSectors.length > 0) {
    score += 30
    risks.push(
      `${flaggedSectors.length} sector(s) exceed ${SECTOR_CONCENTRATION_THRESHOLD}% threshold`
    )
  }

  // Check geographic concentration
  const flaggedGeos = geoConc.filter(g => g.flagged)
  if (flaggedGeos.length > 0) {
    score += 25
    risks.push(
      `${flaggedGeos.length} geography(ies) exceed ${GEOGRAPHY_CONCENTRATION_THRESHOLD}% threshold`
    )
  }

  // Check customer concentration
  const flaggedCustomers = customerConc.filter(c => c.flagged)
  if (flaggedCustomers.length > 0) {
    score += 20
    risks.push(
      `${flaggedCustomers.length} customer(s) exceed ${CUSTOMER_CONCENTRATION_THRESHOLD}% threshold`
    )
  }

  // Additional penalty for very high concentration in any dimension
  const maxSectorPercentage = Math.max(...sectorConc.map(s => s.percentageOfPortfolio))
  if (maxSectorPercentage > 40) {
    score += 15
    risks.push(`Extremely high sector concentration: ${maxSectorPercentage.toFixed(1)}%`)
  }

  return {
    score: Math.min(100, score),
    risks,
  }
}
