/**
 * GET /api/alerts - Fetch active risk alerts
 * POST /api/alerts - Create new alert
 *
 * Query Parameters (GET):
 * - status: 'active' | 'resolved' (default: 'active')
 * - priority: 'high' | 'medium' | 'low' (optional)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { v4 as uuidv4 } from 'uuid'

// In-memory alert storage (in production, use a database table)
// For this demo, we'll generate alerts on-the-fly from high-risk loans
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const statusFilter = searchParams.get('status') || 'active'
    const priorityFilter = searchParams.get('priority')

    // Fetch high-risk loans and their latest assessments
    const highRiskLoans = await prisma.loan.findMany({
      where: {
        status: {
          in: ['ACTIVE', 'RESTRUCTURED'],
        },
      },
      include: {
        customer: {
          select: {
            customer_name: true,
          },
        },
        risk_assessments: {
          orderBy: {
            assessment_date: 'desc',
          },
          take: 1,
        },
        repayments: {
          orderBy: {
            due_date: 'desc',
          },
          take: 1,
        },
      },
    })

    // Generate alerts from high-risk conditions
    const alerts = []

    for (const loan of highRiskLoans) {
      const assessment = loan.risk_assessments[0]
      const latestRepayment = loan.repayments[0]

      if (!assessment) continue

      const flags = JSON.parse(assessment.flags || '{}')

      // High DPD alert
      if (latestRepayment && latestRepayment.dpd > 30) {
        alerts.push({
          alert_id: uuidv4(),
          loan_id: loan.id,
          customer_name: loan.customer.customer_name,
          alert_type: 'HIGH_DPD',
          priority: latestRepayment.dpd > 60 ? 'high' : 'medium',
          message: `Loan has ${latestRepayment.dpd} days past due`,
          created_at: new Date().toISOString(),
          status: 'active',
          risk_score: assessment.risk_score,
        })
      }

      // High risk score alert
      if (assessment.risk_score > 75) {
        alerts.push({
          alert_id: uuidv4(),
          loan_id: loan.id,
          customer_name: loan.customer.customer_name,
          alert_type: 'HIGH_RISK_SCORE',
          priority: 'high',
          message: `Critical risk score: ${assessment.risk_score}/100`,
          created_at: new Date().toISOString(),
          status: 'active',
          risk_score: assessment.risk_score,
        })
      }

      // NPA risk alert
      if (loan.status === 'RESTRUCTURED' || assessment.risk_category === 'HIGH') {
        if (latestRepayment && latestRepayment.dpd > 60) {
          alerts.push({
            alert_id: uuidv4(),
            loan_id: loan.id,
            customer_name: loan.customer.customer_name,
            alert_type: 'NPA_RISK',
            priority: 'high',
            message: 'Loan at risk of becoming NPA',
            created_at: new Date().toISOString(),
            status: 'active',
            risk_score: assessment.risk_score,
          })
        }
      }

      // Missed payment alert
      if (latestRepayment && latestRepayment.payment_status === 'MISSED') {
        alerts.push({
          alert_id: uuidv4(),
          loan_id: loan.id,
          customer_name: loan.customer.customer_name,
          alert_type: 'PAYMENT_MISSED',
          priority: 'high',
          message: 'Recent payment missed',
          created_at: new Date().toISOString(),
          status: 'active',
          risk_score: assessment.risk_score,
        })
      }

      // Sector concentration alert
      if (flags.sector_concentration) {
        alerts.push({
          alert_id: uuidv4(),
          loan_id: loan.id,
          customer_name: loan.customer.customer_name,
          alert_type: 'SECTOR_CONCENTRATION',
          priority: 'medium',
          message: `Sector concentration risk: ${loan.sector}`,
          created_at: new Date().toISOString(),
          status: 'active',
          risk_score: assessment.risk_score,
        })
      }
    }

    // Remove duplicates (keep only highest priority alert per loan)
    const uniqueAlerts = new Map<string, any>()

    for (const alert of alerts) {
      const existing = uniqueAlerts.get(alert.loan_id)

      if (!existing || priorityScore(alert.priority) > priorityScore(existing.priority)) {
        uniqueAlerts.set(alert.loan_id, alert)
      }
    }

    let filteredAlerts = Array.from(uniqueAlerts.values())

    // Apply filters
    if (priorityFilter) {
      filteredAlerts = filteredAlerts.filter(a => a.priority === priorityFilter)
    }

    // Sort by priority and risk score
    filteredAlerts.sort((a, b) => {
      if (a.priority !== b.priority) {
        return priorityScore(b.priority) - priorityScore(a.priority)
      }
      return b.risk_score - a.risk_score
    })

    // Limit to top 50
    filteredAlerts = filteredAlerts.slice(0, 50)

    return NextResponse.json({
      success: true,
      data: filteredAlerts,
      count: filteredAlerts.length,
      filters: {
        status: statusFilter,
        priority: priorityFilter || 'all',
      },
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch alerts',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { loan_id, alert_type, priority, message } = body

    // Validate required fields
    if (!loan_id || !alert_type || !priority || !message) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: loan_id, alert_type, priority, message',
        },
        { status: 400 }
      )
    }

    // Verify loan exists
    const loan = await prisma.loan.findUnique({
      where: { id: loan_id },
      include: {
        customer: {
          select: {
            customer_name: true,
          },
        },
      },
    })

    if (!loan) {
      return NextResponse.json(
        {
          success: false,
          error: 'Loan not found',
        },
        { status: 404 }
      )
    }

    // Create alert (in production, store in database)
    const alert = {
      alert_id: uuidv4(),
      loan_id,
      customer_name: loan.customer.customer_name,
      alert_type,
      priority,
      message,
      created_at: new Date().toISOString(),
      status: 'active',
    }

    return NextResponse.json({
      success: true,
      data: alert,
      message: 'Alert created successfully',
    })
  } catch (error) {
    console.error('Error creating alert:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create alert',
      },
      { status: 500 }
    )
  }
}

// Helper function to score priority
function priorityScore(priority: string): number {
  switch (priority) {
    case 'high':
      return 3
    case 'medium':
      return 2
    case 'low':
      return 1
    default:
      return 0
  }
}
