/**
 * Smart Actions Generator
 * Analyzes portfolio metrics and generates priority action recommendations
 */

export interface PortfolioMetrics {
  // Loan data
  totalLoans: number
  npaLoans: number
  totalExposure: number
  npaExposure: number

  // Risk metrics
  highRiskCount: number
  avgRiskScore: number

  // Delinquency metrics
  par30Count: number
  par60Count: number
  par90Count: number
  par90Exposure: number

  // Collection metrics
  collectionEfficiency: number
  overdueAmount: number

  // Sector concentration
  sectorConcentration?: {
    sector: string
    count: number
    exposure: number
    percentage: number
  }[]

  // Recent changes
  weeklyChanges?: {
    npaIncrease: number
    riskScoreChange: number
    dpdIncrease: number
  }
}

export type ActionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface SmartAction {
  id: string
  title: string
  description: string
  priority: ActionPriority
  category:
    | 'delinquency'
    | 'risk'
    | 'collection'
    | 'npa'
    | 'concentration'
    | 'monitoring'
  impact: string // Expected impact/benefit
  actionLink?: string // Optional navigation link
  metrics?: {
    count?: number
    exposure?: number
    percentage?: number
  }
}

/**
 * Generate priority actions based on portfolio analysis
 */
export function generateSmartActions(
  metrics: PortfolioMetrics
): SmartAction[] {
  const actions: SmartAction[] = []

  // 1. Check for critical DPD situations (90+ days)
  if (metrics.par90Count > 0) {
    const avgExposure = metrics.par90Exposure / metrics.par90Count
    actions.push({
      id: 'dpd-90-contact',
      title: `Urgent: Contact ${metrics.par90Count} borrower${metrics.par90Count > 1 ? 's' : ''} at 90+ DPD`,
      description: `${metrics.par90Count} loan${metrics.par90Count > 1 ? 's are' : ' is'} critically overdue (90+ days). Immediate intervention required to prevent NPA escalation. Consider restructuring or recovery proceedings.`,
      priority: 'CRITICAL',
      category: 'delinquency',
      impact: `Protect ₹${(metrics.par90Exposure / 10000000).toFixed(2)}Cr from becoming NPA`,
      actionLink: '/loans?filter=dpd90plus',
      metrics: {
        count: metrics.par90Count,
        exposure: metrics.par90Exposure,
      },
    })
  }

  // 2. Check for high-risk loan concentration
  const highRiskPct =
    metrics.totalLoans > 0 ? (metrics.highRiskCount / metrics.totalLoans) * 100 : 0
  if (highRiskPct > 25) {
    actions.push({
      id: 'high-risk-review',
      title: `Review ${metrics.highRiskCount} high-risk loans (${highRiskPct.toFixed(1)}% of portfolio)`,
      description: `Portfolio has elevated risk concentration. Review credit policies, increase monitoring frequency, and consider risk mitigation strategies for these accounts.`,
      priority: 'HIGH',
      category: 'risk',
      impact: 'Reduce portfolio volatility and potential future losses',
      actionLink: '/loans?filter=highRisk',
      metrics: {
        count: metrics.highRiskCount,
        percentage: highRiskPct,
      },
    })
  }

  // 3. Check collection efficiency
  if (metrics.collectionEfficiency < 80) {
    const improvementNeeded = 90 - metrics.collectionEfficiency
    actions.push({
      id: 'collection-efficiency',
      title: `Improve collection efficiency (currently ${metrics.collectionEfficiency.toFixed(1)}%)`,
      description: `Collection efficiency is below industry benchmark of 90%. Review collection processes, borrower communication strategies, and consider automated payment reminders.`,
      priority: metrics.collectionEfficiency < 70 ? 'CRITICAL' : 'HIGH',
      category: 'collection',
      impact: `Target ${improvementNeeded.toFixed(1)}% improvement to reach 90% efficiency`,
      metrics: {
        percentage: metrics.collectionEfficiency,
      },
    })
  }

  // 4. Check PAR 30-60 early warning signals
  if (metrics.par60Count > 0 && metrics.par60Count < metrics.par90Count * 2) {
    // If PAR60 is close to PAR90, it means loans are progressing to worse buckets
    actions.push({
      id: 'par60-intervention',
      title: `Early intervention needed for ${metrics.par60Count} loans at 60+ DPD`,
      description: `These loans are at high risk of becoming 90+ DPD. Proactive outreach and restructuring options may prevent escalation. Contact borrowers immediately to discuss repayment plans.`,
      priority: 'HIGH',
      category: 'delinquency',
      impact: 'Prevent further delinquency progression and reduce potential NPAs',
      actionLink: '/loans?filter=dpd60plus',
      metrics: {
        count: metrics.par60Count,
      },
    })
  }

  // 5. Check sector concentration risk
  if (metrics.sectorConcentration && metrics.sectorConcentration.length > 0) {
    const topSector = metrics.sectorConcentration[0]
    if (topSector.percentage > 30) {
      actions.push({
        id: 'sector-concentration',
        title: `${topSector.sector} concentration at ${topSector.percentage.toFixed(1)}% - Diversify portfolio`,
        description: `Portfolio is heavily concentrated in ${topSector.sector} sector with ${topSector.count} loans (₹${(topSector.exposure / 10000000).toFixed(2)}Cr). Consider diversification to reduce sector-specific risks.`,
        priority: topSector.percentage > 40 ? 'HIGH' : 'MEDIUM',
        category: 'concentration',
        impact: 'Reduce sector-specific risk and improve portfolio resilience',
        metrics: {
          count: topSector.count,
          exposure: topSector.exposure,
          percentage: topSector.percentage,
        },
      })
    }
  }

  // 6. Check NPA rate and trends
  const npaRate =
    metrics.totalExposure > 0 ? (metrics.npaExposure / metrics.totalExposure) * 100 : 0
  if (npaRate > 5) {
    actions.push({
      id: 'npa-recovery',
      title: `NPA rate at ${npaRate.toFixed(1)}% - Accelerate recovery efforts`,
      description: `${metrics.npaLoans} loans classified as NPA with total exposure of ₹${(metrics.npaExposure / 10000000).toFixed(2)}Cr. Prioritize recovery actions, legal proceedings, or write-off decisions.`,
      priority: npaRate > 10 ? 'CRITICAL' : 'HIGH',
      category: 'npa',
      impact: 'Improve asset quality and reduce provisioning requirements',
      actionLink: '/loans?filter=npa',
      metrics: {
        count: metrics.npaLoans,
        exposure: metrics.npaExposure,
        percentage: npaRate,
      },
    })
  }

  // 7. Check for risk score deterioration (weekly changes)
  if (
    metrics.weeklyChanges &&
    metrics.weeklyChanges.riskScoreChange > 5
  ) {
    actions.push({
      id: 'risk-deterioration',
      title: `Portfolio risk increased ${metrics.weeklyChanges.riskScoreChange.toFixed(1)}% this week`,
      description: `Significant risk score deterioration detected. Investigate underlying causes - payment delays, sector stress, or borrower-specific issues. Enhanced monitoring recommended.`,
      priority: 'HIGH',
      category: 'monitoring',
      impact: 'Identify and address risk factors before they escalate',
    })
  }

  // 8. Preventive action for early stage delinquency (PAR 30)
  const earlyDelinquencyCount = metrics.par30Count - metrics.par60Count
  if (earlyDelinquencyCount > 0 && metrics.totalLoans > 0) {
    const earlyPct = (earlyDelinquencyCount / metrics.totalLoans) * 100
    if (earlyPct > 15) {
      actions.push({
        id: 'early-delinquency',
        title: `${earlyDelinquencyCount} loans in early delinquency (30-60 DPD)`,
        description: `Send automated payment reminders and conduct courtesy calls. Early intervention at this stage typically has highest success rate (70-80% recovery).`,
        priority: 'MEDIUM',
        category: 'delinquency',
        impact: 'Prevent progression to severe delinquency stages',
        actionLink: '/loans?filter=dpd30to60',
        metrics: {
          count: earlyDelinquencyCount,
          percentage: earlyPct,
        },
      })
    }
  }

  // 9. Portfolio monitoring if overall health is good
  if (
    actions.length === 0 ||
    (npaRate < 3 && metrics.collectionEfficiency > 85 && highRiskPct < 20)
  ) {
    actions.push({
      id: 'routine-monitoring',
      title: 'Portfolio health is stable - Continue routine monitoring',
      description: `No critical issues detected. Maintain current collection practices, monitor risk indicators, and prepare for upcoming repayment cycles.`,
      priority: 'LOW',
      category: 'monitoring',
      impact: 'Sustain strong portfolio performance',
    })
  }

  // Sort actions by priority (CRITICAL > HIGH > MEDIUM > LOW)
  const priorityOrder: Record<ActionPriority, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  }

  return actions
    .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
    .slice(0, 5) // Return top 5 actions
}

/**
 * Get priority badge color
 */
export function getPriorityColor(priority: ActionPriority): string {
  switch (priority) {
    case 'CRITICAL':
      return '#EF4444' // Red
    case 'HIGH':
      return '#F59E0B' // Amber
    case 'MEDIUM':
      return '#3B82F6' // Blue
    case 'LOW':
      return '#10B981' // Green
  }
}

/**
 * Get priority emoji
 */
export function getPriorityEmoji(priority: ActionPriority): string {
  switch (priority) {
    case 'CRITICAL':
      return '🔴'
    case 'HIGH':
      return '🟡'
    case 'MEDIUM':
      return '🔵'
    case 'LOW':
      return '🟢'
  }
}

/**
 * Get category icon name (for Lucide icons)
 */
export function getCategoryIcon(
  category: SmartAction['category']
): string {
  switch (category) {
    case 'delinquency':
      return 'AlertTriangle'
    case 'risk':
      return 'Shield'
    case 'collection':
      return 'DollarSign'
    case 'npa':
      return 'XCircle'
    case 'concentration':
      return 'PieChart'
    case 'monitoring':
      return 'Eye'
  }
}
