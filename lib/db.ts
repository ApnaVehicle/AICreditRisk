/**
 * Prisma Client Singleton
 *
 * This file ensures we have a single instance of PrismaClient
 * across hot-reloads in development, preventing connection leaks.
 *
 * Usage:
 * import { prisma } from '@/lib/db'
 * const customers = await prisma.customer.findMany()
 */

import { PrismaClient } from '@prisma/client'

// Extend NodeJS global type to include prisma
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

// PrismaClient is attached to the `global` object in development
// to prevent exhausting database connection limit during hot reloads
export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

// In development, store PrismaClient on global object
// so it survives hot-reloading in Next.js
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}

/**
 * Gracefully disconnect from database
 * Call this when shutting down the application
 */
export async function disconnect() {
  await prisma.$disconnect()
}

// Export types for convenience
export type {
  Customer,
  Loan,
  Repayment,
  RiskAssessment,
  EmploymentStatus,
  Sector,
  LoanType,
  LoanStatus,
  PaymentStatus,
  RiskCategory,
} from '@prisma/client'
