import { Prisma } from '@prisma/client'

/**
 * Builds a Prisma WHERE clause from URL search parameters
 * Handles all filter dimensions from the filter store
 */
export function buildLoanWhereClause(searchParams: URLSearchParams): Prisma.LoanWhereInput {
  const where: Prisma.LoanWhereInput = {}

  // Date range filter (disbursement_date)
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  if (startDate || endDate) {
    where.disbursement_date = {}
    if (startDate) where.disbursement_date.gte = new Date(startDate)
    if (endDate) where.disbursement_date.lte = new Date(endDate)
  }

  // Sectors filter (can be multiple)
  const sectors = searchParams.getAll('sector')
  if (sectors.length > 0) {
    where.sector = { in: sectors as any }
  }

  // Geographies filter (can be multiple, through customer relation)
  const geographies = searchParams.getAll('geography')
  if (geographies.length > 0) {
    where.customer = {
      geography: { in: geographies },
    }
  }

  // Risk categories filter (can be multiple, through risk_assessments relation)
  const riskCategories = searchParams.getAll('riskCategory')
  if (riskCategories.length > 0) {
    where.risk_assessments = {
      some: {
        risk_category: { in: riskCategories as any },
      },
    }
  }

  // Loan statuses filter (can be multiple)
  const statuses = searchParams.getAll('status')
  if (statuses.length > 0) {
    where.status = { in: statuses as any }
  }

  // Amount range filter
  const minAmount = searchParams.get('minAmount')
  const maxAmount = searchParams.get('maxAmount')
  if (minAmount || maxAmount) {
    where.loan_amount = {}
    if (minAmount) where.loan_amount.gte = Number(minAmount)
    if (maxAmount) where.loan_amount.lte = Number(maxAmount)
  }

  // Search query (customer name or loan ID)
  const search = searchParams.get('search')
  if (search) {
    where.OR = [
      { id: { contains: search } },
      { customer: { customer_name: { contains: search } } },
    ]
  }

  return where
}

/**
 * Builds a Prisma WHERE clause for repayments based on loan filters
 * Used for collection funnel endpoint
 */
export function buildRepaymentWhereClause(searchParams: URLSearchParams): Prisma.RepaymentWhereInput {
  const where: Prisma.RepaymentWhereInput = {}

  // If there are loan-level filters, apply them through the loan relation
  const loanWhere = buildLoanWhereClause(searchParams)

  if (Object.keys(loanWhere).length > 0) {
    where.loan = loanWhere
  }

  return where
}
