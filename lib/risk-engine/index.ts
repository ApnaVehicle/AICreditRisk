/**
 * Risk Engine - Main Export
 *
 * Exports all risk calculation functions for use in API routes
 */

// Export all delinquency functions
export {
  calculateDelinquencyRisk,
  getDelinquencyTrend,
  hasMissedPayments,
  calculatePaymentConsistency,
  DPD_THRESHOLD,
  DPD_CRITICAL,
  DPD_SEVERE,
} from './delinquency'

// Export all concentration functions
export {
  calculateSectorConcentration,
  calculateGeographicConcentration,
  calculateCustomerConcentration,
  getPortfolioConcentrationScore,
  SECTOR_CONCENTRATION_THRESHOLD,
  GEOGRAPHY_CONCENTRATION_THRESHOLD,
  CUSTOMER_CONCENTRATION_THRESHOLD,
} from './concentration'

// Export all scoring functions
export {
  calculateRiskScore,
  calculatePortfolioStats,
  buildPortfolioContext,
  RISK_THRESHOLDS,
} from './scoring'

// Export all types
export type {
  LoanWithCustomer,
  LoanWithRepayments,
  LoanWithAll,
  DelinquencyRiskResult,
  ConcentrationRiskResult,
  GeographicConcentrationResult,
  RiskScoreResult,
  PortfolioContext,
  RiskAlert,
} from './types'
