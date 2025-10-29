/**
 * Risk Scoring Module
 *
 * Calculates composite risk score (0-100) for each loan based on:
 * 1. Delinquency Score (40% weight) - Payment history and DPD
 * 2. Customer Credit Profile (30% weight) - Credit score, DTI, employment
 * 3. Loan Characteristics (20% weight) - Amount, tenure, sector risk
 * 4. Concentration Risk (10% weight) - Portfolio-level risk
 */

import { LoanWithAll, RiskScoreResult, PortfolioContext } from './types'
import { calculateDelinquencyRisk } from './delinquency'
import {
  calculateSectorConcentration,
  SECTOR_CONCENTRATION_THRESHOLD,
} from './concentration'

/**
 * Risk category thresholds
 */
export const RISK_THRESHOLDS = {
  LOW: 35, // 0-35: Low risk
  MEDIUM: 65, // 36-65: Medium risk
  HIGH: 100, // 66-100: High risk
}

/**
 * Calculate comprehensive risk score for a loan
 */
export function calculateRiskScore(
  loan: LoanWithAll,
  portfolioContext: PortfolioContext
): RiskScoreResult {
  // =========================================================================
  // 1. DELINQUENCY SCORE (40% weight)
  // =========================================================================

  const delinquencyResult = calculateDelinquencyRisk({
    ...loan,
    repayments: loan.repayments,
  })

  const delinquencyScore = delinquencyResult.score

  // =========================================================================
  // 2. CUSTOMER CREDIT PROFILE SCORE (30% weight)
  // =========================================================================

  let creditProfileScore = 0

  // Credit score component (0-850 scale, normalize to 0-100)
  const creditScore = loan.customer.credit_score
  let creditScoreRisk = 0

  if (creditScore >= 750) {
    creditScoreRisk = 10 // Excellent
  } else if (creditScore >= 700) {
    creditScoreRisk = 25 // Good
  } else if (creditScore >= 650) {
    creditScoreRisk = 40 // Fair
  } else if (creditScore >= 600) {
    creditScoreRisk = 60 // Poor
  } else {
    creditScoreRisk = 85 // Very Poor
  }

  creditProfileScore += creditScoreRisk * 0.6 // 60% of credit profile

  // DTI ratio component
  const dtiRatio = loan.customer.dti_ratio
  let dtiRisk = 0

  if (dtiRatio > 60) {
    dtiRisk = 80 // Very high
  } else if (dtiRatio > 50) {
    dtiRisk = 60 // High
  } else if (dtiRatio > 40) {
    dtiRisk = 40 // Moderate
  } else if (dtiRatio > 30) {
    dtiRisk = 20 // Low
  } else {
    dtiRisk = 10 // Very low
  }

  creditProfileScore += dtiRisk * 0.4 // 40% of credit profile

  // =========================================================================
  // 3. LOAN CHARACTERISTICS SCORE (20% weight)
  // =========================================================================

  let loanCharacteristicsScore = 0

  // Outstanding amount ratio
  const outstandingRatio = loan.outstanding_amount / loan.loan_amount
  loanCharacteristicsScore += outstandingRatio * 30

  // Sector risk
  const sectorRiskMap: Record<string, number> = {
    IT: 10, // Low risk
    HEALTHCARE: 15, // Low-medium risk
    MANUFACTURING: 30, // Medium risk
    RETAIL: 35, // Medium-high risk
    AGRICULTURE: 45, // High risk
    REAL_ESTATE: 40, // High risk
  }

  loanCharacteristicsScore += sectorRiskMap[loan.sector] || 30

  // Loan age factor (older loans with good payment = lower risk)
  const loanAgeMonths =
    (new Date().getTime() - new Date(loan.disbursement_date).getTime()) /
    (1000 * 60 * 60 * 24 * 30)

  if (loanAgeMonths > 12 && delinquencyScore < 20) {
    loanCharacteristicsScore -= 10 // Mature loan with good history
  }

  // Loan status penalty
  if (loan.status === 'NPA') {
    loanCharacteristicsScore += 50
  } else if (loan.status === 'RESTRUCTURED') {
    loanCharacteristicsScore += 30
  }

  // Cap at 100
  loanCharacteristicsScore = Math.min(100, Math.max(0, loanCharacteristicsScore))

  // =========================================================================
  // 4. CONCENTRATION RISK SCORE (10% weight)
  // =========================================================================

  let concentrationScore = 0

  // Sector concentration
  const sectorPercentage = portfolioContext.sectorExposure.get(loan.sector) || 0
  const sectorExposurePercent = (sectorPercentage / portfolioContext.totalExposure) * 100

  if (sectorExposurePercent > SECTOR_CONCENTRATION_THRESHOLD) {
    concentrationScore += 50
  } else if (sectorExposurePercent > 25) {
    concentrationScore += 30
  }

  // Geography concentration
  const geoPercentage = portfolioContext.geographyExposure.get(loan.customer.geography) || 0
  const geoExposurePercent = (geoPercentage / portfolioContext.totalExposure) * 100

  if (geoExposurePercent > 35) {
    concentrationScore += 30
  } else if (geoExposurePercent > 30) {
    concentrationScore += 20
  }

  // =========================================================================
  // FINAL RISK SCORE CALCULATION
  // =========================================================================

  const finalRiskScore =
    delinquencyScore * 0.4 + // 40%
    creditProfileScore * 0.3 + // 30%
    loanCharacteristicsScore * 0.2 + // 20%
    concentrationScore * 0.1 // 10%

  // Round to 1 decimal place
  const riskScore = Math.round(finalRiskScore * 10) / 10

  // =========================================================================
  // DETERMINE RISK CATEGORY
  // =========================================================================

  let riskCategory: 'LOW' | 'MEDIUM' | 'HIGH'

  if (riskScore <= RISK_THRESHOLDS.LOW) {
    riskCategory = 'LOW'
  } else if (riskScore <= RISK_THRESHOLDS.MEDIUM) {
    riskCategory = 'MEDIUM'
  } else {
    riskCategory = 'HIGH'
  }

  // =========================================================================
  // GENERATE FLAGS
  // =========================================================================

  const flags = {
    high_dpd: delinquencyResult.maxDPD > 15,
    sector_concentration: sectorExposurePercent > SECTOR_CONCENTRATION_THRESHOLD,
    geography_risk: geoExposurePercent > 35,
    high_dti: dtiRatio > 50,
  }

  // =========================================================================
  // GENERATE RECOMMENDATIONS
  // =========================================================================

  const recommendations: string[] = []

  if (riskScore > 70) {
    recommendations.push('URGENT: Immediate follow-up required')
  }

  if (delinquencyResult.maxDPD > 30) {
    recommendations.push('Contact customer for payment arrangement')
  }

  if (delinquencyResult.consecutiveDelays >= 2) {
    recommendations.push('Review repayment capacity with customer')
  }

  if (creditScore < 600) {
    recommendations.push('Consider requiring additional collateral')
  }

  if (dtiRatio > 60) {
    recommendations.push('High DTI - assess income stability')
  }

  if (loan.status === 'RESTRUCTURED') {
    recommendations.push('Monitor restructured loan closely')
  }

  if (flags.sector_concentration) {
    recommendations.push(`Portfolio over-exposed to ${loan.sector} sector`)
  }

  if (recommendations.length === 0 && riskCategory === 'LOW') {
    recommendations.push('Continue routine monitoring')
  }

  return {
    loanId: loan.id,
    riskScore,
    riskCategory,
    factors: {
      delinquencyScore: Math.round(delinquencyScore * 10) / 10,
      creditProfileScore: Math.round(creditProfileScore * 10) / 10,
      loanCharacteristicsScore: Math.round(loanCharacteristicsScore * 10) / 10,
      concentrationScore: Math.round(concentrationScore * 10) / 10,
    },
    flags,
    recommendations,
  }
}

/**
 * Calculate portfolio-level statistics
 */
export function calculatePortfolioStats(loans: LoanWithAll[]): {
  totalLoans: number
  activeLoans: number
  npaLoans: number
  npaRate: number
  avgRiskScore: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
  totalExposure: number
  atRiskExposure: number
} {
  const totalLoans = loans.length
  const activeLoans = loans.filter(l => l.status === 'ACTIVE').length
  const npaLoans = loans.filter(l => l.status === 'NPA').length
  const npaRate = totalLoans > 0 ? (npaLoans / totalLoans) * 100 : 0

  // Calculate average risk score from assessments
  const totalRiskScore = loans.reduce((sum, loan) => {
    const latestAssessment = loan.risk_assessments[loan.risk_assessments.length - 1]
    return sum + (latestAssessment?.risk_score || 0)
  }, 0)
  const avgRiskScore = totalLoans > 0 ? totalRiskScore / totalLoans : 0

  // Count by risk category
  const highRiskCount = loans.filter(l => {
    const assessment = l.risk_assessments[l.risk_assessments.length - 1]
    return assessment && assessment.risk_category === 'HIGH'
  }).length

  const mediumRiskCount = loans.filter(l => {
    const assessment = l.risk_assessments[l.risk_assessments.length - 1]
    return assessment && assessment.risk_category === 'MEDIUM'
  }).length

  const lowRiskCount = loans.filter(l => {
    const assessment = l.risk_assessments[l.risk_assessments.length - 1]
    return assessment && assessment.risk_category === 'LOW'
  }).length

  // Calculate exposure
  const totalExposure = loans.reduce((sum, l) => sum + l.outstanding_amount, 0)

  // At-risk exposure (HIGH risk loans)
  const atRiskExposure = loans
    .filter(l => {
      const assessment = l.risk_assessments[l.risk_assessments.length - 1]
      return assessment && assessment.risk_category === 'HIGH'
    })
    .reduce((sum, l) => sum + l.outstanding_amount, 0)

  return {
    totalLoans,
    activeLoans,
    npaLoans,
    npaRate: Math.round(npaRate * 10) / 10,
    avgRiskScore: Math.round(avgRiskScore * 10) / 10,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    totalExposure: Math.round(totalExposure),
    atRiskExposure: Math.round(atRiskExposure),
  }
}

/**
 * Build portfolio context for risk calculations
 */
export function buildPortfolioContext(loans: LoanWithAll[]): PortfolioContext {
  const totalExposure = loans.reduce((sum, l) => sum + l.outstanding_amount, 0)

  // Sector exposure
  const sectorExposure = new Map()
  loans.forEach(loan => {
    const current = sectorExposure.get(loan.sector) || 0
    sectorExposure.set(loan.sector, current + loan.outstanding_amount)
  })

  // Geography exposure
  const geographyExposure = new Map()
  loans.forEach(loan => {
    const current = geographyExposure.get(loan.customer.geography) || 0
    geographyExposure.set(loan.customer.geography, current + loan.outstanding_amount)
  })

  return {
    totalLoans: loans.length,
    totalExposure,
    sectorExposure,
    geographyExposure,
  }
}
