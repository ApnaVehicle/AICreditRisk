/**
 * Portfolio Health Score Calculator
 * Calculates a composite 0-100 health score based on key portfolio metrics
 */

export interface HealthScoreInput {
  // NPA metrics
  grossNPARate: number // Percentage (e.g., 5.2 for 5.2%)
  npaExposure: number // Amount in rupees
  totalExposure: number // Amount in rupees

  // Collection metrics
  collectionEfficiency: number // Percentage (e.g., 85.5 for 85.5%)
  successfulRepayments: number
  totalRepayments: number

  // Risk metrics
  avgRiskScore: number // 0-100
  highRiskCount: number
  totalLoans: number

  // DPD metrics
  par30Rate: number // Percentage
  par30Count: number
  avgDPD: number // Average days past due
}

export interface HealthScoreBreakdown {
  overall: number // 0-100
  components: {
    npaScore: number // 0-100
    collectionScore: number // 0-100
    riskScore: number // 0-100
    dpdScore: number // 0-100
  }
  weights: {
    npaWeight: number
    collectionWeight: number
    riskWeight: number
    dpdWeight: number
  }
  grade: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'
  trend: number // Week-over-week change
}

// Scoring weights
const WEIGHTS = {
  npaWeight: 0.30,
  collectionWeight: 0.30,
  riskWeight: 0.20,
  dpdWeight: 0.20,
}

/**
 * Calculate NPA component score (0-100)
 * Lower NPA rate = higher score
 */
function calculateNPAScore(grossNPARate: number): number {
  // Industry benchmark: < 2% excellent, 2-5% good, 5-10% fair, > 10% poor
  if (grossNPARate <= 2) return 100
  if (grossNPARate <= 5) return 85 - (grossNPARate - 2) * 5 // 85-70
  if (grossNPARate <= 10) return 70 - (grossNPARate - 5) * 6 // 70-40
  if (grossNPARate <= 20) return 40 - (grossNPARate - 10) * 3 // 40-10
  return 10
}

/**
 * Calculate Collection Efficiency component score (0-100)
 * Higher efficiency = higher score
 */
function calculateCollectionScore(collectionEfficiency: number): number {
  // Industry benchmark: > 90% excellent, 80-90% good, 70-80% fair, < 70% poor
  if (collectionEfficiency >= 90) return 100
  if (collectionEfficiency >= 80) return 70 + (collectionEfficiency - 80) * 3 // 70-100
  if (collectionEfficiency >= 70) return 40 + (collectionEfficiency - 70) * 3 // 40-70
  if (collectionEfficiency >= 50) return 10 + (collectionEfficiency - 50) * 1.5 // 10-40
  return Math.max(0, collectionEfficiency / 5) // 0-10
}

/**
 * Calculate Risk Score component (0-100)
 * Lower average risk and fewer high-risk loans = higher score
 */
function calculateRiskScore(
  avgRiskScore: number,
  highRiskCount: number,
  totalLoans: number
): number {
  // Average risk score component (70% of this factor)
  const avgRiskComponent = Math.max(0, 100 - avgRiskScore) * 0.7

  // High-risk concentration component (30% of this factor)
  const highRiskPct = totalLoans > 0 ? (highRiskCount / totalLoans) * 100 : 0
  const concentrationComponent =
    highRiskPct <= 10
      ? 30
      : highRiskPct <= 20
      ? 20
      : highRiskPct <= 30
      ? 10
      : 0

  return avgRiskComponent + concentrationComponent
}

/**
 * Calculate DPD Performance component score (0-100)
 * Lower PAR30 rate and average DPD = higher score
 */
function calculateDPDScore(par30Rate: number, avgDPD: number): number {
  // PAR30 component (60% of this factor)
  let par30Component = 0
  if (par30Rate <= 5) par30Component = 60
  else if (par30Rate <= 10) par30Component = 50 - (par30Rate - 5) * 2
  else if (par30Rate <= 20) par30Component = 40 - (par30Rate - 10) * 2
  else par30Component = Math.max(0, 20 - (par30Rate - 20))

  // Average DPD component (40% of this factor)
  let dpdComponent = 0
  if (avgDPD <= 10) dpdComponent = 40
  else if (avgDPD <= 30) dpdComponent = 30 - (avgDPD - 10) * 0.5
  else if (avgDPD <= 60) dpdComponent = 20 - (avgDPD - 30) * 0.4
  else dpdComponent = Math.max(0, 10 - (avgDPD - 60) * 0.1)

  return par30Component + dpdComponent
}

/**
 * Determine health grade based on overall score
 */
function determineGrade(
  score: number
): 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical' {
  if (score >= 80) return 'Excellent'
  if (score >= 65) return 'Good'
  if (score >= 50) return 'Fair'
  if (score >= 35) return 'Poor'
  return 'Critical'
}

/**
 * Main function to calculate portfolio health score
 */
export function calculateHealthScore(
  input: HealthScoreInput,
  previousScore?: number
): HealthScoreBreakdown {
  // Calculate component scores
  const npaScore = calculateNPAScore(input.grossNPARate)
  const collectionScore = calculateCollectionScore(input.collectionEfficiency)
  const riskScore = calculateRiskScore(
    input.avgRiskScore,
    input.highRiskCount,
    input.totalLoans
  )
  const dpdScore = calculateDPDScore(input.par30Rate, input.avgDPD)

  // Calculate weighted overall score
  const overall =
    npaScore * WEIGHTS.npaWeight +
    collectionScore * WEIGHTS.collectionWeight +
    riskScore * WEIGHTS.riskWeight +
    dpdScore * WEIGHTS.dpdWeight

  // Calculate trend (week-over-week change)
  const trend = previousScore !== undefined ? overall - previousScore : 0

  return {
    overall: Math.round(overall * 10) / 10, // Round to 1 decimal
    components: {
      npaScore: Math.round(npaScore * 10) / 10,
      collectionScore: Math.round(collectionScore * 10) / 10,
      riskScore: Math.round(riskScore * 10) / 10,
      dpdScore: Math.round(dpdScore * 10) / 10,
    },
    weights: WEIGHTS,
    grade: determineGrade(overall),
    trend: Math.round(trend * 10) / 10,
  }
}

/**
 * Get color for health score visualization
 */
export function getHealthScoreColor(score: number): string {
  if (score >= 80) return '#10B981' // Green (Excellent)
  if (score >= 65) return '#3B82F6' // Blue (Good)
  if (score >= 50) return '#F59E0B' // Amber (Fair)
  if (score >= 35) return '#F97316' // Orange (Poor)
  return '#EF4444' // Red (Critical)
}

/**
 * Get gradient colors for gauge visualization
 */
export function getHealthScoreGradient(score: number): {
  start: string
  end: string
} {
  if (score >= 80)
    return { start: '#10B981', end: '#059669' } // Green gradient
  if (score >= 65) return { start: '#3B82F6', end: '#2563EB' } // Blue gradient
  if (score >= 50)
    return { start: '#F59E0B', end: '#D97706' } // Amber gradient
  if (score >= 35)
    return { start: '#F97316', end: '#EA580C' } // Orange gradient
  return { start: '#EF4444', end: '#DC2626' } // Red gradient
}
