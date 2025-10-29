/**
 * Test Runner - Runs All Tests in Sequence
 *
 * Executes all test files and provides a comprehensive summary
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TESTS = [
  {
    name: 'Database Connectivity',
    file: 'test-database.mjs',
    requiresServer: false,
    description: 'Tests Prisma database connectivity and seeded data'
  },
  {
    name: 'API Endpoints',
    file: 'test-api-endpoints.mjs',
    requiresServer: true,
    description: 'Tests all REST API endpoints'
  },
  {
    name: 'Guardrails & Validation',
    file: 'test-guardrails.mjs',
    requiresServer: true,
    description: 'Tests that irrelevant questions are blocked'
  },
  {
    name: 'AI Agent Tool Calling',
    file: 'test-agent-tools.mjs',
    requiresServer: true,
    description: 'Tests AI agent tool execution (requires OpenAI API key)'
  }
];

function runTest(testFile) {
  return new Promise((resolve, reject) => {
    const testPath = join(__dirname, testFile);
    const child = spawn('node', [testPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    child.on('close', (code) => {
      resolve({
        file: testFile,
        success: code === 0,
        exitCode: code
      });
    });

    child.on('error', (error) => {
      reject({
        file: testFile,
        error: error.message
      });
    });
  });
}

async function runAllTests() {
  console.log('\n' + '='.repeat(80));
  console.log(' '.repeat(20) + 'CREDIT RISK MONITORING AI - TEST SUITE');
  console.log('='.repeat(80) + '\n');

  console.log('📋 Test Plan:\n');
  TESTS.forEach((test, index) => {
    console.log(`  ${index + 1}. ${test.name}`);
    console.log(`     ${test.description}`);
    if (test.requiresServer) {
      console.log(`     ⚠️  Requires: Server running (npm run dev)`);
    }
    console.log();
  });

  console.log('⏳ Starting tests...\n');

  const results = [];
  let totalPassed = 0;
  let totalFailed = 0;

  for (const [index, test] of TESTS.entries()) {
    console.log('='.repeat(80));
    console.log(`Running Test ${index + 1}/${TESTS.length}: ${test.name}`);
    console.log('='.repeat(80));

    try {
      const result = await runTest(test.file);
      results.push({
        ...test,
        ...result
      });

      if (result.success) {
        totalPassed++;
      } else {
        totalFailed++;
      }
    } catch (error) {
      console.error(`\n❌ Fatal error running ${test.name}:`, error.error || error);
      results.push({
        ...test,
        success: false,
        error: error.error || error.message
      });
      totalFailed++;
    }

    console.log(); // Empty line between tests
  }

  // Print final summary
  console.log('\n' + '='.repeat(80));
  console.log(' '.repeat(30) + 'FINAL TEST SUMMARY');
  console.log('='.repeat(80) + '\n');

  results.forEach((result, index) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${index + 1}. ${result.name}: ${status}`);
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
  });

  console.log('\n' + '-'.repeat(80));
  console.log(`  Total Tests: ${results.length}`);
  console.log(`  Passed: ${totalPassed}`);
  console.log(`  Failed: ${totalFailed}`);
  console.log(`  Success Rate: ${((totalPassed / results.length) * 100).toFixed(1)}%`);
  console.log('-'.repeat(80) + '\n');

  if (totalFailed > 0) {
    console.log('⚠️  Some tests failed. Common issues:\n');
    console.log('  1. Database not seeded:');
    console.log('     Run: DATABASE_URL="file:./dev.db" npx prisma db seed\n');
    console.log('  2. Server not running:');
    console.log('     Run: npm run dev (in separate terminal)\n');
    console.log('  3. OpenAI API key not set:');
    console.log('     Add OPENAI_API_KEY to .env.local\n');
    console.log('  4. OpenAI API credits:');
    console.log('     Ensure you have credits at platform.openai.com\n');
  } else {
    console.log('🎉 All tests passed! The system is working correctly.\n');
  }

  return totalFailed === 0;
}

// Run all tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Fatal error in test runner:', error);
    process.exit(1);
  });
