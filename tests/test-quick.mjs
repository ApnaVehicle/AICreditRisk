/**
 * Quick Smoke Test
 *
 * Fast test to verify the system's core functionality
 * Runs the most critical tests only
 */

import { PrismaClient } from '@prisma/client';

const BASE_URL = 'http://localhost:3000';
const prisma = new PrismaClient();

async function runQuickTests() {
  console.log('\n🚀 Running Quick Smoke Test...\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Database
  console.log('1. Database Connection...');
  try {
    await prisma.$connect();
    const loanCount = await prisma.loan.count();
    if (loanCount > 0) {
      console.log(`   ✅ Connected - ${loanCount} loans found\n`);
      passed++;
    } else {
      console.log('   ❌ No data found\n');
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
    failed++;
  }

  // Test 2: API Endpoint
  console.log('2. API Endpoint (Portfolio Summary)...');
  try {
    const response = await fetch(`${BASE_URL}/api/analytics/portfolio-summary`);
    const data = await response.json();
    if (response.ok && data.success) {
      console.log(`   ✅ Working - ${data.data.total_loans} loans in portfolio\n`);
      passed++;
    } else {
      console.log(`   ❌ Failed\n`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    console.log(`   Is server running? (npm run dev)\n`);
    failed++;
  }

  // Test 3: Guardrails
  console.log('3. Guardrails (Block Irrelevant Question)...');
  try {
    const response = await fetch(`${BASE_URL}/api/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "What's the weather today?" })
    });
    const data = await response.json();
    if (response.ok && data.success) {
      const isBlocked = data.data.response.toLowerCase().includes('specialized credit risk');
      if (isBlocked) {
        console.log('   ✅ Blocked correctly\n');
        passed++;
      } else {
        console.log('   ❌ Not blocked (should have been rejected)\n');
        failed++;
      }
    } else {
      console.log(`   ❌ Failed\n`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
    failed++;
  }

  // Test 4: New Comprehensive Tools
  console.log('4. New Tool Endpoints...');
  try {
    const loansResponse = await fetch(`${BASE_URL}/api/loans?limit=5`);
    const customerResponse = await fetch(`${BASE_URL}/api/customers/analytics`);
    const repaymentResponse = await fetch(`${BASE_URL}/api/repayments/analytics`);

    const loansOk = loansResponse.ok;
    const customerOk = customerResponse.ok;
    const repaymentOk = repaymentResponse.ok;

    if (loansOk && customerOk && repaymentOk) {
      console.log('   ✅ All new endpoints working\n');
      passed++;
    } else {
      console.log(`   ❌ Some endpoints failed`);
      console.log(`      Loans: ${loansOk ? '✅' : '❌'}`);
      console.log(`      Customer Analytics: ${customerOk ? '✅' : '❌'}`);
      console.log(`      Repayment Analytics: ${repaymentOk ? '✅' : '❌'}\n`);
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}\n`);
    failed++;
  }

  await prisma.$disconnect();

  // Summary
  console.log('='.repeat(50));
  console.log('📊 Quick Test Results:');
  console.log(`   Passed: ${passed}/4`);
  console.log(`   Failed: ${failed}/4`);
  console.log('='.repeat(50) + '\n');

  if (failed === 0) {
    console.log('🎉 Core functionality is working!\n');
    console.log('Run full test suite: node tests/run-all-tests.mjs\n');
  } else {
    console.log('⚠️  Some tests failed. Check the output above.\n');
  }

  return failed === 0;
}

// Run
runQuickTests()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
