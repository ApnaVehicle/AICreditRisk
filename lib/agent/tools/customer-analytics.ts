/**
 * Customer Analytics Tool
 *
 * Provides customer-level analytics and aggregations:
 * - Average credit scores by sector/geography
 * - DTI ratio distributions
 * - Employment status breakdown
 * - Age demographics
 * - Customer risk profiles
 *
 * This tool enables answering questions like:
 * - "What's the average credit score of customers in IT sector?"
 * - "Show me DTI ratio distribution across sectors"
 * - "How many self-employed customers do we have?"
 * - "What's the average age of customers in Mumbai?"
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
 * Customer Analytics Tool
 *
 * Get customer-level analytics with optional grouping
 */
export const customerAnalyticsTool = new DynamicStructuredTool({
  name: 'getCustomerAnalytics',
  description:
    'Get customer-level analytics including average credit scores, DTI ratios, employment distribution, and age demographics. Use this for questions like "average credit score in IT sector", "DTI ratio by geography", "self-employed customers count", etc. Supports filtering by sector and geography, and grouping by various dimensions.',
  schema: z.object({
    sector: z
      .enum(['MANUFACTURING', 'RETAIL', 'IT', 'HEALTHCARE', 'REAL_ESTATE', 'AGRICULTURE'])
      .optional()
      .describe('Filter customers by their loan sector'),
    geography: z
      .string()
      .optional()
      .describe('Filter customers by city/location (Mumbai, Delhi, etc.)'),
    groupBy: z
      .enum(['sector', 'geography', 'employment_status', 'age_group'])
      .optional()
      .describe(
        'Group results by dimension: sector, geography, employment_status, or age_group'
      ),
    minCreditScore: z
      .number()
      .optional()
      .describe('Filter customers with credit score >= this value'),
    maxCreditScore: z
      .number()
      .optional()
      .describe('Filter customers with credit score <= this value'),
  }),
  func: async ({ sector, geography, groupBy, minCreditScore, maxCreditScore }) => {
    try {
      const baseUrl = getBaseUrl()
      const params = new URLSearchParams()

      if (sector) params.append('sector', sector)
      if (geography) params.append('geography', geography)
      if (groupBy) params.append('groupBy', groupBy)
      if (minCreditScore) params.append('minCreditScore', minCreditScore.toString())
      if (maxCreditScore) params.append('maxCreditScore', maxCreditScore.toString())

      const response = await fetch(`${baseUrl}/api/customers/analytics?${params}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        return `Error fetching customer analytics: ${data.error || 'Unknown error'}`
      }

      const { overall, grouped } = data.data

      let result = `**Customer Analytics:**\n\n`

      // Overall stats
      result += `**Overall Statistics:**\n`
      result += `• Total Customers: ${overall.total_customers}\n`
      result += `• Average Credit Score: ${overall.avg_credit_score.toFixed(1)}\n`
      result += `• Average DTI Ratio: ${overall.avg_dti_ratio.toFixed(2)}%\n`
      result += `• Average Age: ${overall.avg_age.toFixed(1)} years\n`
      result += `• Average Monthly Income: ₹${(overall.avg_monthly_income / 1000).toFixed(0)}K\n\n`

      // Employment distribution
      if (overall.employment_distribution) {
        result += `**Employment Distribution:**\n`
        Object.entries(overall.employment_distribution).forEach(([status, count]) => {
          result += `• ${status}: ${count} customers\n`
        })
        result += `\n`
      }

      // Grouped data
      if (grouped && grouped.length > 0) {
        result += `**Breakdown by ${groupBy}:**\n\n`
        grouped.forEach((group: any, index: number) => {
          result += `${index + 1}. **${group.group_value}**\n`
          result += `   • Customers: ${group.customer_count}\n`
          result += `   • Avg Credit Score: ${group.avg_credit_score.toFixed(1)}\n`
          result += `   • Avg DTI Ratio: ${group.avg_dti_ratio.toFixed(2)}%\n`
          result += `   • Avg Age: ${group.avg_age.toFixed(1)} years\n\n`
        })
      }

      return result
    } catch (error: any) {
      console.error('Error in customerAnalyticsTool:', error)
      return `Error fetching customer analytics: ${error.message}`
    }
  },
})
