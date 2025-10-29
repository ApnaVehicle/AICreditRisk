/**
 * AI Agent Tool Calling Test
 *
 * Tests the AI agent's ability to call tools and return actual data
 * Note: Server must be running and OPENAI_API_KEY must be set in .env.local
 */

const BASE_URL = 'http://localhost:3000';

// Test queries that should trigger different tools
const TEST_QUERIES = [
  {
    query: "What's our current NPA rate?",
    expectedTool: 'getPortfolioSummary',
    description: 'Portfolio Summary Tool',
    expectedInResponse: ['npa', 'rate', '%']
  },
  {
    query: "Show me top 5 high-risk loans",
    expectedTool: 'getHighRiskLoans',
    description: 'High Risk Loans Tool',
    expectedInResponse: ['loan', 'risk']
  },
  {
    query: "Find all loans in Mumbai",
    expectedTool: 'queryLoans',
    description: 'General Loan Query Tool',
    expectedInResponse: ['mumbai', 'loan']
  },
  {
    query: "What's the average credit score of customers in IT sector?",
    expectedTool: 'getCustomerAnalytics',
    description: 'Customer Analytics Tool',
    expectedInResponse: ['credit score', 'it']
  },
  {
    query: "What's the payment rate for Manufacturing sector?",
    expectedTool: 'getRepaymentAnalytics',
    description: 'Repayment Analytics Tool',
    expectedInResponse: ['payment rate', 'manufacturing']
  }
];

async function testAgentTools() {
  console.log('\n🧪 Testing AI Agent Tool Calling...\n');
  console.log('⚠️  Requirements:');
  console.log('   1. Server must be running: npm run dev');
  console.log('   2. OPENAI_API_KEY must be set in .env.local\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  for (const [index, testCase] of TEST_QUERIES.entries()) {
    const testNum = index + 1;
    console.log(`\n🔍 Test ${testNum}: ${testCase.description}`);
    console.log(`   Query: "${testCase.query}"`);

    try {
      const response = await fetch(`${BASE_URL}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: testCase.query
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.log(`❌ Test ${testNum}: API request failed (${response.status})`);
        results.failed++;
        results.tests.push({
          test: testCase.description,
          status: 'FAIL',
          error: `HTTP ${response.status}`
        });
        continue;
      }

      if (!data.success) {
        console.log(`❌ Test ${testNum}: Response not successful`);
        console.log(`   Error: ${data.error || 'Unknown error'}`);
        results.failed++;
        results.tests.push({
          test: testCase.description,
          status: 'FAIL',
          error: data.error
        });
        continue;
      }

      const agentResponse = data.data.response;

      // Check if response contains expected keywords (indicating tool was used)
      const responseContainsData = testCase.expectedInResponse.some(keyword =>
        agentResponse.toLowerCase().includes(keyword.toLowerCase())
      );

      // Check if response is NOT just "I'll check..." (which means tool wasn't called)
      const isJustIntention = agentResponse.toLowerCase().includes("i'll check") ||
                             agentResponse.toLowerCase().includes("i will check") ||
                             agentResponse.toLowerCase().includes("let me check");

      if (responseContainsData && !isJustIntention) {
        console.log(`✅ Test ${testNum}: Tool called successfully`);
        console.log(`   Response preview: ${agentResponse.substring(0, 100)}...`);
        results.passed++;
        results.tests.push({
          test: testCase.description,
          status: 'PASS',
          responseLength: agentResponse.length
        });
      } else {
        console.log(`❌ Test ${testNum}: Tool may not have been called properly`);
        console.log(`   Response: ${agentResponse.substring(0, 150)}...`);
        console.log(`   Issue: ${isJustIntention ? 'Response is just intention, not actual data' : 'Expected keywords not found'}`);
        results.failed++;
        results.tests.push({
          test: testCase.description,
          status: 'FAIL',
          error: 'Tool not called or returned incomplete data',
          response: agentResponse.substring(0, 200)
        });
      }

      // Small delay between requests to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log(`❌ Test ${testNum}: Error - ${error.message}`);
      results.failed++;
      results.tests.push({
        test: testCase.description,
        status: 'FAIL',
        error: error.message
      });
    }
  }

  return results;
}

// Run tests
testAgentTools()
  .then(results => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 AI Agent Tool Calling Test Summary:');
    console.log(`   Passed: ${results.passed}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Total:  ${results.passed + results.failed}`);
    console.log('='.repeat(60) + '\n');

    if (results.failed > 0) {
      console.log('⚠️  If tests failed, check:');
      console.log('   1. Is OPENAI_API_KEY set correctly in .env.local?');
      console.log('   2. Is the server running (npm run dev)?');
      console.log('   3. Do you have OpenAI API credits?');
      console.log('   4. Check terminal logs for detailed error messages\n');
    }

    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error running agent tool tests:', error);
    console.error('   Make sure:');
    console.error('   - Server is running: npm run dev');
    console.error('   - OPENAI_API_KEY is set in .env.local\n');
    process.exit(1);
  });
