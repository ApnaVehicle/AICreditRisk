/**
 * Type definitions for Risk Engine
 */

import { Loan, Customer, Repayment, RiskAssessment, Sector } from '@prisma/client'

// Extended types with relationships
export type LoanWithCustomer = Loan & { customer: Customer }
export type LoanWithRepayments = Loan & { repayments: Repayment[] }
export type LoanWithAll = Loan & {
  customer: Customer
  repayments: Repayment[]
  risk_assessments: RiskAssessment[]
}

// Risk calculation results
export interface DelinquencyRiskResult {
  score: number // 0-100
  flagged: boolean
  maxDPD: number
  avgDPD: number
  consecutiveDelays: number
  reason: string
}

export interface ConcentrationRiskResult {
  sector: Sector
  totalExposure: number
  loanCount: number
  percentageOfPortfolio: number
  flagged: boolean
  avgRiskScore: number
  atRiskLoans: number
}

export interface GeographicConcentrationResult {
  geography: string
  totalExposure: number
  overdueExposure: number
  loanCount: number
  percentageOfPortfolio: number
  avgDPD: number
  flagged: boolean
}

export interface RiskScoreResult {
  loanId: string
  riskScore: number // 0-100
  riskCategory: 'LOW' | 'MEDIUM' | 'HIGH'
  factors: {
    delinquencyScore: number
    creditProfileScore: number
    loanCharacteristicsScore: number
    concentrationScore: number
  }
  flags: {
    high_dpd: boolean
    sector_concentration: boolean
    geography_risk: boolean
    high_dti: boolean
  }
  recommendations: string[]
}

export interface PortfolioContext {
  totalLoans: number
  totalExposure: number
  sectorExposure: Map<Sector, number>
  geographyExposure: Map<string, number>
}

// Alert types
export interface RiskAlert {
  alertId: string
  loanId: string
  customerName: string
  alertType: 'HIGH_DPD' | 'SECTOR_CONCENTRATION' | 'HIGH_RISK_SCORE' | 'NPA_RISK' | 'PAYMENT_MISSED'
  priority: 'high' | 'medium' | 'low'
  message: string
  createdAt: Date
  status: 'active' | 'resolved'
}
