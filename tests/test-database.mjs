/**
 * Database Connectivity Test
 *
 * Tests Prisma database connectivity and verifies seeded data
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('\n🧪 Testing Database Connectivity...\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Database Connection
  try {
    await prisma.$connect();
    console.log('✅ Test 1: Database connection successful');
    results.passed++;
    results.tests.push({ name: 'Database Connection', status: 'PASS' });
  } catch (error) {
    console.log('❌ Test 1: Database connection failed:', error.message);
    results.failed++;
    results.tests.push({ name: 'Database Connection', status: 'FAIL', error: error.message });
    return results;
  }

  // Test 2: Count Customers
  try {
    const customerCount = await prisma.customer.count();
    if (customerCount > 0) {
      console.log(`✅ Test 2: Found ${customerCount} customers in database`);
      results.passed++;
      results.tests.push({ name: 'Customer Count', status: 'PASS', count: customerCount });
    } else {
      console.log('❌ Test 2: No customers found. Run: DATABASE_URL="file:./dev.db" npx prisma db seed');
      results.failed++;
      results.tests.push({ name: 'Customer Count', status: 'FAIL', error: 'No customers found' });
    }
  } catch (error) {
    console.log('❌ Test 2: Error counting customers:', error.message);
    results.failed++;
    results.tests.push({ name: 'Customer Count', status: 'FAIL', error: error.message });
  }

  // Test 3: Count Loans
  try {
    const loanCount = await prisma.loan.count();
    if (loanCount > 0) {
      console.log(`✅ Test 3: Found ${loanCount} loans in database`);
      results.passed++;
      results.tests.push({ name: 'Loan Count', status: 'PASS', count: loanCount });
    } else {
      console.log('❌ Test 3: No loans found');
      results.failed++;
      results.tests.push({ name: 'Loan Count', status: 'FAIL', error: 'No loans found' });
    }
  } catch (error) {
    console.log('❌ Test 3: Error counting loans:', error.message);
    results.failed++;
    results.tests.push({ name: 'Loan Count', status: 'FAIL', error: error.message });
  }

  // Test 4: Count Repayments
  try {
    const repaymentCount = await prisma.repayment.count();
    if (repaymentCount > 0) {
      console.log(`✅ Test 4: Found ${repaymentCount} repayments in database`);
      results.passed++;
      results.tests.push({ name: 'Repayment Count', status: 'PASS', count: repaymentCount });
    } else {
      console.log('❌ Test 4: No repayments found');
      results.failed++;
      results.tests.push({ name: 'Repayment Count', status: 'FAIL', error: 'No repayments found' });
    }
  } catch (error) {
    console.log('❌ Test 4: Error counting repayments:', error.message);
    results.failed++;
    results.tests.push({ name: 'Repayment Count', status: 'FAIL', error: error.message });
  }

  // Test 5: Count Risk Assessments
  try {
    const riskCount = await prisma.riskAssessment.count();
    if (riskCount > 0) {
      console.log(`✅ Test 5: Found ${riskCount} risk assessments in database`);
      results.passed++;
      results.tests.push({ name: 'Risk Assessment Count', status: 'PASS', count: riskCount });
    } else {
      console.log('❌ Test 5: No risk assessments found');
      results.failed++;
      results.tests.push({ name: 'Risk Assessment Count', status: 'FAIL', error: 'No risk assessments found' });
    }
  } catch (error) {
    console.log('❌ Test 5: Error counting risk assessments:', error.message);
    results.failed++;
    results.tests.push({ name: 'Risk Assessment Count', status: 'FAIL', error: error.message });
  }

  // Test 6: Query Sample Loan with Relations
  try {
    const sampleLoan = await prisma.loan.findFirst({
      include: {
        customer: true,
        repayments: { take: 1 },
        risk_assessments: { take: 1 }
      }
    });

    if (sampleLoan && sampleLoan.customer) {
      console.log('✅ Test 6: Successfully queried loan with customer relation');
      results.passed++;
      results.tests.push({ name: 'Loan Relations', status: 'PASS', loanId: sampleLoan.id });
    } else {
      console.log('❌ Test 6: Failed to query loan with relations');
      results.failed++;
      results.tests.push({ name: 'Loan Relations', status: 'FAIL', error: 'No loan found with relations' });
    }
  } catch (error) {
    console.log('❌ Test 6: Error querying loan with relations:', error.message);
    results.failed++;
    results.tests.push({ name: 'Loan Relations', status: 'FAIL', error: error.message });
  }

  // Test 7: Verify Risk Categories Distribution
  try {
    const riskDistribution = await prisma.riskAssessment.groupBy({
      by: ['risk_category'],
      _count: { risk_category: true }
    });

    if (riskDistribution.length > 0) {
      console.log('✅ Test 7: Risk category distribution:');
      riskDistribution.forEach(item => {
        console.log(`   - ${item.risk_category}: ${item._count.risk_category}`);
      });
      results.passed++;
      results.tests.push({ name: 'Risk Distribution', status: 'PASS', distribution: riskDistribution });
    } else {
      console.log('❌ Test 7: No risk distribution found');
      results.failed++;
      results.tests.push({ name: 'Risk Distribution', status: 'FAIL', error: 'No distribution' });
    }
  } catch (error) {
    console.log('❌ Test 7: Error getting risk distribution:', error.message);
    results.failed++;
    results.tests.push({ name: 'Risk Distribution', status: 'FAIL', error: error.message });
  }

  await prisma.$disconnect();

  return results;
}

// Run tests
testDatabase()
  .then(results => {
    console.log('\n📊 Database Test Summary:');
    console.log(`   Passed: ${results.passed}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Total:  ${results.passed + results.failed}\n`);

    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Fatal error running database tests:', error);
    process.exit(1);
  });
