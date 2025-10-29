/**
 * Delinquency Detection Module
 *
 * Identifies loans with early signs of delinquency based on:
 * - Days Past Due (DPD) > 15 days
 * - Consecutive payment delays
 * - Partial payments
 * - Payment pattern deterioration
 */

import { Repayment } from '@prisma/client'
import { DelinquencyRiskResult, LoanWithRepayments } from './types'

/**
 * Flag loans with DPD > 15 days as early warning sign
 */
export const DPD_THRESHOLD = 15
export const DPD_CRITICAL = 30
export const DPD_SEVERE = 60

/**
 * Calculate delinquency risk for a loan based on repayment history
 */
export function calculateDelinquencyRisk(loan: LoanWithRepayments): DelinquencyRiskResult {
  const repayments = loan.repayments

  if (repayments.length === 0) {
    return {
      score: 0,
      flagged: false,
      maxDPD: 0,
      avgDPD: 0,
      consecutiveDelays: 0,
      reason: 'No repayment history',
    }
  }

  // Calculate key metrics
  const maxDPD = Math.max(...repayments.map(r => r.dpd))
  const avgDPD = repayments.reduce((sum, r) => sum + r.dpd, 0) / repayments.length

  // Count consecutive delays
  const sortedRepayments = [...repayments].sort((a, b) =>
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  )

  let consecutiveDelays = 0
  let currentStreak = 0

  for (const repayment of sortedRepayments.slice(-6)) {
    if (repayment.dpd > 0) {
      currentStreak++
      consecutiveDelays = Math.max(consecutiveDelays, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  // Calculate risk score based on DPD
  let score = 0
  let reasons: string[] = []

  // DPD-based scoring
  if (maxDPD === 0) {
    score = 5
    reasons.push('Perfect payment history')
  } else if (maxDPD <= 5) {
    score = 10
    reasons.push('Minor delays only')
  } else if (maxDPD <= 15) {
    score = 25
    reasons.push(`Occasional delays (max ${maxDPD} days)`)
  } else if (maxDPD <= 30) {
    score = 50
    reasons.push(`Consistent delays (max ${maxDPD} days)`)
  } else if (maxDPD <= 60) {
    score = 75
    reasons.push(`Serious delinquency (max ${maxDPD} days)`)
  } else {
    score = 95
    reasons.push(`Critical delinquency (max ${maxDPD} days)`)
  }

  // Penalty for consecutive delays
  if (consecutiveDelays >= 3) {
    score += 10
    reasons.push(`${consecutiveDelays} consecutive delayed payments`)
  }

  // Penalty for high average DPD
  if (avgDPD > 10) {
    score += 5
    reasons.push(`High average DPD: ${avgDPD.toFixed(1)} days`)
  }

  // Check for partial payments
  const recentRepayments = sortedRepayments.slice(-3)
  const partialPayments = recentRepayments.filter(r =>
    r.payment_amount && r.payment_amount < r.emi_amount
  ).length

  if (partialPayments > 0) {
    score += 10
    reasons.push(`${partialPayments} partial payments in last 3 EMIs`)
  }

  // Cap score at 100
  score = Math.min(100, score)

  // Determine if flagged
  const flagged = maxDPD > DPD_THRESHOLD || consecutiveDelays >= 2

  return {
    score,
    flagged,
    maxDPD,
    avgDPD: Math.round(avgDPD * 10) / 10,
    consecutiveDelays,
    reason: reasons.join('; '),
  }
}

/**
 * Get recent delinquency trend (improving/stable/worsening)
 */
export function getDelinquencyTrend(repayments: Repayment[]): 'improving' | 'stable' | 'worsening' {
  if (repayments.length < 4) {
    return 'stable'
  }

  const sorted = [...repayments].sort((a, b) =>
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  )

  const recent3 = sorted.slice(-3).reduce((sum, r) => sum + r.dpd, 0) / 3
  const previous3 = sorted.slice(-6, -3).reduce((sum, r) => sum + r.dpd, 0) / 3

  if (recent3 < previous3 * 0.7) {
    return 'improving'
  } else if (recent3 > previous3 * 1.3) {
    return 'worsening'
  } else {
    return 'stable'
  }
}

/**
 * Check if loan has missed payments in last N months
 */
export function hasMissedPayments(repayments: Repayment[], months: number = 3): boolean {
  const sorted = [...repayments].sort((a, b) =>
    new Date(b.due_date).getTime() - new Date(a.due_date).getTime()
  )

  const recent = sorted.slice(0, months)
  return recent.some(r => r.payment_status === 'MISSED')
}

/**
 * Calculate payment consistency score (0-100, higher = more consistent)
 */
export function calculatePaymentConsistency(repayments: Repayment[]): number {
  if (repayments.length === 0) return 50

  const onTimePayments = repayments.filter(r => r.dpd <= 3).length
  const consistency = (onTimePayments / repayments.length) * 100

  return Math.round(consistency)
}
