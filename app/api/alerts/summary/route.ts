import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/lib/agent'

// Simple in-memory cache for alert summaries (5 minute TTL)
const summaryCache = new Map<string, { summary: string; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { alerts } = body

    if (!alerts || !Array.isArray(alerts)) {
      return NextResponse.json(
        { error: 'Invalid request. Expected array of alerts.' },
        { status: 400 }
      )
    }

    // Process alerts and generate AI summaries
    const enrichedAlerts = await Promise.all(
      alerts.map(async (alert: any) => {
        // Check cache first
        const cacheKey = `${alert.id}-${alert.alert_type}`
        const cached = summaryCache.get(cacheKey)

        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
          return {
            ...alert,
            summary: cached.summary
          }
        }

        // Generate AI summary
        try {
          const summary = await generateAlertSummary(alert)

          // Cache the result
          summaryCache.set(cacheKey, {
            summary,
            timestamp: Date.now()
          })

          return {
            ...alert,
            summary
          }
        } catch (err) {
          console.error('Failed to generate AI summary for alert:', err)
          // Fallback to basic summary
          return {
            ...alert,
            summary: generateFallbackSummary(alert)
          }
        }
      })
    )

    return NextResponse.json({ alerts: enrichedAlerts })
  } catch (error) {
    console.error('Error in alert summary API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function generateAlertSummary(alert: any): Promise<string> {
  const { alert_type, loan, message } = alert

  // Build context for Argus
  let context = `Alert Type: ${alert_type}\n`

  if (loan) {
    context += `Loan ID: ${loan.loan_id}\n`
    context += `Outstanding Amount: ₹${(loan.outstanding_amount / 100000).toFixed(1)}L\n`
    context += `Loan Status: ${loan.status}\n`
  }

  context += `Alert Message: ${message}\n`

  // Call Argus agent with specific prompt
  const prompt = `You are Argus, a risk intelligence AI. Generate a concise, actionable summary for this credit risk alert in ONE sentence (max 120 characters). Be specific about the risk and urgency.

${context}

Summary:`

  const result = await runAgent(prompt, [])

  // Extract the first sentence and ensure it's concise
  const summary = result.output
    .split('\n')[0]
    .trim()
    .substring(0, 150)

  return summary || generateFallbackSummary(alert)
}

function generateFallbackSummary(alert: any): string {
  const { alert_type, loan } = alert

  const loanId = loan?.loan_id || 'Unknown'
  const amount = loan?.outstanding_amount
    ? `₹${(loan.outstanding_amount / 100000).toFixed(1)}L`
    : 'N/A'

  switch (alert_type) {
    case 'HIGH_DPD':
      return `High-risk loan ${loanId}: Severe payment delays, ${amount} outstanding - Immediate action required`
    case 'NPA_RISK':
      return `NPA imminent for loan ${loanId}: ${amount} at risk - Urgent intervention needed`
    case 'HIGH_RISK_SCORE':
      return `Critical risk detected in loan ${loanId}: ${amount} outstanding - Review immediately`
    case 'PAYMENT_MISSED':
      return `Payment missed for loan ${loanId}: ${amount} overdue - Contact customer urgently`
    case 'SECTOR_CONCENTRATION':
      return `Portfolio concentration risk: Sector exposure exceeded threshold - Diversification needed`
    default:
      return `Alert for loan ${loanId}: ${amount} requires attention - Review recommended`
  }
}

// Cleanup old cache entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of summaryCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      summaryCache.delete(key)
    }
  }
}, 10 * 60 * 1000)
