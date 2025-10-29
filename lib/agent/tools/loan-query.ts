/**
 * General Loan Query Tool
 *
 * Provides flexible loan querying with multiple filters:
 * - Geography (city/location)
 * - Sector (industry)
 * - Status (active, closed, NPA, restructured)
 * - Risk Category (low, medium, high)
 * - Amount range (min/max loan amount)
 *
 * This tool enables answering questions like:
 * - "Show me all loans in Mumbai"
 * - "Find loans in IT sector with amount > 10L"
 * - "List all NPA loans in Real Estate"
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
 * Query Loans Tool
 *
 * Flexible loan query with multiple filter options
 */
export const queryLoansTool = new DynamicStructuredTool({
  name: 'queryLoans',
  description:
    'Query loans with flexible filters. Use this for general loan queries like "show loans in Mumbai", "find loans in IT sector", "list active loans above 10L", etc. Supports filtering by geography, sector, status, risk category, and amount range.',
  schema: z.object({
    geography: z
      .string()
      .optional()
      .describe(
        'Filter by city/location: Mumbai, Delhi, Bangalore, Pune, Hyderabad, Chennai, Kolkata, etc.'
      ),
    sector: z
      .enum(['MANUFACTURING', 'RETAIL', 'IT', 'HEALTHCARE', 'REAL_ESTATE', 'AGRICULTURE'])
      .optional()
      .describe('Filter by industry sector'),
    status: z
      .enum(['ACTIVE', 'CLOSED', 'NPA', 'RESTRUCTURED'])
      .optional()
      .describe('Filter by loan status'),
    riskCategory: z
      .enum(['LOW', 'MEDIUM', 'HIGH'])
      .optional()
      .describe('Filter by risk category: LOW (0-35), MEDIUM (36-65), HIGH (66-100)'),
    minAmount: z
      .number()
      .optional()
      .describe('Minimum loan amount in rupees (e.g., 1000000 for 10L)'),
    maxAmount: z
      .number()
      .optional()
      .describe('Maximum loan amount in rupees (e.g., 5000000 for 50L)'),
    minOutstanding: z
      .number()
      .optional()
      .describe('Minimum outstanding amount in rupees'),
    maxOutstanding: z
      .number()
      .optional()
      .describe('Maximum outstanding amount in rupees'),
    limit: z
      .number()
      .default(50)
      .describe('Maximum number of loans to return (default: 50, max: 200)'),
  }),
  func: async ({
    geography,
    sector,
    status,
    riskCategory,
    minAmount,
    maxAmount,
    minOutstanding,
    maxOutstanding,
    limit,
  }) => {
    try {
      const baseUrl = getBaseUrl()
      const params = new URLSearchParams()

      // Add all filters to query params
      if (geography) params.append('geography', geography)
      if (sector) params.append('sector', sector)
      if (status) params.append('status', status)
      if (riskCategory) params.append('riskCategory', riskCategory)
      if (minAmount) params.append('minAmount', minAmount.toString())
      if (maxAmount) params.append('maxAmount', maxAmount.toString())
      if (minOutstanding) params.append('minOutstanding', minOutstanding.toString())
      if (maxOutstanding) params.append('maxOutstanding', maxOutstanding.toString())
      params.append('limit', Math.min(limit || 50, 200).toString())

      const response = await fetch(`${baseUrl}/api/loans?${params}`)

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      if (!data.success) {
        return `Error querying loans: ${data.error || 'Unknown error'}`
      }

      const loans = data.data || []

      if (loans.length === 0) {
        return 'No loans found matching the specified criteria.'
      }

      // Format response
      return `Found ${loans.length} loan(s):\n\n${loans
        .map(
          (loan: any) =>
            `• Loan ID: ${loan.id}
  Customer: ${loan.customer?.customer_name || 'N/A'}
  Amount: ₹${(loan.loan_amount / 100000).toFixed(2)}L
  Outstanding: ₹${(loan.outstanding_amount / 100000).toFixed(2)}L
  Sector: ${loan.sector}
  Status: ${loan.status}
  Geography: ${loan.customer?.geography || 'N/A'}
  Risk Score: ${loan.risk_assessments?.[0]?.risk_score || 'N/A'}/100 (${loan.risk_assessments?.[0]?.risk_category || 'N/A'})`
        )
        .join('\n\n')}`
    } catch (error: any) {
      console.error('Error in queryLoansTool:', error)
      return `Error querying loans: ${error.message}`
    }
  },
})
