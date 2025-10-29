/**
 * Repayment Analytics Tool
 *
 * Provides repayment-level analytics and patterns:
 * - Payment rates by sector/geography
 * - DPD analysis and trends
 * - Delayed payment counts and percentages
 * - On-time payment metrics
 * - Payment behavior patterns
 *
 * This tool enables answering questions like:
 * - "What's the payment rate for Manufacturing sector?"
 * - "How many delayed payments do we have?"
 * - "Show me on-time payment percentage by geography"
 * - "What percentage of payments are missed in Real Estate?"
 */

import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

// Base URL for API calls
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
}

/**
 * Repayment Analytics Tool
 *
 * Get repayment behavior analytics with optional filters and grouping
 */
export const repaymentAnalyticsTool = new DynamicStructuredTool({
  name: 'getRepaymentAnalytics',
  description:
    'Get repayment analytics including payment rates, DPD statistics, delayed and missed payments analysis. Use this for questions like "payment rate in IT sector", "on-time payments by geography", "average DPD across sectors", "missed payments count", etc. Supports filtering by loan ID, sector, and geography.',
  schema: z.object({
    loanId: z
      .string()
      .optional()
      .describe('Analyze repayments for a specific loan ID'),
    sector: z
      .enum(['MANUFACTURING', 'RETAIL', 'IT', 'HEALTHCARE', 'REAL_ESTATE', 'AGRICULTURE'])
      .optional()
      .describe('Filter by loan sector'),
    geography: z
      .string()
      .optional()
      .describe('Filter by customer geography (Mumbai, Delhi, etc.)'),
    groupBy: z
      .enum(['sector', 'geography', 'payment_status'])
      .optional()
      .describe('Group results by sector, geography, or payment_status'),
    startDate: z
      .string()
      .optional()
      .describe('Filter repayments from this date (YYYY-MM-DD)'),
    endDate: z
      .string()
      .optional()
      .describe('Filter repayments until this date (YYYY-MM-DD)'),
  }),
  func: async ({ loanId, sector, geography, groupBy, startDate, endDate }) => {
    try {
      const baseUrl = getBaseUrl()
      const params = new URLSearchParams()

      if (loanId) params.append('loanId', loanId)
      if (sector) params.append('sector', sector)
      if (geography) params.append('geography', geography)
      if (groupBy) params.append('groupBy', groupBy)
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`${baseUrl}/api/repayments/analytics?${params}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        return `Error fetching repayment analytics: ${data.error || 'Unknown error'}`
      }

      const { overall, grouped } = data.data

      let result = `**Repayment Analytics:**\n\n`

      // Overall stats
      result += `**Overall Statistics:**\n`
      result += `• Total Repayments: ${overall.total_repayments}\n`
      result += `• Paid: ${overall.paid_count} (${overall.payment_rate.toFixed(1)}%)\n`
      result += `• Pending: ${overall.pending_count}\n`
      result += `• Missed: ${overall.missed_count} (${overall.missed_rate.toFixed(1)}%)\n`
      result += `• Delayed Payments: ${overall.delayed_count} (${overall.delayed_rate.toFixed(1)}%)\n\n`

      result += `**DPD Statistics:**\n`
      result += `• Average DPD: ${overall.avg_dpd.toFixed(2)} days\n`
      result += `• Max DPD: ${overall.max_dpd} days\n`
      result += `• Payments with DPD > 15: ${overall.high_dpd_count}\n`
      result += `• Payments with DPD > 30: ${overall.critical_dpd_count}\n\n`

      result += `**Payment Amount:**\n`
      result += `• Total EMI Amount: ₹${(overall.total_emi_amount / 100000).toFixed(2)}L\n`
      result += `• Total Paid: ₹${(overall.total_paid_amount / 100000).toFixed(2)}L\n`
      result += `• Average EMI: ₹${(overall.avg_emi_amount / 1000).toFixed(0)}K\n\n`

      // Grouped data
      if (grouped && grouped.length > 0) {
        result += `**Breakdown by ${groupBy}:**\n\n`
        grouped.forEach((group: any, index: number) => {
          result += `${index + 1}. **${group.group_value}**\n`
          result += `   • Total Repayments: ${group.repayment_count}\n`
          result += `   • Payment Rate: ${group.payment_rate.toFixed(1)}%\n`
          result += `   • Delayed Rate: ${group.delayed_rate.toFixed(1)}%\n`
          result += `   • Avg DPD: ${group.avg_dpd.toFixed(2)} days\n\n`
        })
      }

      return result
    } catch (error: any) {
      console.error('Error in repaymentAnalyticsTool:', error)
      return `Error fetching repayment analytics: ${error.message}`
    }
  },
})
