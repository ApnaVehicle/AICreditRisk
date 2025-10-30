import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { buildRepaymentWhereClause } from '@/lib/utils/filter-builder'

/**
 * GET /api/bi-dashboard/collection-funnel
 *
 * Analyzes collection workflow efficiency and conversion rates
 * across different stages of the collection process
 *
 * Funnel Stages:
 * 1. Total Due (100%) - All repayments due
 * 2. On-time Collected - Paid on or before due date
 * 3. Early Delinquency (1-15 DPD) - Collected after reminder
 * 4. Moderate Delinquency (16-30 DPD) - Collected after follow-up
 * 5. Serious Delinquency (31-60 DPD) - Collected after escalation
 * 6. Critical (61-90 DPD) - Collected after legal notice
 * 7. Written Off (90+ DPD) - Unrecovered
 *
 * Query Parameters: Supports all filters from filter store
 */

export async function GET(request: NextRequest) {
  try {
    // Extract and build WHERE clause from query parameters
    const { searchParams } = new URL(request.url)
    const where = buildRepaymentWhereClause(searchParams)

    // Fetch repayments with filters applied
    const allRepayments = await prisma.repayment.findMany({
      where,
      include: {
        loan: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: {
        due_date: 'desc',
      },
    })

    const totalRepayments = allRepayments.length
    const totalDueAmount = allRepayments.reduce((sum, r) => sum + r.emi_amount, 0)

    // ========================================
    // 1. COLLECTION FUNNEL STAGES
    // ========================================
    interface FunnelStage {
      stage: string
      description: string
      count: number
      amount: number
      percentage: number
      conversionRate: number
      color: string
    }

    // Stage 1: Total Due
    const totalDue: FunnelStage = {
      stage: 'Total Due',
      description: 'All repayments scheduled',
      count: totalRepayments,
      amount: totalDueAmount,
      percentage: 100,
      conversionRate: 100,
      color: '#6B7280',
    }

    // Stage 2: On-time Collection (DPD = 0)
    const onTimeRepayments = allRepayments.filter(
      (r) => r.payment_status === 'PAID' && r.dpd === 0
    )
    const onTimeAmount = onTimeRepayments.reduce(
      (sum, r) => sum + (r.payment_amount || 0),
      0
    )
    const onTime: FunnelStage = {
      stage: 'On-time',
      description: 'Paid on or before due date',
      count: onTimeRepayments.length,
      amount: onTimeAmount,
      percentage: totalRepayments > 0 ? (onTimeRepayments.length / totalRepayments) * 100 : 0,
      conversionRate: totalRepayments > 0 ? (onTimeRepayments.length / totalRepayments) * 100 : 0,
      color: '#10B981',
    }

    // Stage 3: Early Delinquency (1-15 DPD) - Eventually paid
    const earlyDelinqRepayments = allRepayments.filter(
      (r) => r.payment_status === 'PAID' && r.dpd > 0 && r.dpd <= 15
    )
    const earlyDelinqAmount = earlyDelinqRepayments.reduce(
      (sum, r) => sum + (r.payment_amount || 0),
      0
    )
    const earlyDelinq: FunnelStage = {
      stage: 'Early Recovery',
      description: 'Collected after 1-15 days (reminder)',
      count: earlyDelinqRepayments.length,
      amount: earlyDelinqAmount,
      percentage: totalRepayments > 0 ? (earlyDelinqRepayments.length / totalRepayments) * 100 : 0,
      conversionRate: totalRepayments > 0
        ? ((onTimeRepayments.length + earlyDelinqRepayments.length) / totalRepayments) * 100
        : 0,
      color: '#34D399',
    }

    // Stage 4: Moderate Delinquency (16-30 DPD)
    const moderateDelinqRepayments = allRepayments.filter(
      (r) => r.payment_status === 'PAID' && r.dpd > 15 && r.dpd <= 30
    )
    const moderateDelinqAmount = moderateDelinqRepayments.reduce(
      (sum, r) => sum + (r.payment_amount || 0),
      0
    )
    const moderateDelinq: FunnelStage = {
      stage: 'Moderate Recovery',
      description: 'Collected after 16-30 days (follow-up)',
      count: moderateDelinqRepayments.length,
      amount: moderateDelinqAmount,
      percentage: totalRepayments > 0 ? (moderateDelinqRepayments.length / totalRepayments) * 100 : 0,
      conversionRate: totalRepayments > 0
        ? ((onTimeRepayments.length + earlyDelinqRepayments.length + moderateDelinqRepayments.length) / totalRepayments) * 100
        : 0,
      color: '#FBBF24',
    }

    // Stage 5: Serious Delinquency (31-60 DPD)
    const seriousDelinqRepayments = allRepayments.filter(
      (r) => r.payment_status === 'PAID' && r.dpd > 30 && r.dpd <= 60
    )
    const seriousDelinqAmount = seriousDelinqRepayments.reduce(
      (sum, r) => sum + (r.payment_amount || 0),
      0
    )
    const seriousDelinq: FunnelStage = {
      stage: 'Late Recovery',
      description: 'Collected after 31-60 days (escalation)',
      count: seriousDelinqRepayments.length,
      amount: seriousDelinqAmount,
      percentage: totalRepayments > 0 ? (seriousDelinqRepayments.length / totalRepayments) * 100 : 0,
      conversionRate: totalRepayments > 0
        ? ((onTimeRepayments.length + earlyDelinqRepayments.length + moderateDelinqRepayments.length + seriousDelinqRepayments.length) / totalRepayments) * 100
        : 0,
      color: '#F97316',
    }

    // Stage 6: Critical (61-90 DPD)
    const criticalDelinqRepayments = allRepayments.filter(
      (r) => r.payment_status === 'PAID' && r.dpd > 60 && r.dpd <= 90
    )
    const criticalDelinqAmount = criticalDelinqRepayments.reduce(
      (sum, r) => sum + (r.payment_amount || 0),
      0
    )
    const criticalDelinq: FunnelStage = {
      stage: 'Critical Recovery',
      description: 'Collected after 61-90 days (legal notice)',
      count: criticalDelinqRepayments.length,
      amount: criticalDelinqAmount,
      percentage: totalRepayments > 0 ? (criticalDelinqRepayments.length / totalRepayments) * 100 : 0,
      conversionRate: totalRepayments > 0
        ? ((onTimeRepayments.length + earlyDelinqRepayments.length + moderateDelinqRepayments.length + seriousDelinqRepayments.length + criticalDelinqRepayments.length) / totalRepayments) * 100
        : 0,
      color: '#DC2626',
    }

    // Stage 7: Missed/Unrecovered
    const missedRepayments = allRepayments.filter(
      (r) => r.payment_status === 'MISSED' || r.payment_status === 'DELAYED'
    )
    const missedAmount = missedRepayments.reduce((sum, r) => sum + r.emi_amount, 0)
    const missed: FunnelStage = {
      stage: 'Unrecovered',
      description: 'Missed or pending collection',
      count: missedRepayments.length,
      amount: missedAmount,
      percentage: totalRepayments > 0 ? (missedRepayments.length / totalRepayments) * 100 : 0,
      conversionRate: 0, // No further conversion
      color: '#991B1B',
    }

    const funnelStages: FunnelStage[] = [
      totalDue,
      onTime,
      earlyDelinq,
      moderateDelinq,
      seriousDelinq,
      criticalDelinq,
      missed,
    ]

    // Round all values
    funnelStages.forEach((stage) => {
      stage.percentage = Math.round(stage.percentage * 100) / 100
      stage.conversionRate = Math.round(stage.conversionRate * 100) / 100
    })

    // ========================================
    // 2. COLLECTION EFFICIENCY METRICS
    // ========================================
    const collectedRepayments = allRepayments.filter((r) => r.payment_status === 'PAID')
    const totalCollected = collectedRepayments.reduce(
      (sum, r) => sum + (r.payment_amount || 0),
      0
    )

    const efficiencyMetrics = {
      overallCollectionRate: totalRepayments > 0
        ? (collectedRepayments.length / totalRepayments) * 100
        : 0,
      amountCollectionRate: totalDueAmount > 0
        ? (totalCollected / totalDueAmount) * 100
        : 0,
      onTimeRate: onTime.percentage,
      earlyRecoveryRate: totalRepayments > 0
        ? ((onTimeRepayments.length + earlyDelinqRepayments.length) / totalRepayments) * 100
        : 0,
      avgCollectionDelay: collectedRepayments.length > 0
        ? collectedRepayments.reduce((sum, r) => sum + r.dpd, 0) / collectedRepayments.length
        : 0,
    }

    // Round efficiency metrics
    Object.keys(efficiencyMetrics).forEach((key) => {
      efficiencyMetrics[key as keyof typeof efficiencyMetrics] =
        Math.round(efficiencyMetrics[key as keyof typeof efficiencyMetrics] * 100) / 100
    })

    // ========================================
    // 3. STAGE TRANSITIONS (ROLL RATES)
    // ========================================
    // Calculate roll rates between stages
    const currentDelinquent = allRepayments.filter((r) => r.dpd > 0 && r.payment_status !== 'PAID')

    const rollRates = {
      healthy_to_early: 0, // % of current bucket moving to next
      early_to_moderate: currentDelinquent.filter((r) => r.dpd > 0 && r.dpd <= 15).length,
      moderate_to_serious: currentDelinquent.filter((r) => r.dpd > 15 && r.dpd <= 30).length,
      serious_to_critical: currentDelinquent.filter((r) => r.dpd > 30 && r.dpd <= 60).length,
      critical_to_writeoff: currentDelinquent.filter((r) => r.dpd > 60 && r.dpd <= 90).length,
    }

    // ========================================
    // 4. TIME-BASED COLLECTION TRENDS
    // ========================================
    // Group repayments by month to show collection trend
    const monthlyCollectionMap = new Map<string, {
      month: string
      totalDue: number
      collected: number
      collectionRate: number
    }>()

    allRepayments.forEach((repayment) => {
      const dueDate = new Date(repayment.due_date)
      const monthKey = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`

      const existing = monthlyCollectionMap.get(monthKey)
      const collected = repayment.payment_status === 'PAID' ? 1 : 0

      if (existing) {
        existing.totalDue += 1
        existing.collected += collected
        existing.collectionRate = (existing.collected / existing.totalDue) * 100
      } else {
        monthlyCollectionMap.set(monthKey, {
          month: monthKey,
          totalDue: 1,
          collected: collected,
          collectionRate: collected * 100,
        })
      }
    })

    const monthlyTrends = Array.from(monthlyCollectionMap.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12) // Last 12 months
      .map((item) => ({
        ...item,
        collectionRate: Math.round(item.collectionRate * 100) / 100,
      }))

    // ========================================
    // 5. RECOVERY PERFORMANCE
    // ========================================
    const recoveryMetrics = {
      earlyRecoverySuccess: earlyDelinqRepayments.length,
      moderateRecoverySuccess: moderateDelinqRepayments.length,
      lateRecoverySuccess: seriousDelinqRepayments.length + criticalDelinqRepayments.length,
      totalRecovered: collectedRepayments.length - onTimeRepayments.length,
      recoveryRate: (onTimeRepayments.length + earlyDelinqRepayments.length + moderateDelinqRepayments.length + seriousDelinqRepayments.length + criticalDelinqRepayments.length) > 0
        ? ((earlyDelinqRepayments.length + moderateDelinqRepayments.length + seriousDelinqRepayments.length + criticalDelinqRepayments.length) /
           (earlyDelinqRepayments.length + moderateDelinqRepayments.length + seriousDelinqRepayments.length + criticalDelinqRepayments.length + missedRepayments.length)) * 100
        : 0,
    }

    recoveryMetrics.recoveryRate = Math.round(recoveryMetrics.recoveryRate * 100) / 100

    return NextResponse.json({
      success: true,
      data: {
        funnel: funnelStages,
        efficiency: efficiencyMetrics,
        rollRates,
        monthlyTrends,
        recovery: recoveryMetrics,
        context: {
          totalRepayments,
          totalDueAmount,
          totalCollected,
          outstandingAmount: totalDueAmount - totalCollected,
        },
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error generating collection funnel:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate collection funnel',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
