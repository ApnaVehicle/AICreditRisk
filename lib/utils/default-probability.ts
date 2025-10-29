/**
 * Default Probability Calculator
 * ML-based prediction engine for loan default probability
 */

export interface LoanDataForPrediction {
  loan_id: string
  borrower_name: string
  loan_amount: number
  outstanding_amount: number
  sector: string
  risk_score: number

  // Payment history
  repayments: {
    dpd: number
    amount_paid: number
    expected_amount: number
    payment_date: string | null
  }[]

  // Current status
  current_dpd: number
  npa_status: boolean
  missed_payments: number
  total_payments: number
}

export interface DefaultPrediction {
  loan_id: string
  borrower_name: string
  outstanding_amount: number
  sector: string

  // Prediction
  default_probability: number // 0-100%
  confidence: number // 0-100%
  risk_level: 'High' | 'Medium' | 'Low'

  // Contributing factors
  factors: {
    name: string
    value: string
    weight: number // Percentage contribution to score
    isNegative: boolean // True if factor increases default risk
  }[]

  // Early warning signals
  warnings: string[]

  // Recommended actions
  recommended_action:
    | 'urgent_contact'
    | 'restructure'
    | 'legal_action'
    | 'enhanced_monitoring'
    | 'routine_monitoring'
}

// Sector risk multipliers based on industry volatility
const SECTOR_RISK_MULTIPLIERS: Record<string, number> = {
  Manufacturing: 1.2,
  Construction: 1.3,
  Agriculture: 1.4,
  Retail: 1.1,
  Services: 1.0,
  Technology: 0.9,
  Healthcare: 0.95,
  Education: 0.9,
  'Real Estate': 1.25,
  Transportation: 1.15,
  Hospitality: 1.35,
}

/**
 * Calculate DPD acceleration score (0-30 points)
 * Analyzes whether DPD is worsening over time
 */
function calculateDPDAcceleration(
  repayments: LoanDataForPrediction['repayments'],
  currentDPD: number
): { score: number; description: string; isNegative: boolean } {
  if (repayments.length < 3) {
    // Not enough history
    if (currentDPD >= 90)
      return {
        score: 30,
        description: '90+ DPD',
        isNegative: true,
      }
    if (currentDPD >= 60)
      return {
        score: 22,
        description: '60+ DPD',
        isNegative: true,
      }
    if (currentDPD >= 30)
      return {
        score: 15,
        description: '30+ DPD',
        isNegative: true,
      }
    return { score: 0, description: 'Current on payments', isNegative: false }
  }

  // Analyze last 3 repayments for trend
  const recentRepayments = repayments.slice(-3)
  const dpdValues = recentRepayments.map((r) => r.dpd)

  // Check for acceleration (worsening trend)
  const isAccelerating =
    dpdValues[2] > dpdValues[1] && dpdValues[1] > dpdValues[0]

  if (currentDPD >= 90) {
    return {
      score: isAccelerating ? 30 : 28,
      description: isAccelerating
        ? 'Critically overdue & accelerating'
        : 'Critically overdue (90+ DPD)',
      isNegative: true,
    }
  }
  if (currentDPD >= 60) {
    return {
      score: isAccelerating ? 22 : 20,
      description: isAccelerating
        ? 'Severely overdue & worsening'
        : 'Severely overdue (60+ DPD)',
      isNegative: true,
    }
  }
  if (currentDPD >= 30) {
    return {
      score: isAccelerating ? 15 : 12,
      description: isAccelerating
        ? 'Early delinquency & worsening'
        : 'Early delinquency (30+ DPD)',
      isNegative: true,
    }
  }
  if (isAccelerating && currentDPD > 0) {
    return {
      score: 8,
      description: 'Showing early signs of stress',
      isNegative: true,
    }
  }

  return {
    score: 0,
    description: 'Stable payment performance',
    isNegative: false,
  }
}

/**
 * Calculate payment pattern score (0-25 points)
 * Analyzes consistency and missed payments
 */
function calculatePaymentPattern(
  repayments: LoanDataForPrediction['repayments'],
  missedPayments: number,
  totalPayments: number
): { score: number; description: string; isNegative: boolean } {
  if (totalPayments === 0) {
    return {
      score: 15,
      description: 'New loan - no payment history',
      isNegative: true,
    }
  }

  const missedRate = (missedPayments / totalPayments) * 100

  // Check for consecutive missed payments
  const recentMissed =
    repayments.slice(-3).filter((r) => r.payment_date === null).length

  if (recentMissed >= 3) {
    return {
      score: 25,
      description: '3+ consecutive missed payments',
      isNegative: true,
    }
  }
  if (recentMissed >= 2) {
    return {
      score: 20,
      description: '2 consecutive missed payments',
      isNegative: true,
    }
  }
  if (missedRate >= 40) {
    return {
      score: 22,
      description: `${missedRate.toFixed(0)}% missed payment rate`,
      isNegative: true,
    }
  }
  if (missedRate >= 25) {
    return {
      score: 15,
      description: `${missedRate.toFixed(0)}% missed payment rate`,
      isNegative: true,
    }
  }
  if (missedRate >= 10) {
    return {
      score: 8,
      description: 'Occasional missed payments',
      isNegative: true,
    }
  }

  return {
    score: 0,
    description: 'Consistent payment history',
    isNegative: false,
  }
}

/**
 * Calculate risk score trajectory (0-20 points)
 */
function calculateRiskTrajectory(
  riskScore: number
): { score: number; description: string; isNegative: boolean } {
  if (riskScore >= 80) {
    return {
      score: 20,
      description: 'Very high risk score (80+)',
      isNegative: true,
    }
  }
  if (riskScore >= 65) {
    return {
      score: 15,
      description: 'High risk score (65-79)',
      isNegative: true,
    }
  }
  if (riskScore >= 50) {
    return {
      score: 10,
      description: 'Elevated risk score (50-64)',
      isNegative: true,
    }
  }
  if (riskScore >= 35) {
    return {
      score: 5,
      description: 'Moderate risk score (35-49)',
      isNegative: true,
    }
  }
  return {
    score: 0,
    description: 'Low risk score (<35)',
    isNegative: false,
  }
}

/**
 * Calculate sector risk (0-15 points)
 */
function calculateSectorRisk(
  sector: string
): { score: number; description: string; isNegative: boolean } {
  const multiplier = SECTOR_RISK_MULTIPLIERS[sector] || 1.0
  const baseScore = 10

  const score = Math.round(baseScore * multiplier)

  if (multiplier > 1.2) {
    return {
      score,
      description: `High-risk sector (${sector})`,
      isNegative: true,
    }
  }
  if (multiplier > 1.0) {
    return {
      score,
      description: `Moderate-risk sector (${sector})`,
      isNegative: true,
    }
  }
  return {
    score,
    description: `Stable sector (${sector})`,
    isNegative: false,
  }
}

/**
 * Calculate NPA status impact (0-10 points)
 */
function calculateNPAImpact(
  npaStatus: boolean
): { score: number; description: string; isNegative: boolean } {
  if (npaStatus) {
    return {
      score: 10,
      description: 'Already classified as NPA',
      isNegative: true,
    }
  }
  return {
    score: 0,
    description: 'Not classified as NPA',
    isNegative: false,
  }
}

/**
 * Determine risk level based on probability
 */
function determineRiskLevel(
  probability: number
): 'High' | 'Medium' | 'Low' {
  if (probability >= 70) return 'High'
  if (probability >= 40) return 'Medium'
  return 'Low'
}

/**
 * Determine recommended action
 */
function determineRecommendedAction(
  probability: number,
  currentDPD: number,
  npaStatus: boolean
): DefaultPrediction['recommended_action'] {
  if (npaStatus || probability >= 80) return 'legal_action'
  if (probability >= 70 || currentDPD >= 90) return 'urgent_contact'
  if (probability >= 50 || currentDPD >= 60) return 'restructure'
  if (probability >= 30 || currentDPD >= 30) return 'enhanced_monitoring'
  return 'routine_monitoring'
}

/**
 * Generate early warning signals
 */
function generateWarnings(loan: LoanDataForPrediction): string[] {
  const warnings: string[] = []

  if (loan.current_dpd >= 90) {
    warnings.push('Critical: 90+ days past due')
  } else if (loan.current_dpd >= 60) {
    warnings.push('Severe: 60+ days past due')
  } else if (loan.current_dpd >= 30) {
    warnings.push('Early warning: 30+ days past due')
  }

  const recentMissed = loan.repayments
    .slice(-3)
    .filter((r) => r.payment_date === null).length
  if (recentMissed >= 2) {
    warnings.push(`${recentMissed} consecutive missed payments`)
  }

  if (loan.risk_score >= 80) {
    warnings.push('Very high risk score')
  }

  if (loan.npa_status) {
    warnings.push('Classified as Non-Performing Asset')
  }

  const missedRate =
    loan.total_payments > 0
      ? (loan.missed_payments / loan.total_payments) * 100
      : 0
  if (missedRate >= 30) {
    warnings.push(`${missedRate.toFixed(0)}% payment default rate`)
  }

  return warnings
}

/**
 * Calculate confidence score
 * Based on data completeness and history length
 */
function calculateConfidence(
  repayments: LoanDataForPrediction['repayments']
): number {
  let confidence = 50 // Base confidence

  // More repayment history = higher confidence
  if (repayments.length >= 12) confidence += 30
  else if (repayments.length >= 6) confidence += 20
  else if (repayments.length >= 3) confidence += 10

  // Complete payment data = higher confidence
  const hasCompleteData = repayments.every(
    (r) => r.dpd !== undefined && r.amount_paid !== undefined
  )
  if (hasCompleteData) confidence += 20

  return Math.min(confidence, 95) // Cap at 95%
}

/**
 * Main function: Calculate default probability for a loan
 */
export function calculateDefaultProbability(
  loan: LoanDataForPrediction
): DefaultPrediction {
  // Calculate component scores
  const dpdResult = calculateDPDAcceleration(
    loan.repayments,
    loan.current_dpd
  )
  const paymentResult = calculatePaymentPattern(
    loan.repayments,
    loan.missed_payments,
    loan.total_payments
  )
  const riskResult = calculateRiskTrajectory(loan.risk_score)
  const sectorResult = calculateSectorRisk(loan.sector)
  const npaResult = calculateNPAImpact(loan.npa_status)

  // Calculate total probability (sum of all components)
  const totalScore =
    dpdResult.score +
    paymentResult.score +
    riskResult.score +
    sectorResult.score +
    npaResult.score

  // Convert to percentage (max possible score is 100)
  const defaultProbability = Math.min(totalScore, 100)

  // Calculate confidence
  const confidence = calculateConfidence(loan.repayments)

  // Determine risk level
  const risk_level = determineRiskLevel(defaultProbability)

  // Generate warnings
  const warnings = generateWarnings(loan)

  // Determine recommended action
  const recommended_action = determineRecommendedAction(
    defaultProbability,
    loan.current_dpd,
    loan.npa_status
  )

  // Build factors array
  const factors = [
    {
      name: 'DPD Status',
      value: dpdResult.description,
      weight: 30,
      isNegative: dpdResult.isNegative,
    },
    {
      name: 'Payment Pattern',
      value: paymentResult.description,
      weight: 25,
      isNegative: paymentResult.isNegative,
    },
    {
      name: 'Risk Score',
      value: riskResult.description,
      weight: 20,
      isNegative: riskResult.isNegative,
    },
    {
      name: 'Sector Risk',
      value: sectorResult.description,
      weight: 15,
      isNegative: sectorResult.isNegative,
    },
    {
      name: 'NPA Status',
      value: npaResult.description,
      weight: 10,
      isNegative: npaResult.isNegative,
    },
  ]

  return {
    loan_id: loan.loan_id,
    borrower_name: loan.borrower_name,
    outstanding_amount: loan.outstanding_amount,
    sector: loan.sector,
    default_probability: Math.round(defaultProbability * 10) / 10, // 1 decimal
    confidence: Math.round(confidence),
    risk_level,
    factors,
    warnings,
    recommended_action,
  }
}

/**
 * Get color for probability visualization
 */
export function getProbabilityColor(probability: number): string {
  if (probability >= 70) return '#EF4444' // Red (High)
  if (probability >= 40) return '#F59E0B' // Amber (Medium)
  return '#10B981' // Green (Low)
}

/**
 * Get action label
 */
export function getActionLabel(
  action: DefaultPrediction['recommended_action']
): string {
  switch (action) {
    case 'urgent_contact':
      return 'Urgent Contact Required'
    case 'restructure':
      return 'Consider Restructuring'
    case 'legal_action':
      return 'Legal Action Recommended'
    case 'enhanced_monitoring':
      return 'Enhanced Monitoring'
    case 'routine_monitoring':
      return 'Routine Monitoring'
  }
}
