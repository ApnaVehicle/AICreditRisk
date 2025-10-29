/**
 * AI Agent Tools
 *
 * LangChain tools that allow the agent to query internal APIs
 * Each tool corresponds to a backend API endpoint
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

// Import new comprehensive tools
import { queryLoansTool } from './tools/loan-query'
import { customerAnalyticsTool } from './tools/customer-analytics'
import { repaymentAnalyticsTool } from './tools/repayment-analytics'

// Base URL for API calls (will be set dynamically)
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
}

/**
 * Tool 1: Get High-Risk Loans
 */
export const getHighRiskLoansTool = new DynamicStructuredTool({
  name: 'getHighRiskLoans',
  description:
    'Fetch top high-risk loans from the portfolio. Returns loans with risk scores above threshold, sorted by risk score (highest first). Use this when user asks about risky loans, loans needing attention, or critical accounts.',
  schema: z.object({
    limit: z.number().default(10).describe('Number of loans to return (default: 10)'),
    sector: z
      .string()
      .optional()
      .describe(
        'Filter by sector: MANUFACTURING, RETAIL, IT, HEALTHCARE, REAL_ESTATE, AGRICULTURE'
      ),
    minRiskScore: z
      .number()
      .default(60)
      .describe('Minimum risk score threshold (default: 60)'),
  }),
  func: async ({ limit, sector, minRiskScore }) => {
    try {
      const baseUrl = getBaseUrl()
      const params = new URLSearchParams({
        limit: limit.toString(),
        minRiskScore: minRiskScore.toString(),
      })
      if (sector) params.append('sector', sector)

      const response = await fetch(`${baseUrl}/api/loans/high-risk?${params}`)
      const data = await response.json()

      if (!data.success) {
        return JSON.stringify({ error: data.error })
      }

      return JSON.stringify(data)
    } catch (error) {
      return JSON.stringify({ error: 'Failed to fetch high-risk loans' })
    }
  },
})

/**
 * Tool 2: Get DPD Trends
 */
export const getDPDTrendsTool = new DynamicStructuredTool({
  name: 'getDPDTrends',
  description:
    'Analyze Days Past Due (DPD) trends over time by sector. Shows how delinquency patterns are changing. Use this when user asks about payment trends, delinquency patterns, or sector-wise payment behavior over time.',
  schema: z.object({
    sector: z
      .string()
      .optional()
      .describe('Filter by specific sector (optional, shows all sectors if not provided)'),
    months: z.number().default(6).describe('Number of months to analyze (default: 6)'),
  }),
  func: async ({ sector, months }) => {
    try {
      const baseUrl = getBaseUrl()
      const params = new URLSearchParams({
        months: months.toString(),
      })
      if (sector) params.append('sector', sector)

      const response = await fetch(`${baseUrl}/api/analytics/dpd-trends?${params}`)
      const data = await response.json()

      if (!data.success) {
        return JSON.stringify({ error: data.error })
      }

      return JSON.stringify(data)
    } catch (error) {
      return JSON.stringify({ error: 'Failed to fetch DPD trends' })
    }
  },
})

/**
 * Tool 3: Get Sector Exposure
 */
export const getSectorExposureTool = new DynamicStructuredTool({
  name: 'getSectorExposure',
  description:
    'Get sector-wise portfolio exposure and concentration analysis. Shows which sectors have the most exposure, at-risk loans, and concentration risks. Use this when user asks about sector distribution, sector concentration, or which sectors are risky.',
  schema: z.object({}),
  func: async () => {
    try {
      const baseUrl = getBaseUrl()
      const response = await fetch(`${baseUrl}/api/analytics/sector-exposure`)
      const data = await response.json()

      if (!data.success) {
        return JSON.stringify({ error: data.error })
      }

      return JSON.stringify(data)
    } catch (error) {
      return JSON.stringify({ error: 'Failed to fetch sector exposure' })
    }
  },
})

/**
 * Tool 4: Get Geographic Risk
 */
export const getGeographicRiskTool = new DynamicStructuredTool({
  name: 'getGeographicRisk',
  description:
    'Analyze geographic distribution of loans and overdue exposure by region (Mumbai, Delhi, Bangalore, etc.). Shows which regions have highest exposure and overdue amounts. Use this when user asks about geographic risk, regional exposure, or which city/region needs attention.',
  schema: z.object({}),
  func: async () => {
    try {
      const baseUrl = getBaseUrl()
      const response = await fetch(`${baseUrl}/api/analytics/geographic-risk`)
      const data = await response.json()

      if (!data.success) {
        return JSON.stringify({ error: data.error })
      }

      return JSON.stringify(data)
    } catch (error) {
      return JSON.stringify({ error: 'Failed to fetch geographic risk' })
    }
  },
})

/**
 * Tool 5: Get Portfolio Summary
 */
export const getPortfolioSummaryTool = new DynamicStructuredTool({
  name: 'getPortfolioSummary',
  description:
    'Get overall portfolio health metrics including total loans, NPA rate, risk distribution, and overdue statistics. Use this when user asks about overall portfolio health, NPA rate, or general portfolio statistics.',
  schema: z.object({}),
  func: async () => {
    try {
      const baseUrl = getBaseUrl()
      const response = await fetch(`${baseUrl}/api/analytics/portfolio-summary`)
      const data = await response.json()

      if (!data.success) {
        return JSON.stringify({ error: data.error })
      }

      return JSON.stringify(data)
    } catch (error) {
      return JSON.stringify({ error: 'Failed to fetch portfolio summary' })
    }
  },
})

/**
 * Tool 6: Get Loan Details
 */
export const getLoanDetailsTool = new DynamicStructuredTool({
  name: 'getLoanDetails',
  description:
    'Get detailed information about a specific loan including customer info, repayment history, and risk assessment. Use this when user asks about a specific loan ID or wants detailed information about a particular loan.',
  schema: z.object({
    loanId: z.string().describe('The loan ID to fetch details for'),
  }),
  func: async ({ loanId }) => {
    try {
      const baseUrl = getBaseUrl()
      const response = await fetch(`${baseUrl}/api/loans/${loanId}`)
      const data = await response.json()

      if (!data.success) {
        return JSON.stringify({ error: data.error })
      }

      return JSON.stringify(data)
    } catch (error) {
      return JSON.stringify({ error: 'Failed to fetch loan details' })
    }
  },
})

/**
 * Tool 7: Create Alert
 */
export const createAlertTool = new DynamicStructuredTool({
  name: 'createAlert',
  description:
    'Create a risk alert for a loan when critical thresholds are breached. Use this when you identify loans with risk score > 80, DPD > 60, or other critical risk conditions that require immediate attention.',
  schema: z.object({
    loanId: z.string().describe('The loan ID to create alert for'),
    alertType: z
      .string()
      .describe(
        'Type of alert: HIGH_DPD, SECTOR_CONCENTRATION, HIGH_RISK_SCORE, NPA_RISK, PAYMENT_MISSED'
      ),
    priority: z.enum(['high', 'medium', 'low']).describe('Alert priority level'),
    message: z.string().describe('Alert message describing the risk condition'),
  }),
  func: async ({ loanId, alertType, priority, message }) => {
    try {
      const baseUrl = getBaseUrl()
      const response = await fetch(`${baseUrl}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loan_id: loanId,
          alert_type: alertType,
          priority,
          message,
        }),
      })
      const data = await response.json()

      if (!data.success) {
        return JSON.stringify({ error: data.error })
      }

      return JSON.stringify(data)
    } catch (error) {
      return JSON.stringify({ error: 'Failed to create alert' })
    }
  },
})

/**
 * Export all tools as an array
 *
 * Total: 10 tools (7 original + 3 new comprehensive tools)
 */
export const allTools = [
  // Original 7 tools
  getHighRiskLoansTool,
  getDPDTrendsTool,
  getSectorExposureTool,
  getGeographicRiskTool,
  getPortfolioSummaryTool,
  getLoanDetailsTool,
  createAlertTool,

  // New comprehensive tools (Phase 2)
  queryLoansTool,          // General loan query with flexible filters
  customerAnalyticsTool,   // Customer-level analytics and aggregations
  repaymentAnalyticsTool,  // Repayment behavior and payment patterns
]
