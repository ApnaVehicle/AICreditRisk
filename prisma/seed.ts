/**
 * Credit Risk Monitoring AI - Database Seed Script
 *
 * Generates realistic data for:
 * - 500 unique customers
 * - 1000 loans across these customers
 * - Repayment history for each loan
 * - Risk assessments for each loan
 *
 * All data follows realistic distributions for an NBFC portfolio
 */

import { PrismaClient, EmploymentStatus, Sector, LoanType, LoanStatus, PaymentStatus, RiskCategory } from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

const prisma = new PrismaClient()

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const NUM_CUSTOMERS = 500
const NUM_LOANS = 1000

// Geography distribution (total should be 100%)
const GEOGRAPHY_DISTRIBUTION = {
  'Mumbai': 0.25,      // 25%
  'Delhi': 0.20,       // 20%
  'Bangalore': 0.18,   // 18%
  'Pune': 0.12,        // 12%
  'Hyderabad': 0.10,   // 10%
  'Chennai': 0.08,     // 8%
  'Kolkata': 0.07,     // 7%
}

// Sector distribution (total should be 100%)
const SECTOR_DISTRIBUTION = {
  'MANUFACTURING': 0.30,  // 30%
  'RETAIL': 0.25,         // 25%
  'IT': 0.15,             // 15%
  'HEALTHCARE': 0.12,     // 12%
  'REAL_ESTATE': 0.10,    // 10%
  'AGRICULTURE': 0.08,    // 8%
}

// Loan status distribution
const LOAN_STATUS_DISTRIBUTION = {
  'ACTIVE': 0.70,        // 70%
  'CLOSED': 0.20,        // 20%
  'RESTRUCTURED': 0.08,  // 8% (at risk)
  'NPA': 0.02,           // 2%
}

// Repayment behavior patterns
const REPAYMENT_PATTERNS = {
  'ON_TIME': 0.60,           // 60% - DPD = 0
  'OCCASIONAL_DELAYS': 0.25, // 25% - DPD 1-15
  'CONSISTENT_DELAYS': 0.10, // 10% - DPD 16-30
  'SERIOUS_DELINQUENCY': 0.05, // 5% - DPD 31-90+
}

// Risk category distribution
const RISK_CATEGORY_DISTRIBUTION = {
  'LOW': 0.50,     // 50%
  'MEDIUM': 0.35,  // 35%
  'HIGH': 0.15,    // 15%
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate random number with normal distribution (bell curve)
 * Uses Box-Muller transform
 */
function normalRandom(mean: number, stdDev: number): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return z0 * stdDev + mean
}

/**
 * Select item based on probability distribution
 */
function selectByDistribution<T>(distribution: Record<string, number>): T {
  const rand = Math.random()
  let cumulative = 0

  for (const [key, probability] of Object.entries(distribution)) {
    cumulative += probability
    if (rand <= cumulative) {
      return key as T
    }
  }

  // Fallback to first item if rounding errors occur
  return Object.keys(distribution)[0] as T
}

/**
 * Random integer between min and max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Random float between min and max
 */
function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min
}

/**
 * Generate random date within range
 */
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

/**
 * Generate Indian name (simple version)
 */
function generateCustomerName(): string {
  const firstNames = [
    'Rahul', 'Priya', 'Amit', 'Sneha', 'Rajesh', 'Anjali', 'Vikram', 'Pooja',
    'Sanjay', 'Neha', 'Arjun', 'Kavita', 'Anil', 'Deepika', 'Suresh', 'Meera',
    'Karan', 'Ritu', 'Mohit', 'Simran', 'Rohan', 'Preeti', 'Nitin', 'Swati',
    'Vikas', 'Manisha', 'Abhishek', 'Riya', 'Ajay', 'Nisha', 'Sachin', 'Divya',
  ]

  const lastNames = [
    'Sharma', 'Kumar', 'Singh', 'Patel', 'Gupta', 'Verma', 'Reddy', 'Shah',
    'Joshi', 'Mehta', 'Nair', 'Rao', 'Iyer', 'Das', 'Malhotra', 'Agarwal',
    'Chopra', 'Bose', 'Krishnan', 'Desai', 'Pandey', 'Kulkarni', 'Menon', 'Banerjee',
  ]

  const firstName = firstNames[randomInt(0, firstNames.length - 1)]
  const lastName = lastNames[randomInt(0, lastNames.length - 1)]

  return `${firstName} ${lastName}`
}

/**
 * Add months to date
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

// ============================================================================
// DATA GENERATION FUNCTIONS
// ============================================================================

/**
 * Generate realistic customer data
 */
function generateCustomer(): {
  id: string
  customer_name: string
  age: number
  monthly_income: number
  credit_score: number
  employment_status: EmploymentStatus
  dti_ratio: number
  geography: string
  registration_date: Date
} {
  // Age: Bell curve around 35-45
  const age = Math.round(Math.max(25, Math.min(65, normalRandom(40, 8))))

  // Credit score: Normal distribution (mean 650, std dev 100)
  const credit_score = Math.round(Math.max(300, Math.min(850, normalRandom(650, 100))))

  // Income: Realistic distribution (more people in lower income brackets)
  // Using log-normal distribution
  const incomeBase = Math.exp(normalRandom(11, 0.8)) // approx ₹25k-5L range
  const monthly_income = Math.round(Math.max(25000, Math.min(500000, incomeBase)))

  // Employment status based on income level
  let employment_status: EmploymentStatus
  if (monthly_income > 200000) {
    employment_status = 'BUSINESS'
  } else if (monthly_income > 75000) {
    const rand = Math.random()
    employment_status = rand < 0.6 ? 'SALARIED' : 'SELF_EMPLOYED'
  } else {
    const rand = Math.random()
    employment_status = rand < 0.7 ? 'SALARIED' : 'SELF_EMPLOYED'
  }

  // DTI ratio: Varies based on income and risk profile
  // Higher income generally has better DTI management
  const dtiBase = credit_score < 600 ? 55 : credit_score < 700 ? 40 : 30
  const dti_ratio = Math.max(0, Math.min(100, normalRandom(dtiBase, 15)))

  // Geography: Based on distribution
  const geography = selectByDistribution<string>(GEOGRAPHY_DISTRIBUTION)

  // Registration date: Random in last 3 years
  const threeYearsAgo = new Date()
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3)
  const registration_date = randomDate(threeYearsAgo, new Date())

  return {
    id: uuidv4(),
    customer_name: generateCustomerName(),
    age,
    monthly_income,
    credit_score,
    employment_status,
    dti_ratio: Math.round(dti_ratio * 10) / 10,
    geography,
    registration_date,
  }
}

/**
 * Generate realistic loan data
 */
function generateLoan(customerId: string, customerCreditScore: number): {
  id: string
  customer_id: string
  loan_amount: number
  interest_rate: number
  loan_tenure_months: number
  sector: Sector
  loan_type: LoanType
  disbursement_date: Date
  next_due_date: Date | null
  outstanding_amount: number
  status: LoanStatus
} {
  // Loan amount distribution: 40% small, 45% medium, 15% large
  const sizeRand = Math.random()
  let loan_amount: number

  if (sizeRand < 0.40) {
    // Small loans: ₹50k - ₹2L
    loan_amount = Math.round(randomFloat(50000, 200000) / 10000) * 10000
  } else if (sizeRand < 0.85) {
    // Medium loans: ₹2L - ₹10L
    loan_amount = Math.round(randomFloat(200000, 1000000) / 10000) * 10000
  } else {
    // Large loans: ₹10L - ₹50L
    loan_amount = Math.round(randomFloat(1000000, 5000000) / 50000) * 50000
  }

  // Interest rate: Based on credit score and loan amount
  let interest_rate: number
  if (customerCreditScore >= 750) {
    interest_rate = randomFloat(8, 10)
  } else if (customerCreditScore >= 650) {
    interest_rate = randomFloat(10, 14)
  } else {
    interest_rate = randomFloat(14, 18)
  }
  interest_rate = Math.round(interest_rate * 100) / 100

  // Loan tenure: Usually 12-60 months
  const tenureOptions = [12, 24, 36, 48, 60]
  const loan_tenure_months = tenureOptions[randomInt(0, tenureOptions.length - 1)]

  // Sector: Based on distribution
  const sector = selectByDistribution<Sector>(SECTOR_DISTRIBUTION)

  // Loan type: Based on amount and sector
  let loan_type: LoanType
  if (sector === 'IT' || sector === 'HEALTHCARE') {
    loan_type = loan_amount > 500000 ? 'BUSINESS_LOAN' : 'PERSONAL_LOAN'
  } else if (sector === 'REAL_ESTATE') {
    loan_type = 'HOME_LOAN'
  } else {
    const rand = Math.random()
    loan_type = rand < 0.6 ? 'BUSINESS_LOAN' : rand < 0.85 ? 'PERSONAL_LOAN' : 'HOME_LOAN'
  }

  // Status: Based on distribution
  const status = selectByDistribution<LoanStatus>(LOAN_STATUS_DISTRIBUTION)

  // Disbursement date: Random in last 2 years
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  const disbursement_date = randomDate(twoYearsAgo, new Date())

  // Outstanding amount: Depends on status and time elapsed
  let outstanding_amount: number
  const monthsElapsed = Math.floor((new Date().getTime() - disbursement_date.getTime()) / (1000 * 60 * 60 * 24 * 30))

  if (status === 'CLOSED') {
    outstanding_amount = 0
  } else {
    const expectedPaydown = (loan_amount / loan_tenure_months) * Math.min(monthsElapsed, loan_tenure_months)
    outstanding_amount = Math.max(0, loan_amount - expectedPaydown + randomFloat(-50000, 50000))
    outstanding_amount = Math.round(outstanding_amount / 1000) * 1000
  }

  // Next due date: null if closed, otherwise calculate
  let next_due_date: Date | null = null
  if (status !== 'CLOSED' && monthsElapsed < loan_tenure_months) {
    next_due_date = addMonths(disbursement_date, monthsElapsed + 1)
  }

  return {
    id: uuidv4(),
    customer_id: customerId,
    loan_amount,
    interest_rate,
    loan_tenure_months,
    sector,
    loan_type,
    disbursement_date,
    next_due_date,
    outstanding_amount,
    status,
  }
}

/**
 * Generate repayment history for a loan
 */
function generateRepayments(loan: ReturnType<typeof generateLoan>): Array<{
  id: string
  loan_id: string
  emi_amount: number
  due_date: Date
  payment_date: Date | null
  payment_status: PaymentStatus
  dpd: number
  payment_amount: number | null
}> {
  const repayments = []

  // Calculate EMI using standard formula
  const P = loan.loan_amount
  const r = loan.interest_rate / 100 / 12 // monthly rate
  const n = loan.loan_tenure_months
  const emi_amount = Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1))

  // Determine repayment behavior pattern
  const behaviorPattern = selectByDistribution<string>(REPAYMENT_PATTERNS)

  // Generate repayments for each month
  const monthsElapsed = Math.floor((new Date().getTime() - loan.disbursement_date.getTime()) / (1000 * 60 * 60 * 24 * 30))
  const monthsToGenerate = Math.min(monthsElapsed, loan.loan_tenure_months)

  for (let i = 1; i <= monthsToGenerate; i++) {
    const due_date = addMonths(loan.disbursement_date, i)
    const isFuturePayment = due_date > new Date()

    let payment_status: PaymentStatus
    let payment_date: Date | null
    let dpd: number
    let payment_amount: number | null

    if (isFuturePayment) {
      // Future payments
      payment_status = 'PENDING'
      payment_date = null
      dpd = 0
      payment_amount = null
    } else {
      // Past payments - determine based on behavior pattern
      if (loan.status === 'CLOSED') {
        // Closed loans have all payments made
        payment_status = 'PAID'
        dpd = 0
        payment_date = new Date(due_date.getTime() + randomInt(0, 5) * 24 * 60 * 60 * 1000)
        payment_amount = emi_amount
      } else if (loan.status === 'NPA') {
        // NPA loans have many missed payments
        const missRand = Math.random()
        if (missRand < 0.7) {
          payment_status = 'MISSED'
          payment_date = null
          dpd = Math.min(90, randomInt(30, 90))
          payment_amount = null
        } else {
          payment_status = 'DELAYED'
          dpd = randomInt(31, 60)
          payment_date = new Date(due_date.getTime() + dpd * 24 * 60 * 60 * 1000)
          payment_amount = Math.round(emi_amount * randomFloat(0.5, 0.9))
        }
      } else {
        // Active/Restructured loans - based on behavior pattern
        if (behaviorPattern === 'ON_TIME') {
          payment_status = 'PAID'
          dpd = randomInt(0, 3)
          payment_date = new Date(due_date.getTime() + dpd * 24 * 60 * 60 * 1000)
          payment_amount = emi_amount
        } else if (behaviorPattern === 'OCCASIONAL_DELAYS') {
          const delayRand = Math.random()
          if (delayRand < 0.7) {
            payment_status = 'PAID'
            dpd = randomInt(0, 5)
            payment_date = new Date(due_date.getTime() + dpd * 24 * 60 * 60 * 1000)
            payment_amount = emi_amount
          } else {
            payment_status = 'DELAYED'
            dpd = randomInt(5, 15)
            payment_date = new Date(due_date.getTime() + dpd * 24 * 60 * 60 * 1000)
            payment_amount = emi_amount
          }
        } else if (behaviorPattern === 'CONSISTENT_DELAYS') {
          payment_status = 'DELAYED'
          dpd = randomInt(16, 30)
          payment_date = new Date(due_date.getTime() + dpd * 24 * 60 * 60 * 1000)
          payment_amount = Math.round(emi_amount * randomFloat(0.8, 1.0))
        } else {
          // SERIOUS_DELINQUENCY
          const missRand = Math.random()
          if (missRand < 0.5) {
            payment_status = 'MISSED'
            payment_date = null
            dpd = Math.min(90, randomInt(31, 90))
            payment_amount = null
          } else {
            payment_status = 'DELAYED'
            dpd = randomInt(31, 60)
            payment_date = new Date(due_date.getTime() + dpd * 24 * 60 * 60 * 1000)
            payment_amount = Math.round(emi_amount * randomFloat(0.5, 0.8))
          }
        }
      }
    }

    repayments.push({
      id: uuidv4(),
      loan_id: loan.id,
      emi_amount,
      due_date,
      payment_date,
      payment_status,
      dpd,
      payment_amount,
    })
  }

  return repayments
}

/**
 * Generate risk assessment for a loan
 */
function generateRiskAssessment(
  loan: ReturnType<typeof generateLoan>,
  repayments: ReturnType<typeof generateRepayments>,
  customerData: { credit_score: number, dti_ratio: number }
): {
  id: string
  loan_id: string
  risk_score: number
  risk_category: RiskCategory
  assessment_date: Date
  flags: string
  notes: string | null
} {
  // Calculate risk score based on multiple factors
  let risk_score = 0
  const flags: Record<string, boolean> = {}

  // Factor 1: Delinquency (40% weight)
  const recentRepayments = repayments.slice(-6) // Last 6 payments
  const avgDPD = recentRepayments.reduce((sum, r) => sum + r.dpd, 0) / Math.max(recentRepayments.length, 1)
  const maxDPD = Math.max(...recentRepayments.map(r => r.dpd), 0)

  if (maxDPD > 15) {
    flags.high_dpd = true
  }

  let delinquencyScore = 0
  if (avgDPD < 5) delinquencyScore = 10
  else if (avgDPD < 15) delinquencyScore = 25
  else if (avgDPD < 30) delinquencyScore = 50
  else if (avgDPD < 60) delinquencyScore = 75
  else delinquencyScore = 95

  risk_score += delinquencyScore * 0.4

  // Factor 2: Customer credit profile (30% weight)
  const creditScore = customerData.credit_score
  let creditRiskScore = 0
  if (creditScore >= 750) creditRiskScore = 10
  else if (creditScore >= 700) creditRiskScore = 25
  else if (creditScore >= 650) creditRiskScore = 40
  else if (creditScore >= 600) creditRiskScore = 60
  else creditRiskScore = 85

  risk_score += creditRiskScore * 0.3

  // Factor 3: DTI ratio
  if (customerData.dti_ratio > 50) {
    flags.high_dti = true
    risk_score += 10
  }

  // Factor 4: Loan characteristics (20% weight)
  const outstandingRatio = loan.outstanding_amount / loan.loan_amount
  let loanCharScore = outstandingRatio * 30 // Higher outstanding = higher risk

  // Sector risk
  if (loan.sector === 'AGRICULTURE' || loan.sector === 'REAL_ESTATE') {
    loanCharScore += 10
  }

  risk_score += loanCharScore * 0.2

  // Factor 5: Loan status
  if (loan.status === 'NPA') {
    risk_score = Math.max(risk_score, 85)
  } else if (loan.status === 'RESTRUCTURED') {
    risk_score = Math.max(risk_score, 70)
  }

  // Cap risk score between 0-100
  risk_score = Math.max(0, Math.min(100, risk_score))

  // Determine risk category
  let risk_category: RiskCategory
  if (risk_score <= 35) {
    risk_category = 'LOW'
  } else if (risk_score <= 65) {
    risk_category = 'MEDIUM'
  } else {
    risk_category = 'HIGH'
  }

  // Additional flags
  // Note: sector_concentration and geography_risk would be calculated at portfolio level
  // For this seed, we'll add them randomly to some high-risk loans
  if (risk_category === 'HIGH' && Math.random() < 0.3) {
    flags.sector_concentration = true
  }

  if (risk_category === 'HIGH' && Math.random() < 0.2) {
    flags.geography_risk = true
  }

  // Generate notes for high-risk loans
  let notes: string | null = null
  if (risk_category === 'HIGH') {
    const reasons = []
    if (maxDPD > 30) reasons.push(`High DPD: ${maxDPD} days`)
    if (customerData.credit_score < 600) reasons.push('Low credit score')
    if (customerData.dti_ratio > 60) reasons.push('High DTI ratio')
    if (loan.status === 'NPA') reasons.push('NPA status')
    notes = reasons.join('; ')
  }

  return {
    id: uuidv4(),
    loan_id: loan.id,
    risk_score: Math.round(risk_score * 10) / 10,
    risk_category,
    assessment_date: new Date(),
    flags: JSON.stringify(flags),
    notes,
  }
}

// ============================================================================
// MAIN SEED FUNCTION
// ============================================================================

async function main() {
  console.log('🌱 Starting database seed...\n')

  // Clear existing data
  console.log('🗑️  Clearing existing data...')
  await prisma.riskAssessment.deleteMany({})
  await prisma.repayment.deleteMany({})
  await prisma.loan.deleteMany({})
  await prisma.customer.deleteMany({})
  console.log('✅ Cleared existing data\n')

  // Generate customers
  console.log(`👥 Generating ${NUM_CUSTOMERS} customers...`)
  const customers = []
  for (let i = 0; i < NUM_CUSTOMERS; i++) {
    const customer = generateCustomer()
    customers.push(customer)

    if ((i + 1) % 100 === 0) {
      console.log(`   Generated ${i + 1}/${NUM_CUSTOMERS} customers`)
    }
  }

  await prisma.customer.createMany({ data: customers })
  console.log(`✅ Created ${NUM_CUSTOMERS} customers\n`)

  // Generate loans
  console.log(`💰 Generating ${NUM_LOANS} loans...`)
  const loans = []
  const allRepayments = []
  const allRiskAssessments = []

  for (let i = 0; i < NUM_LOANS; i++) {
    // Assign loan to random customer (some customers may have multiple loans)
    const customer = customers[randomInt(0, customers.length - 1)]

    const loan = generateLoan(customer.id, customer.credit_score)
    loans.push(loan)

    // Generate repayments for this loan
    const repayments = generateRepayments(loan)
    allRepayments.push(...repayments)

    // Generate risk assessment
    const riskAssessment = generateRiskAssessment(loan, repayments, {
      credit_score: customer.credit_score,
      dti_ratio: customer.dti_ratio,
    })
    allRiskAssessments.push(riskAssessment)

    if ((i + 1) % 100 === 0) {
      console.log(`   Generated ${i + 1}/${NUM_LOANS} loans with repayments and risk assessments`)
    }
  }

  await prisma.loan.createMany({ data: loans })
  console.log(`✅ Created ${NUM_LOANS} loans\n`)

  // Insert repayments
  console.log(`📊 Inserting ${allRepayments.length} repayment records...`)
  await prisma.repayment.createMany({ data: allRepayments })
  console.log(`✅ Created ${allRepayments.length} repayment records\n`)

  // Insert risk assessments
  console.log(`⚠️  Inserting ${allRiskAssessments.length} risk assessments...`)
  await prisma.riskAssessment.createMany({ data: allRiskAssessments })
  console.log(`✅ Created ${allRiskAssessments.length} risk assessments\n`)

  // Print summary statistics
  console.log('📈 Database Summary Statistics:')
  console.log('================================')

  const totalCustomers = await prisma.customer.count()
  const totalLoans = await prisma.loan.count()
  const activeLoans = await prisma.loan.count({ where: { status: 'ACTIVE' } })
  const npaLoans = await prisma.loan.count({ where: { status: 'NPA' } })
  const highRiskLoans = await prisma.riskAssessment.count({ where: { risk_category: 'HIGH' } })

  console.log(`Total Customers: ${totalCustomers}`)
  console.log(`Total Loans: ${totalLoans}`)
  console.log(`Active Loans: ${activeLoans} (${((activeLoans / totalLoans) * 100).toFixed(1)}%)`)
  console.log(`NPA Loans: ${npaLoans} (${((npaLoans / totalLoans) * 100).toFixed(1)}%)`)
  console.log(`High Risk Loans: ${highRiskLoans} (${((highRiskLoans / totalLoans) * 100).toFixed(1)}%)`)
  console.log('')

  console.log('🎉 Database seeded successfully!')
}

// Execute seed
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
