/**
 * Guardrails & Validation Test
 *
 * Tests that the AI agent properly blocks irrelevant/off-topic questions
 * Note: Server must be running (npm run dev)
 */

const BASE_URL = 'http://localhost:3000';

// Off-topic questions that SHOULD be blocked
const OFF_TOPIC_QUESTIONS = [
  "What's the weather today?",
  "Tell me a joke",
  "Who won the world cup?",
  "How do I make pasta?",
  "What is the capital of France?",
  "Write me a poem",
  "What's the meaning of life?",
  "Can you help me with my homework?",
  "What's your favorite color?",
  "Tell me about dinosaurs"
];

// On-topic questions that SHOULD be allowed
const ON_TOPIC_QUESTIONS = [
  "What's our NPA rate?",
  "Show me high-risk loans",
  "What is DPD?",
  "Analyze sector exposure",
  "How many loans do we have?",
  "What's the average credit score?",
  "Show me delinquent loans",
  "Calculate portfolio risk",
  "What does DTI ratio mean?",
  "Analyze repayment patterns"
];

const REJECTION_KEYWORDS = [
  'specialized credit risk analyst',
  'only answer questions about',
  'loan portfolio',
  'risk assessment',
  'credit monitoring'
];

function isRejectionMessage(response) {
  const lowerResponse = response.toLowerCase();
  return REJECTION_KEYWORDS.some(keyword =>
    lowerResponse.includes(keyword.toLowerCase())
  );
}

async function testGuardrails() {
  console.log('\n🧪 Testing Guardrails & Validation...\n');
  console.log('⚠️  Server must be running: npm run dev\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Off-topic questions should be BLOCKED
  console.log('📋 Testing Off-Topic Questions (should be BLOCKED):\n');

  for (const [index, question] of OFF_TOPIC_QUESTIONS.entries()) {
    const testNum = index + 1;
    console.log(`Test ${testNum}: "${question}"`);

    try {
      const response = await fetch(`${BASE_URL}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: question
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const agentResponse = data.data.response;
        const wasBlocked = isRejectionMessage(agentResponse);

        if (wasBlocked) {
          console.log(`   ✅ BLOCKED correctly\n`);
          results.passed++;
          results.tests.push({
            type: 'OFF_TOPIC',
            question,
            status: 'PASS',
            blocked: true
          });
        } else {
          console.log(`   ❌ NOT BLOCKED (should have been rejected)`);
          console.log(`   Response: ${agentResponse.substring(0, 100)}...\n`);
          results.failed++;
          results.tests.push({
            type: 'OFF_TOPIC',
            question,
            status: 'FAIL',
            blocked: false,
            response: agentResponse.substring(0, 200)
          });
        }
      } else {
        console.log(`   ❌ API error: ${data.error || 'Unknown error'}\n`);
        results.failed++;
        results.tests.push({
          type: 'OFF_TOPIC',
          question,
          status: 'FAIL',
          error: data.error
        });
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      results.failed++;
      results.tests.push({
        type: 'OFF_TOPIC',
        question,
        status: 'FAIL',
        error: error.message
      });
    }
  }

  // Test 2: On-topic questions should be ALLOWED
  console.log('\n📋 Testing On-Topic Questions (should be ALLOWED):\n');

  for (const [index, question] of ON_TOPIC_QUESTIONS.entries()) {
    const testNum = index + 1;
    console.log(`Test ${testNum}: "${question}"`);

    try {
      const response = await fetch(`${BASE_URL}/api/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: question
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const agentResponse = data.data.response;
        const wasBlocked = isRejectionMessage(agentResponse);

        if (!wasBlocked) {
          console.log(`   ✅ ALLOWED correctly\n`);
          results.passed++;
          results.tests.push({
            type: 'ON_TOPIC',
            question,
            status: 'PASS',
            blocked: false
          });
        } else {
          console.log(`   ❌ BLOCKED (should have been allowed)`);
          console.log(`   Response: ${agentResponse.substring(0, 100)}...\n`);
          results.failed++;
          results.tests.push({
            type: 'ON_TOPIC',
            question,
            status: 'FAIL',
            blocked: true,
            response: agentResponse.substring(0, 200)
          });
        }
      } else {
        console.log(`   ❌ API error: ${data.error || 'Unknown error'}\n`);
        results.failed++;
        results.tests.push({
          type: 'ON_TOPIC',
          question,
          status: 'FAIL',
          error: data.error
        });
      }

      // Small delay
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
      results.failed++;
      results.tests.push({
        type: 'ON_TOPIC',
        question,
        status: 'FAIL',
        error: error.message
      });
    }
  }

  return results;
}

// Run tests
testGuardrails()
  .then(results => {
    const offTopicTests = results.tests.filter(t => t.type === 'OFF_TOPIC');
    const onTopicTests = results.tests.filter(t => t.type === 'ON_TOPIC');

    const offTopicPassed = offTopicTests.filter(t => t.status === 'PASS').length;
    const onTopicPassed = onTopicTests.filter(t => t.status === 'PASS').length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 Guardrails Test Summary:');
    console.log('='.repeat(60));
    console.log(`\n  Off-Topic Questions (should be blocked):`);
    console.log(`    Correctly Blocked: ${offTopicPassed}/${offTopicTests.length}`);
    console.log(`\n  On-Topic Questions (should be allowed):`);
    console.log(`    Correctly Allowed: ${onTopicPassed}/${onTopicTests.length}`);
    console.log(`\n  Overall:`);
    console.log(`    Passed: ${results.passed}`);
    console.log(`    Failed: ${results.failed}`);
    console.log(`    Total:  ${results.passed + results.failed}`);
    console.log('='.repeat(60) + '\n');

    if (results.failed > 0) {
      console.log('⚠️  Some guardrail tests failed. Review the output above.');
      console.log('   Ensure the guardrails are properly configured in:');
      console.log('   - lib/agent/prompts.ts');
      console.log('   - lib/agent/guardrails/keyword-validator.ts');
      console.log('   - app/api/agent/chat/route.ts\n');
    }

    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error running guardrails tests:', error);
    console.error('   Make sure the server is running: npm run dev\n');
    process.exit(1);
  });
