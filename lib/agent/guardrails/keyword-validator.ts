/**
 * Keyword-Based Question Relevance Validator
 *
 * Fast pre-validation layer to block obviously irrelevant questions
 * before sending to LLM. Uses keyword matching for efficiency.
 */

export interface ValidationResult {
  isRelevant: boolean
  confidence: 'high' | 'medium' | 'low'
  reason?: string
  matchedKeywords?: string[]
}

// Keywords that indicate off-topic questions (blocklist)
const BLOCKLIST_KEYWORDS = [
  // Weather & Environment
  'weather', 'temperature', 'climate', 'forecast', 'rain', 'snow', 'sunny',

  // Entertainment
  'joke', 'funny', 'laugh', 'comedy', 'poem', 'story', 'tale',
  'movie', 'film', 'actor', 'actress', 'celebrity', 'song', 'music',
  'singer', 'band', 'concert', 'tv show', 'series', 'netflix',

  // Sports & Games
  'world cup', 'football', 'soccer', 'cricket', 'basketball', 'tennis',
  'match', 'game', 'player', 'score', 'championship', 'olympic',
  'sport', 'team', 'tournament',

  // Food & Cooking
  'recipe', 'cooking', 'cook', 'bake', 'pasta', 'pizza', 'food',
  'restaurant', 'dish', 'ingredient', 'meal',

  // Travel
  'vacation', 'holiday', 'travel', 'trip', 'tourist', 'destination',
  'hotel', 'flight', 'airport', 'visa', 'passport',

  // Technology (non-finance)
  'programming', 'code', 'python', 'javascript', 'java', 'react',
  'software', 'app', 'website', 'game', 'gaming', 'computer',
  'android', 'ios', 'windows', 'linux',

  // General Knowledge
  'history', 'science', 'physics', 'chemistry', 'biology',
  'geography', 'mathematics', 'capital', 'country', 'president',

  // Personal Advice (non-finance)
  'health', 'doctor', 'medicine', 'disease', 'symptom',
  'relationship', 'dating', 'marriage', 'family',
  'career advice', 'job interview',

  // Current Events
  'news', 'politics', 'election', 'government', 'war',

  // Miscellaneous
  'astrology', 'horoscope', 'zodiac', 'magic', 'fortune',
]

// Keywords that indicate credit risk / loan portfolio questions (allowlist)
const DOMAIN_KEYWORDS = [
  // Core Loan Terms
  'loan', 'loans', 'lending', 'lender', 'borrower', 'disburse', 'disbursement',

  // Risk Terms
  'risk', 'risky', 'high-risk', 'low-risk', 'risk score', 'risk assessment',
  'delinquent', 'delinquency', 'dpd', 'days past due', 'overdue',
  'npa', 'non-performing', 'default', 'defaulted',

  // Customer Terms
  'customer', 'customers', 'borrower', 'borrowers', 'client', 'clients',
  'credit score', 'credit rating', 'creditworthiness',
  'dti', 'debt-to-income', 'income', 'employment',

  // Payment Terms
  'payment', 'payments', 'repayment', 'repayments', 'emi', 'installment',
  'paid', 'unpaid', 'missed payment', 'delayed payment', 'late payment',
  'on-time', 'early payment',

  // Financial Metrics
  'outstanding', 'outstanding amount', 'exposure', 'portfolio',
  'concentration', 'amount', 'balance', 'principal', 'interest',
  'tenure', 'maturity', 'due date',

  // Loan Status
  'active', 'closed', 'restructured', 'written off',

  // Sectors
  'sector', 'manufacturing', 'retail', 'it', 'healthcare',
  'real estate', 'agriculture', 'industry',

  // Geographic
  'geography', 'geographic', 'region', 'city', 'location',
  'mumbai', 'delhi', 'bangalore', 'pune', 'hyderabad',

  // Portfolio Analytics
  'portfolio', 'trend', 'trends', 'analysis', 'analytics',
  'summary', 'report', 'metric', 'metrics', 'kpi',
  'alert', 'alerts', 'warning', 'flag',

  // Queries
  'show', 'list', 'find', 'get', 'fetch', 'display',
  'what', 'how many', 'how much', 'which', 'who',
  'average', 'total', 'count', 'calculate',
]

// Finance-related terms that could be ambiguous
const FINANCE_GENERIC = [
  'bank', 'banking', 'finance', 'financial', 'credit', 'money', 'account'
]

/**
 * Validate if a question is relevant to credit risk domain
 *
 * @param query - User's question
 * @returns ValidationResult with relevance status and confidence level
 */
export function validateQuestionRelevance(query: string): ValidationResult {
  const lowerQuery = query.toLowerCase()

  // Normalize query - remove extra spaces, punctuation
  const normalizedQuery = lowerQuery
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Check for blocklist keywords first (fast rejection)
  const matchedBlocklist: string[] = []
  for (const keyword of BLOCKLIST_KEYWORDS) {
    if (normalizedQuery.includes(keyword.toLowerCase())) {
      matchedBlocklist.push(keyword)
    }
  }

  // Check for domain keywords
  const matchedDomain: string[] = []
  for (const keyword of DOMAIN_KEYWORDS) {
    if (normalizedQuery.includes(keyword.toLowerCase())) {
      matchedDomain.push(keyword)
    }
  }

  // Check for finance generic terms
  const matchedFinanceGeneric: string[] = []
  for (const keyword of FINANCE_GENERIC) {
    if (normalizedQuery.includes(keyword.toLowerCase())) {
      matchedFinanceGeneric.push(keyword)
    }
  }

  // Decision Logic

  // Case 1: Strong blocklist match with no domain keywords = REJECT (high confidence)
  if (matchedBlocklist.length > 0 && matchedDomain.length === 0) {
    return {
      isRelevant: false,
      confidence: 'high',
      reason: `Off-topic keywords detected: ${matchedBlocklist.slice(0, 3).join(', ')}`,
      matchedKeywords: matchedBlocklist,
    }
  }

  // Case 2: Strong domain keywords = ACCEPT (high confidence)
  if (matchedDomain.length >= 2) {
    return {
      isRelevant: true,
      confidence: 'high',
      reason: `Multiple domain keywords matched: ${matchedDomain.slice(0, 3).join(', ')}`,
      matchedKeywords: matchedDomain,
    }
  }

  // Case 3: One domain keyword = ACCEPT (medium confidence)
  if (matchedDomain.length === 1) {
    return {
      isRelevant: true,
      confidence: 'medium',
      reason: `Domain keyword matched: ${matchedDomain[0]}`,
      matchedKeywords: matchedDomain,
    }
  }

  // Case 4: Only finance generic terms = ACCEPT but low confidence
  // (might be asking about loans, but could also be general banking question)
  if (matchedFinanceGeneric.length > 0) {
    return {
      isRelevant: true,
      confidence: 'low',
      reason: `Generic finance keywords: ${matchedFinanceGeneric.join(', ')}. May need LLM verification.`,
      matchedKeywords: matchedFinanceGeneric,
    }
  }

  // Case 5: No keywords matched at all
  // This could be:
  // - A very short question like "show me"
  // - Using synonyms we haven't covered
  // - Genuinely off-topic

  // Check query length - very short queries might be ambiguous
  if (normalizedQuery.split(' ').length <= 3) {
    return {
      isRelevant: true, // Allow it, but with low confidence
      confidence: 'low',
      reason: 'Short query with no clear indicators. Allowing with low confidence.',
      matchedKeywords: [],
    }
  }

  // Case 6: Long query with no matches = likely off-topic
  return {
    isRelevant: false,
    confidence: 'medium',
    reason: 'No credit risk keywords detected in query',
    matchedKeywords: [],
  }
}

/**
 * Generate rejection message for off-topic questions
 */
export function getRejectionMessage(): string {
  return `I'm a specialized Credit Risk Analyst AI. I can only answer questions about our loan portfolio, risk assessment, and credit monitoring.

I can help you with:
- Analyzing high-risk loans and delinquency trends
- Customer credit profiles and risk scores
- Sector and geographic exposure analysis
- Portfolio health metrics and alerts

Please ask a question related to credit risk, loans, customers, or portfolio analytics.`
}

/**
 * Check if validation result should trigger rejection
 *
 * @param result - Validation result
 * @returns true if question should be rejected
 */
export function shouldRejectQuestion(result: ValidationResult): boolean {
  // Reject if:
  // - Explicitly marked as irrelevant with high or medium confidence
  // - Irrelevant with low confidence but has blocklist keywords

  if (!result.isRelevant && (result.confidence === 'high' || result.confidence === 'medium')) {
    return true
  }

  return false
}

/**
 * Batch validate multiple questions (for testing)
 */
export function batchValidate(questions: string[]): Array<{
  question: string
  result: ValidationResult
  shouldReject: boolean
}> {
  return questions.map(question => {
    const result = validateQuestionRelevance(question)
    return {
      question,
      result,
      shouldReject: shouldRejectQuestion(result),
    }
  })
}
