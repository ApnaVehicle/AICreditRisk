import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import {
  calculateDefaultProbability,
  LoanDataForPrediction,
  DefaultPrediction,
} from '@/lib/utils/default-probability'

export async function GET(request: NextRequest) {
  try {
    // Get all loans with full repayment history
    const loans = await prisma.loan.findMany({
      include: {
        customer: true,
        repayments: {
          orderBy: { due_date: 'asc' },
        },
        risk_assessments: {
          orderBy: { assessment_date: 'desc' },
          take: 1,
        },
      },
    })

    // Calculate predictions for each loan
    const predictions: DefaultPrediction[] = []

    for (const loan of loans) {
      // Get current DPD from latest repayment
      const latestRepayment = loan.repayments[loan.repayments.length - 1]
      const currentDPD = latestRepayment?.dpd || 0

      // Count missed payments
      const missedPayments = loan.repayments.filter(
        (r) => r.payment_status === 'MISSED'
      ).length

      // Get risk score
      const riskScore = loan.risk_assessments?.[0]?.risk_score || 50

      // Build loan data for prediction
      const loanData: LoanDataForPrediction = {
        loan_id: loan.id,
        borrower_name: loan.customer?.customer_name || 'Unknown',
        loan_amount: loan.loan_amount,
        outstanding_amount: loan.outstanding_amount,
        sector: loan.sector,
        risk_score: riskScore,
        repayments: loan.repayments.map((r) => ({
          dpd: r.dpd,
          amount_paid: r.payment_amount || 0,
          expected_amount: r.emi_amount,
          payment_date: r.payment_date ? r.payment_date.toISOString() : null,
        })),
        current_dpd: currentDPD,
        npa_status: loan.status === 'NPA',
        missed_payments: missedPayments,
        total_payments: loan.repayments.length,
      }

      // Calculate prediction
      const prediction = calculateDefaultProbability(loanData)
      predictions.push(prediction)
    }

    // Group predictions by risk level
    const highRiskPredictions = predictions.filter(
      (p) => p.default_probability >= 70
    )
    const mediumRiskPredictions = predictions.filter(
      (p) => p.default_probability >= 40 && p.default_probability < 70
    )
    const lowRiskPredictions = predictions.filter(
      (p) => p.default_probability < 40
    )

    // Calculate exposure at risk
    const highRiskExposure = highRiskPredictions.reduce(
      (sum, p) => sum + p.outstanding_amount,
      0
    )
    const mediumRiskExposure = mediumRiskPredictions.reduce(
      (sum, p) => sum + p.outstanding_amount,
      0
    )
    const lowRiskExposure = lowRiskPredictions.reduce(
      (sum, p) => sum + p.outstanding_amount,
      0
    )
    const totalExposure =
      highRiskExposure + mediumRiskExposure + lowRiskExposure

    // Get top 10 high-risk loans sorted by probability
    const top10HighRisk = predictions
      .sort((a, b) => b.default_probability - a.default_probability)
      .slice(0, 10)

    // Generate early warning signals
    const earlyWarnings = {
      consecutiveMissedPayments: predictions.filter(
        (p) =>
          p.warnings.some((w) => w.includes('consecutive')) &&
          p.default_probability >= 50
      ).length,
      dpdAcceleration: predictions.filter(
        (p) =>
          p.factors.find((f) => f.name === 'DPD Status')?.value.includes('accelerating') &&
          p.default_probability >= 40
      ).length,
      riskScoreDeterioration: predictions.filter(
        (p) => p.factors.find((f) => f.name === 'Risk Score' && f.isNegative)
      ).length,
      sectorStress: (() => {
        // Count sectors with multiple high-risk loans
        const sectorCounts = new Map<string, number>()
        highRiskPredictions.forEach((p) => {
          sectorCounts.set(p.sector, (sectorCounts.get(p.sector) || 0) + 1)
        })
        return Array.from(sectorCounts.values()).filter((count) => count >= 3)
          .length
      })(),
    }

    // Calculate portfolio-level statistics
    const avgProbability =
      predictions.length > 0
        ? predictions.reduce((sum, p) => sum + p.default_probability, 0) /
          predictions.length
        : 0

    const avgConfidence =
      predictions.length > 0
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) /
          predictions.length
        : 0

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalLoans: predictions.length,
          avgDefaultProbability: Math.round(avgProbability * 10) / 10,
          avgConfidence: Math.round(avgConfidence),
          highRiskCount: highRiskPredictions.length,
          mediumRiskCount: mediumRiskPredictions.length,
          lowRiskCount: lowRiskPredictions.length,
          highRiskExposure,
          mediumRiskExposure,
          lowRiskExposure,
          totalExposure,
          highRiskPercentage:
            totalExposure > 0
              ? Math.round((highRiskExposure / totalExposure) * 1000) / 10
              : 0,
        },
        riskDistribution: {
          high: {
            count: highRiskPredictions.length,
            exposure: highRiskExposure,
            percentage:
              predictions.length > 0
                ? Math.round(
                    (highRiskPredictions.length / predictions.length) * 1000
                  ) / 10
                : 0,
          },
          medium: {
            count: mediumRiskPredictions.length,
            exposure: mediumRiskExposure,
            percentage:
              predictions.length > 0
                ? Math.round(
                    (mediumRiskPredictions.length / predictions.length) * 1000
                  ) / 10
                : 0,
          },
          low: {
            count: lowRiskPredictions.length,
            exposure: lowRiskExposure,
            percentage:
              predictions.length > 0
                ? Math.round(
                    (lowRiskPredictions.length / predictions.length) * 1000
                  ) / 10
                : 0,
          },
        },
        top10HighRisk,
        earlyWarnings,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error generating predictions:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate predictions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
