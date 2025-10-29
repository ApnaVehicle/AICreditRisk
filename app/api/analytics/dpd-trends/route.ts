/**
 * GET /api/analytics/dpd-trends
 *
 * Returns DPD (Days Past Due) and PAR trends over time
 *
 * Query Parameters:
 * - sector: string (optional) - Filter by specific sector
 * - months: number (default: 6) - Number of months to analyze
 * - granularity: 'daily' | 'monthly' (default: 'monthly')
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Sector } from '@prisma/client'
import { format, subMonths, subDays, startOfMonth, startOfDay } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sectorFilter = searchParams.get('sector') as Sector | null
    const months = parseInt(searchParams.get('months') || '6')

    // Calculate date range
    const now = new Date()
    const startDate = subMonths(now, months)

    // Fetch repayments within the date range
    const repayments = await prisma.repayment.findMany({
      where: {
        due_date: {
          gte: startDate,
        },
      },
      include: {
        loan: {
          include: {
            customer: true,
          },
        },
      },
      orderBy: {
        due_date: 'asc',
      },
    })

    // Filter by sector if specified
    const filteredRepayments = sectorFilter
      ? repayments.filter(r => r.loan.sector === sectorFilter)
      : repayments

    // Group repayments by month and sector
    const trendsBySector = new Map<Sector, Map<string, { sum: number; count: number }>>()

    for (const repayment of filteredRepayments) {
      const sector = repayment.loan.sector
      const monthKey = format(startOfMonth(new Date(repayment.due_date)), 'yyyy-MM')

      if (!trendsBySector.has(sector)) {
        trendsBySector.set(sector, new Map())
      }

      const sectorData = trendsBySector.get(sector)!

      if (!sectorData.has(monthKey)) {
        sectorData.set(monthKey, { sum: 0, count: 0 })
      }

      const monthData = sectorData.get(monthKey)!
      monthData.sum += repayment.dpd
      monthData.count += 1
    }

    // Calculate averages and format response
    const formattedTrends: Record<string, Array<{ month: string; avg_dpd: number; loan_count: number }>> = {}

    for (const [sector, monthData] of trendsBySector.entries()) {
      formattedTrends[sector] = []

      for (const [month, data] of monthData.entries()) {
        formattedTrends[sector].push({
          month,
          avg_dpd: Math.round((data.sum / data.count) * 10) / 10,
          loan_count: data.count,
        })
      }

      // Sort by month
      formattedTrends[sector].sort((a, b) => a.month.localeCompare(b.month))
    }

    // Calculate overall trend (all sectors combined)
    const overallTrend = new Map<string, { sum: number; count: number }>()

    for (const repayment of filteredRepayments) {
      const monthKey = format(startOfMonth(new Date(repayment.due_date)), 'yyyy-MM')

      if (!overallTrend.has(monthKey)) {
        overallTrend.set(monthKey, { sum: 0, count: 0 })
      }

      const monthData = overallTrend.get(monthKey)!
      monthData.sum += repayment.dpd
      monthData.count += 1
    }

    const overallData = Array.from(overallTrend.entries())
      .map(([month, data]) => ({
        month,
        avg_dpd: Math.round((data.sum / data.count) * 10) / 10,
        loan_count: data.count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // Calculate trend direction (improving/worsening)
    let trendDirection: 'improving' | 'stable' | 'worsening' = 'stable'

    if (overallData.length >= 2) {
      const firstHalf = overallData.slice(0, Math.floor(overallData.length / 2))
      const secondHalf = overallData.slice(Math.floor(overallData.length / 2))

      const firstAvg = firstHalf.reduce((sum, d) => sum + d.avg_dpd, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, d) => sum + d.avg_dpd, 0) / secondHalf.length

      if (secondAvg < firstAvg * 0.85) {
        trendDirection = 'improving'
      } else if (secondAvg > firstAvg * 1.15) {
        trendDirection = 'worsening'
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        by_sector: formattedTrends,
        overall: overallData,
      },
      summary: {
        months_analyzed: months,
        sector_filter: sectorFilter || 'all',
        trend_direction: trendDirection,
        latest_avg_dpd: overallData.length > 0 ? overallData[overallData.length - 1].avg_dpd : 0,
      },
    })
  } catch (error) {
    console.error('Error fetching DPD trends:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch DPD trends',
      },
      { status: 500 }
    )
  }
}
