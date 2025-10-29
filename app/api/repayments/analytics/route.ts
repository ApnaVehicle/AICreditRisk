/**
 * GET /api/repayments/analytics
 *
 * Repayment analytics endpoint
 *
 * Query Parameters:
 * - loanId: string (specific loan ID)
 * - sector: enum (MANUFACTURING, RETAIL, IT, HEALTHCARE, REAL_ESTATE, AGRICULTURE)
 * - geography: string (Mumbai, Delhi, etc.)
 * - groupBy: enum (sector, geography, payment_status)
 * - startDate: string (YYYY-MM-DD)
 * - endDate: string (YYYY-MM-DD)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const loanId = searchParams.get('loanId')
    const sector = searchParams.get('sector')
    const geography = searchParams.get('geography')
    const groupBy = searchParams.get('groupBy')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}

    if (loanId) {
      where.loan_id = loanId
    }

    // Filter by date range
    if (startDate || endDate) {
      where.due_date = {}
      if (startDate) where.due_date.gte = new Date(startDate)
      if (endDate) where.due_date.lte = new Date(endDate)
    }

    // Filter by loan's sector or geography (requires join)
    if (sector || geography) {
      where.loan = {}
      if (sector) where.loan.sector = sector
      if (geography) {
        where.loan.customer = {
          geography: {
            contains: geography,
          },
        }
      }
    }

    // Fetch repayments
    const repayments = await prisma.repayment.findMany({
      where,
      include: {
        loan: {
          include: {
            customer: {
              select: {
                geography: true,
              },
            },
          },
        },
      },
    })

    // Calculate overall statistics
    const totalRepayments = repayments.length

    if (totalRepayments === 0) {
      return NextResponse.json({
        success: true,
        data: {
          overall: {
            total_repayments: 0,
            paid_count: 0,
            pending_count: 0,
            missed_count: 0,
            delayed_count: 0,
            payment_rate: 0,
            missed_rate: 0,
            delayed_rate: 0,
            avg_dpd: 0,
            max_dpd: 0,
            high_dpd_count: 0,
            critical_dpd_count: 0,
            total_emi_amount: 0,
            total_paid_amount: 0,
            avg_emi_amount: 0,
          },
          grouped: [],
        },
      })
    }

    const paidCount = repayments.filter(r => r.payment_status === 'PAID').length
    const pendingCount = repayments.filter(r => r.payment_status === 'PENDING').length
    const missedCount = repayments.filter(r => r.payment_status === 'MISSED').length
    const delayedCount = repayments.filter(r => r.dpd > 0).length

    const paymentRate = (paidCount / totalRepayments) * 100
    const missedRate = (missedCount / totalRepayments) * 100
    const delayedRate = (delayedCount / totalRepayments) * 100

    const avgDpd = repayments.reduce((sum, r) => sum + r.dpd, 0) / totalRepayments
    const maxDpd = Math.max(...repayments.map(r => r.dpd))
    const highDpdCount = repayments.filter(r => r.dpd > 15).length
    const criticalDpdCount = repayments.filter(r => r.dpd > 30).length

    const totalEmiAmount = repayments.reduce((sum, r) => sum + Number(r.emi_amount), 0)
    const totalPaidAmount = repayments.reduce(
      (sum, r) => sum + Number(r.payment_amount || 0),
      0
    )
    const avgEmiAmount = totalEmiAmount / totalRepayments

    const overall = {
      total_repayments: totalRepayments,
      paid_count: paidCount,
      pending_count: pendingCount,
      missed_count: missedCount,
      delayed_count: delayedCount,
      payment_rate: paymentRate,
      missed_rate: missedRate,
      delayed_rate: delayedRate,
      avg_dpd: avgDpd,
      max_dpd: maxDpd,
      high_dpd_count: highDpdCount,
      critical_dpd_count: criticalDpdCount,
      total_emi_amount: totalEmiAmount,
      total_paid_amount: totalPaidAmount,
      avg_emi_amount: avgEmiAmount,
    }

    // Grouped analytics
    let grouped: any[] = []

    if (groupBy) {
      const groups: Map<string, any[]> = new Map()

      repayments.forEach(repayment => {
        let groupKey: string

        switch (groupBy) {
          case 'sector':
            groupKey = repayment.loan.sector
            break
          case 'geography':
            groupKey = repayment.loan.customer.geography
            break
          case 'payment_status':
            groupKey = repayment.payment_status
            break
          default:
            groupKey = 'Unknown'
        }

        if (!groups.has(groupKey)) {
          groups.set(groupKey, [])
        }
        groups.get(groupKey)!.push(repayment)
      })

      // Calculate stats for each group
      grouped = Array.from(groups.entries()).map(([groupValue, groupRepayments]) => {
        const count = groupRepayments.length
        const paidInGroup = groupRepayments.filter(r => r.payment_status === 'PAID').length
        const delayedInGroup = groupRepayments.filter(r => r.dpd > 0).length

        return {
          group_value: groupValue,
          repayment_count: count,
          payment_rate: (paidInGroup / count) * 100,
          delayed_rate: (delayedInGroup / count) * 100,
          avg_dpd: groupRepayments.reduce((sum, r) => sum + r.dpd, 0) / count,
          total_emi: groupRepayments.reduce((sum, r) => sum + Number(r.emi_amount), 0),
        }
      })

      // Sort by repayment count descending
      grouped.sort((a, b) => b.repayment_count - a.repayment_count)
    }

    return NextResponse.json({
      success: true,
      data: {
        overall,
        grouped,
      },
      filters: {
        loanId,
        sector,
        geography,
        groupBy,
        startDate,
        endDate,
      },
    })
  } catch (error: any) {
    console.error('Error fetching repayment analytics:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch repayment analytics',
        details: error.message,
      },
      { status: 500 }
    )
  }
}
