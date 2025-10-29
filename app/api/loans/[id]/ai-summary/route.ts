/**
 * GET /api/loans/[id]/ai-summary
 *
 * Generates AI-powered insights and recommendations for a specific loan
 * Uses OpenAI GPT-4-Turbo to analyze loan data and provide:
 * - Executive summary
 * - Risk narrative
 * - Prioritized action items
 * - Recommended next steps
 */

import { NextRequest, NextResponse } from 'next/server'
import { ChatOpenAI } from '@langchain/openai'
import { HumanMessage, SystemMessage } from '@langchain/core/messages'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4-turbo'

// Cache AI summaries for 5 minutes to reduce API calls
const summaryCache = new Map<string, { summary: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

const LOAN_ANALYSIS_PROMPT = `You are an expert credit risk analyst. Analyze the provided loan data and generate actionable insights.

Your response MUST be a valid JSON object with this exact structure:
{
  "executive_summary": "2-3 sentence overview of the loan's current status and key concerns",
  "risk_narrative": "Detailed narrative explaining the risk factors and borrower situation",
  "action_items": [
    {
      "title": "Action item title",
      "description": "Detailed description of what needs to be done",
      "priority": "HIGH" | "MEDIUM" | "LOW"
    }
  ],
  "next_steps": "Recommended immediate next steps for the credit team"
}

Guidelines:
- Be specific and actionable
- Prioritize actions based on urgency and impact
- Include 3-5 action items
- Focus on credit risk management perspective
- Use Indian financial terminology (₹, Lakhs, DPD, NPA)
- Identify patterns in payment behavior
- Consider sector-specific risks
- Provide clear next steps

Return ONLY the JSON object, no markdown formatting.`

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: loanId } = await params

    // Check cache first
    const cached = summaryCache.get(loanId)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cached.summary,
        cached: true,
      })
    }

    // Fetch loan details from existing endpoint
    const baseUrl = request.nextUrl.origin
    const loanResponse = await fetch(`${baseUrl}/api/loans/${loanId}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!loanResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch loan details',
        },
        { status: 404 }
      )
    }

    const loanData = await loanResponse.json()
    const { loan, customer, payment_statistics, risk_assessment, repayments } = loanData.data

    // Check if OpenAI is configured
    if (!OPENAI_API_KEY) {
      // Return fallback summary if OpenAI not configured
      return NextResponse.json({
        success: true,
        data: generateFallbackSummary(loan, customer, payment_statistics, risk_assessment),
        ai_generated: false,
      })
    }

    // Format loan data for AI analysis
    const loanContext = formatLoanContext(loan, customer, payment_statistics, risk_assessment, repayments)

    // Initialize OpenAI
    const llm = new ChatOpenAI({
      model: OPENAI_MODEL,
      apiKey: OPENAI_API_KEY,
      temperature: 0.4, // Slightly higher for more nuanced analysis
      maxTokens: 1500,
    })

    // Generate AI summary
    const response = await llm.invoke([
      new SystemMessage(LOAN_ANALYSIS_PROMPT),
      new HumanMessage(loanContext),
    ])

    // Parse AI response
    let aiSummary
    try {
      const content = response.content as string
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      aiSummary = JSON.parse(cleanContent)
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Return fallback if parsing fails
      return NextResponse.json({
        success: true,
        data: generateFallbackSummary(loan, customer, payment_statistics, risk_assessment),
        ai_generated: false,
        parse_error: true,
      })
    }

    // Validate structure
    if (!aiSummary.executive_summary || !aiSummary.action_items || !Array.isArray(aiSummary.action_items)) {
      return NextResponse.json({
        success: true,
        data: generateFallbackSummary(loan, customer, payment_statistics, risk_assessment),
        ai_generated: false,
        validation_error: true,
      })
    }

    // Cache the result
    summaryCache.set(loanId, {
      summary: aiSummary,
      timestamp: Date.now(),
    })

    return NextResponse.json({
      success: true,
      data: aiSummary,
      ai_generated: true,
    })
  } catch (error: any) {
    console.error('Error generating AI summary:', error)

    // Return error with appropriate status
    if (error.message?.includes('401') || error.message?.includes('API key')) {
      return NextResponse.json(
        {
          success: false,
          error: 'OpenAI API authentication failed',
          ai_generated: false,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate AI summary',
        ai_generated: false,
      },
      { status: 500 }
    )
  }
}

/**
 * Format loan data into context for AI analysis
 */
function formatLoanContext(
  loan: any,
  customer: any,
  paymentStats: any,
  riskAssessment: any,
  repayments: any[]
): string {
  const outstandingLakhs = (loan.outstanding_amount / 100000).toFixed(2)
  const loanAmountLakhs = (loan.loan_amount / 100000).toFixed(2)
  const monthlyIncomeLakhs = (customer.monthly_income / 100000).toFixed(2)

  // Get latest repayment for DPD
  const latestRepayment = repayments.find(r => r.payment_status !== 'PAID')
  const currentDPD = latestRepayment?.dpd || 0

  // Format risk flags
  const riskFlags = riskAssessment?.flags
    ? Object.entries(riskAssessment.flags)
        .filter(([_, value]) => value === true)
        .map(([key, _]) => key.replace(/_/g, ' '))
        .join(', ')
    : 'None'

  return `Loan Analysis Request:

CUSTOMER PROFILE:
- Name: ${customer.customer_name}
- Age: ${customer.age} years
- Monthly Income: ₹${monthlyIncomeLakhs}L
- Credit Score: ${customer.credit_score}/850
- Employment: ${customer.employment_status}
- DTI Ratio: ${(customer.dti_ratio * 100).toFixed(1)}%
- Geography: ${customer.geography}

LOAN DETAILS:
- Loan ID: ${loan.id.substring(0, 8)}
- Loan Amount: ₹${loanAmountLakhs}L
- Outstanding: ₹${outstandingLakhs}L
- Interest Rate: ${loan.interest_rate}% p.a.
- Tenure: ${loan.loan_tenure_months} months
- Sector: ${loan.sector}
- Type: ${loan.loan_type}
- Status: ${loan.status}
- Current DPD: ${currentDPD} days

PAYMENT PERFORMANCE:
- Total Payments: ${paymentStats.total_payments}
- Paid: ${paymentStats.paid_payments} (${paymentStats.payment_rate}%)
- Delayed: ${paymentStats.delayed_payments}
- Missed: ${paymentStats.missed_payments}
- Average DPD: ${paymentStats.avg_dpd} days

RISK ASSESSMENT:
- Risk Score: ${riskAssessment?.risk_score || 'N/A'}/100
- Risk Category: ${riskAssessment?.risk_category || 'N/A'}
- Risk Flags: ${riskFlags}
${riskAssessment?.notes ? `- Notes: ${riskAssessment.notes}` : ''}

Please analyze this loan and provide actionable insights in JSON format.`
}

/**
 * Generate fallback summary if AI is unavailable
 */
function generateFallbackSummary(
  loan: any,
  customer: any,
  paymentStats: any,
  riskAssessment: any
): any {
  const riskScore = riskAssessment?.risk_score || 0
  const riskCategory = riskAssessment?.risk_category || 'MEDIUM'
  const paymentRate = paymentStats.payment_rate || 0
  const missedCount = paymentStats.missed_payments || 0

  // Determine severity
  const isHighRisk = riskScore >= 70
  const isCriticalPayment = missedCount > 2 || paymentRate < 60

  // Generate executive summary
  let executiveSummary = `${customer.customer_name}'s ${loan.loan_type} of ₹${(loan.outstanding_amount / 100000).toFixed(2)}L is categorized as ${riskCategory} risk`

  if (isCriticalPayment) {
    executiveSummary += ` with concerning payment behavior (${missedCount} missed payments, ${paymentRate}% payment rate)`
  } else if (isHighRisk) {
    executiveSummary += ` with a risk score of ${riskScore}/100`
  } else {
    executiveSummary += ` with ${paymentRate}% payment rate and ${riskScore}/100 risk score`
  }

  executiveSummary += `. Immediate attention required for ${loan.sector} sector exposure.`

  // Generate action items based on risk factors
  const actionItems = []

  if (missedCount > 0) {
    actionItems.push({
      title: 'Contact Borrower Immediately',
      description: `${missedCount} missed payment${missedCount > 1 ? 's' : ''} detected. Establish contact to understand payment difficulties and negotiate repayment plan.`,
      priority: missedCount > 2 ? 'HIGH' : 'MEDIUM',
    })
  }

  if (isHighRisk) {
    actionItems.push({
      title: 'Enhanced Monitoring Required',
      description: `Risk score of ${riskScore}/100 indicates elevated default probability. Implement weekly monitoring and regular borrower check-ins.`,
      priority: 'HIGH',
    })
  }

  if (paymentRate < 80) {
    actionItems.push({
      title: 'Review Repayment Capacity',
      description: `Payment rate of ${paymentRate}% suggests cash flow issues. Conduct detailed income verification and assess restructuring options.`,
      priority: paymentRate < 60 ? 'HIGH' : 'MEDIUM',
    })
  }

  if (customer.dti_ratio > 0.5) {
    actionItems.push({
      title: 'Assess Debt Burden',
      description: `DTI ratio of ${(customer.dti_ratio * 100).toFixed(1)}% indicates high debt burden. Review total obligations and evaluate credit limit reduction.`,
      priority: 'MEDIUM',
    })
  }

  if (loan.status === 'RESTRUCTURED') {
    actionItems.push({
      title: 'Monitor Restructured Performance',
      description: 'This is a restructured loan requiring strict adherence monitoring. Track payment patterns closely for early warning signs.',
      priority: 'HIGH',
    })
  }

  // Ensure at least 3 action items
  if (actionItems.length < 3) {
    actionItems.push({
      title: 'Update Risk Assessment',
      description: 'Schedule comprehensive risk review to capture latest financial position and update credit file with current information.',
      priority: 'LOW',
    })
  }

  // Determine next steps
  let nextSteps = ''
  if (isCriticalPayment) {
    nextSteps = 'Initiate immediate borrower contact and schedule field visit within 48 hours. Prepare restructuring proposal if required.'
  } else if (isHighRisk) {
    nextSteps = 'Schedule credit review meeting, update collateral valuation, and establish enhanced monitoring protocol.'
  } else {
    nextSteps = 'Continue regular monitoring, maintain periodic borrower contact, and review at next quarterly assessment.'
  }

  return {
    executive_summary: executiveSummary,
    risk_narrative: `This ${loan.loan_type} account exhibits ${riskCategory.toLowerCase()} risk characteristics based on quantitative risk scoring (${riskScore}/100) and payment behavior analysis. The borrower ${customer.customer_name}, employed in ${customer.employment_status} capacity with monthly income of ₹${(customer.monthly_income / 100000).toFixed(2)}L, has demonstrated ${paymentRate >= 80 ? 'satisfactory' : 'concerning'} repayment discipline. With ${paymentStats.total_payments} total payments, ${paymentStats.paid_payments} have been completed on time while ${paymentStats.delayed_payments} were delayed and ${missedCount} missed entirely. The loan is in ${loan.status} status within ${loan.sector} sector, requiring ${isHighRisk || isCriticalPayment ? 'enhanced' : 'standard'} monitoring protocols.`,
    action_items: actionItems.slice(0, 5), // Limit to 5 items
    next_steps: nextSteps,
  }
}
