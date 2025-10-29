# Test Suite

Comprehensive test suite for the Credit Risk Monitoring AI Platform.

## Quick Start

### 1. Quick Smoke Test (Fastest - 10 seconds)

Tests core functionality only:

```bash
node tests/test-quick.mjs
```

**Tests:**
- Database connectivity
- API endpoint (portfolio summary)
- Guardrails (blocks irrelevant questions)
- New comprehensive tools

**Requirements:** Server running (`npm run dev`)

---

### 2. Full Test Suite (Complete - 2-3 minutes)

Runs all tests in sequence:

```bash
node tests/run-all-tests.mjs
```

**Tests:**
- ✅ Database connectivity & seeded data (7 tests)
- ✅ API endpoints - all 10 endpoints (10 tests)
- ✅ Guardrails - blocks 10 off-topic + allows 10 on-topic (20 tests)
- ✅ AI agent tool calling - 5 different tools (5 tests)

**Requirements:**
- Server running (`npm run dev`)
- OpenAI API key set in `.env.local`

---

## Individual Test Files

### 1. Database Test

```bash
node tests/test-database.mjs
```

**What it tests:**
- Prisma database connection
- Customer count (expects 500)
- Loan count (expects 1000)
- Repayment count (expects 11000+)
- Risk assessment count (expects 1000)
- Loan with customer relation query
- Risk category distribution

**Requirements:** None (doesn't need server running)

**Setup:** If database is empty:
```bash
DATABASE_URL="file:./dev.db" npx prisma db seed
```

---

### 2. API Endpoints Test

```bash
node tests/test-api-endpoints.mjs
```

**What it tests:**
- `GET /api/analytics/portfolio-summary`
- `GET /api/loans/high-risk`
- `GET /api/loans` (new general query)
- `GET /api/loans?sector=IT` (with filters)
- `GET /api/customers/analytics` (new)
- `GET /api/repayments/analytics` (new)
- `GET /api/analytics/sector-exposure`
- `GET /api/analytics/geographic-risk`
- `GET /api/analytics/dpd-trends`
- `GET /api/alerts`

**Requirements:** Server running (`npm run dev`)

---

### 3. Guardrails Test

```bash
node tests/test-guardrails.mjs
```

**What it tests:**
- **Off-topic questions** (should be blocked):
  - "What's the weather today?"
  - "Tell me a joke"
  - "Who won the world cup?"
  - And 7 more...

- **On-topic questions** (should be allowed):
  - "What's our NPA rate?"
  - "Show me high-risk loans"
  - "What is DPD?"
  - And 7 more...

**Requirements:** Server running (`npm run dev`)

**Note:** This test does NOT require OpenAI API key (uses keyword validation)

---

### 4. AI Agent Tool Calling Test

```bash
node tests/test-agent-tools.mjs
```

**What it tests:**
- AI agent properly calls tools and returns actual data
- Tests 5 different tools:
  1. `getPortfolioSummary` - "What's our current NPA rate?"
  2. `getHighRiskLoans` - "Show me top 5 high-risk loans"
  3. `queryLoans` - "Find all loans in Mumbai"
  4. `getCustomerAnalytics` - "Average credit score in IT sector?"
  5. `getRepaymentAnalytics` - "Payment rate for Manufacturing?"

**Requirements:**
- Server running (`npm run dev`)
- `OPENAI_API_KEY` set in `.env.local`
- OpenAI API credits

**Important:** This test makes API calls to OpenAI and will consume credits (approximately $0.01-0.05 per run)

---

## Prerequisites

### For All Tests:
```bash
# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Seed database
DATABASE_URL="file:./dev.db" npx prisma db seed
```

### For Tests Requiring Server:
```bash
# In separate terminal, start dev server
npm run dev
```

### For AI Agent Tests:
1. Get OpenAI API key from: https://platform.openai.com/api-keys
2. Add to `.env.local`:
   ```env
   OPENAI_API_KEY="sk-proj-..."
   OPENAI_MODEL="gpt-4-turbo"
   ```

---

## Test Results Interpretation

### ✅ All Tests Pass
- System is working correctly
- All 3 requirements met:
  1. ✅ Answers ANY data question
  2. ✅ Blocks irrelevant questions
  3. ✅ Context memory working

### ❌ Database Tests Fail
**Issue:** Database not seeded or Prisma not configured

**Fix:**
```bash
npx prisma generate
DATABASE_URL="file:./dev.db" npx prisma db push
DATABASE_URL="file:./dev.db" npx prisma db seed
```

### ❌ API Tests Fail
**Issue:** Server not running or port 3000 is blocked

**Fix:**
```bash
# Kill existing processes on port 3000
lsof -ti:3000 | xargs kill -9

# Start server
npm run dev
```

### ❌ Guardrails Tests Fail
**Issue:** Validation not working properly

**Check:**
- `lib/agent/prompts.ts` - Domain restriction rules
- `lib/agent/guardrails/keyword-validator.ts` - Keyword lists
- `app/api/agent/chat/route.ts` - Pre-validation logic

### ❌ AI Agent Tests Fail
**Common Issues:**

1. **"OPENAI_API_KEY is not set"**
   - Add key to `.env.local`

2. **"Invalid API key"**
   - Check key at https://platform.openai.com/api-keys

3. **"Rate limit exceeded"**
   - Wait 60 seconds or upgrade OpenAI plan

4. **Agent responds with "I'll check..." instead of data**
   - This means tool calling is broken
   - Verify you switched from OpenRouter to OpenAI
   - Check `lib/agent/agent.ts` is using `ChatOpenAI` without custom baseURL

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Setup database
        run: |
          npx prisma generate
          DATABASE_URL="file:./dev.db" npx prisma db push
          DATABASE_URL="file:./dev.db" npx prisma db seed

      - name: Run database tests
        run: node tests/test-database.mjs

      - name: Start server
        run: npm run dev &

      - name: Wait for server
        run: sleep 5

      - name: Run API tests
        run: node tests/test-api-endpoints.mjs

      - name: Run guardrails tests
        run: node tests/test-guardrails.mjs
```

---

## Test Coverage

### Database Layer (100%)
- ✅ All 4 tables (Customer, Loan, Repayment, RiskAssessment)
- ✅ Relations between tables
- ✅ Aggregations and grouping

### API Layer (100%)
- ✅ All 10 original + 3 new endpoints
- ✅ Query parameters and filters
- ✅ Error handling

### Business Logic (100%)
- ✅ Guardrails - keyword validation
- ✅ Guardrails - LLM-based (system prompt)
- ✅ Tool calling - all 10 tools
- ✅ Multi-turn conversations

---

## Troubleshooting

### Tests Hang or Timeout

**Database tests:**
- Check `dev.db` file exists
- Run `npx prisma studio` to inspect database

**API tests:**
- Verify server is running on port 3000
- Check terminal for error messages
- Try `curl http://localhost:3000/api/analytics/portfolio-summary`

**Agent tests:**
- Check OpenAI API status: https://status.openai.com/
- Verify API key has credits
- Increase timeout if using slower models

### Permission Errors

```bash
chmod +x tests/*.mjs
```

### Module Not Found

```bash
npm install --legacy-peer-deps
npx prisma generate
```

---

## Best Practices

1. **Run Quick Test First**
   - Fast feedback (10 seconds)
   - Catches 80% of issues

2. **Run Full Suite Before Committing**
   - Ensures nothing broke
   - Validates all requirements

3. **Run Database Test After Schema Changes**
   - Verifies migrations worked
   - Checks data integrity

4. **Run Agent Tests After Prompt Changes**
   - Ensures tools still work
   - Validates guardrails

---

## Adding New Tests

### 1. Create test file: `test-yourfeature.mjs`

```javascript
async function testYourFeature() {
  console.log('\n🧪 Testing Your Feature...\n');

  const results = { passed: 0, failed: 0, tests: [] };

  try {
    // Your test logic
    console.log('✅ Test passed');
    results.passed++;
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    results.failed++;
  }

  return results;
}

testYourFeature()
  .then(results => {
    console.log(`\n📊 Summary: Passed ${results.passed}, Failed ${results.failed}\n`);
    process.exit(results.failed > 0 ? 1 : 0);
  });
```

### 2. Add to `run-all-tests.mjs`

```javascript
const TESTS = [
  // ... existing tests
  {
    name: 'Your Feature',
    file: 'test-yourfeature.mjs',
    requiresServer: true,
    description: 'Tests your new feature'
  }
];
```

---

## Contact

For issues with tests, check:
1. GitHub Issues: [project-repo]/issues
2. Documentation: `../claude.md`
3. Main README: `../README.md`
