/**
 * API Endpoints Test
 *
 * Tests all API endpoints to ensure they're working correctly
 * Note: Server must be running (npm run dev) before running this test
 */

const BASE_URL = 'http://localhost:3000';

async function testAPIEndpoints() {
  console.log('\n🧪 Testing API Endpoints...\n');
  console.log('⚠️  Make sure the dev server is running: npm run dev\n');

  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: GET /api/analytics/portfolio-summary
  try {
    const response = await fetch(`${BASE_URL}/api/analytics/portfolio-summary`);
    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Test 1: GET /api/analytics/portfolio-summary - Success');
      console.log(`   Total Loans: ${data.data.total_loans}`);
      console.log(`   NPA Rate: ${data.data.npa_rate.toFixed(2)}%`);
      results.passed++;
      results.tests.push({ endpoint: 'portfolio-summary', status: 'PASS' });
    } else {
      console.log('❌ Test 1: portfolio-summary endpoint failed');
      results.failed++;
      results.tests.push({ endpoint: 'portfolio-summary', status: 'FAIL', error: data.error });
    }
  } catch (error) {
    console.log('❌ Test 1: Error calling portfolio-summary:', error.message);
    results.failed++;
    results.tests.push({ endpoint: 'portfolio-summary', status: 'FAIL', error: error.message });
  }

  // Test 2: GET /api/loans/high-risk
  try {
    const response = await fetch(`${BASE_URL}/api/loans/high-risk?limit=5&minRiskScore=60`);
    const data = await response.json();

    if (response.ok && data.success && Array.isArray(data.data)) {
      console.log(`✅ Test 2: GET /api/loans/high-risk - Found ${data.data.length} high-risk loans`);
      results.passed++;
      results.tests.push({ endpoint: 'high-risk-loans', status: 'PASS', count: data.data.length });
    } else {
      console.log('❌ Test 2: high-risk endpoint failed');
      results.failed++;
      results.tests.push({ endpoint: 'high-risk-loans', status: 'FAIL', error: data.error });
    }
  } catch (error) {
    console.log('❌ Test 2: Error calling high-risk:', error.message);
    results.failed++;
    results.tests.push({ endpoint: 'high-risk-loans', status: 'FAIL', error: error.message });
  }

  // Test 3: GET /api/loans (new general query endpoint)
  try {
    const response = await fetch(`${BASE_URL}/api/loans?limit=10`);
    const data = await response.json();

    if (response.ok && data.success && Array.isArray(data.data)) {
      console.log(`✅ Test 3: GET /api/loans - Found ${data.data.length} loans`);
      results.passed++;
      results.tests.push({ endpoint: 'general-loans', status: 'PASS', count: data.data.length });
    } else {
      console.log('❌ Test 3: general loans endpoint failed');
      results.failed++;
      results.tests.push({ endpoint: 'general-loans', status: 'FAIL', error: data.error });
    }
  } catch (error) {
    console.log('❌ Test 3: Error calling loans:', error.message);
    results.failed++;
    results.tests.push({ endpoint: 'general-loans', status: 'FAIL', error: error.message });
  }

  // Test 4: GET /api/loans with filters
  try {
    const response = await fetch(`${BASE_URL}/api/loans?sector=IT&limit=5`);
    const data = await response.json();

    if (response.ok && data.success) {
      console.log(`✅ Test 4: GET /api/loans?sector=IT - Found ${data.data.length} IT sector loans`);
      results.passed++;
      results.tests.push({ endpoint: 'loans-with-filter', status: 'PASS', count: data.data.length });
    } else {
      console.log('❌ Test 4: loans with filter failed');
      results.failed++;
      results.tests.push({ endpoint: 'loans-with-filter', status: 'FAIL', error: data.error });
    }
  } catch (error) {
    console.log('❌ Test 4: Error calling loans with filter:', error.message);
    results.failed++;
    results.tests.push({ endpoint: 'loans-with-filter', status: 'FAIL', error: error.message });
  }

  // Test 5: GET /api/customers/analytics
  try {
    const response = await fetch(`${BASE_URL}/api/customers/analytics`);
    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Test 5: GET /api/customers/analytics - Success');
      console.log(`   Total Customers: ${data.data.overall.total_customers}`);
      console.log(`   Avg Credit Score: ${data.data.overall.avg_credit_score.toFixed(1)}`);
      results.passed++;
      results.tests.push({ endpoint: 'customer-analytics', status: 'PASS' });
    } else {
      console.log('❌ Test 5: customer analytics endpoint failed');
      results.failed++;
      results.tests.push({ endpoint: 'customer-analytics', status: 'FAIL', error: data.error });
    }
  } catch (error) {
    console.log('❌ Test 5: Error calling customer analytics:', error.message);
    results.failed++;
    results.tests.push({ endpoint: 'customer-analytics', status: 'FAIL', error: error.message });
  }

  // Test 6: GET /api/repayments/analytics
  try {
    const response = await fetch(`${BASE_URL}/api/repayments/analytics`);
    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Test 6: GET /api/repayments/analytics - Success');
      console.log(`   Total Repayments: ${data.data.overall.total_repayments}`);
      console.log(`   Payment Rate: ${data.data.overall.payment_rate.toFixed(1)}%`);
      results.passed++;
      results.tests.push({ endpoint: 'repayment-analytics', status: 'PASS' });
    } else {
      console.log('❌ Test 6: repayment analytics endpoint failed');
      results.failed++;
      results.tests.push({ endpoint: 'repayment-analytics', status: 'FAIL', error: data.error });
    }
  } catch (error) {
    console.log('❌ Test 6: Error calling repayment analytics:', error.message);
    results.failed++;
    results.tests.push({ endpoint: 'repayment-analytics', status: 'FAIL', error: error.message });
  }

  // Test 7: GET /api/analytics/sector-exposure
  try {
    const response = await fetch(`${BASE_URL}/api/analytics/sector-exposure`);
    const data = await response.json();

    if (response.ok && data.success && Array.isArray(data.data)) {
      console.log(`✅ Test 7: GET /api/analytics/sector-exposure - Found ${data.data.length} sectors`);
      results.passed++;
      results.tests.push({ endpoint: 'sector-exposure', status: 'PASS', count: data.data.length });
    } else {
      console.log('❌ Test 7: sector-exposure endpoint failed');
      results.failed++;
      results.tests.push({ endpoint: 'sector-exposure', status: 'FAIL', error: data.error });
    }
  } catch (error) {
    console.log('❌ Test 7: Error calling sector-exposure:', error.message);
    results.failed++;
    results.tests.push({ endpoint: 'sector-exposure', status: 'FAIL', error: error.message });
  }

  // Test 8: GET /api/analytics/geographic-risk
  try {
    const response = await fetch(`${BASE_URL}/api/analytics/geographic-risk`);
    const data = await response.json();

    if (response.ok && data.success && Array.isArray(data.data)) {
      console.log(`✅ Test 8: GET /api/analytics/geographic-risk - Found ${data.data.length} locations`);
      results.passed++;
      results.tests.push({ endpoint: 'geographic-risk', status: 'PASS', count: data.data.length });
    } else {
      console.log('❌ Test 8: geographic-risk endpoint failed');
      results.failed++;
      results.tests.push({ endpoint: 'geographic-risk', status: 'FAIL', error: data.error });
    }
  } catch (error) {
    console.log('❌ Test 8: Error calling geographic-risk:', error.message);
    results.failed++;
    results.tests.push({ endpoint: 'geographic-risk', status: 'FAIL', error: error.message });
  }

  // Test 9: GET /api/analytics/dpd-trends
  try {
    const response = await fetch(`${BASE_URL}/api/analytics/dpd-trends?months=3`);
    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Test 9: GET /api/analytics/dpd-trends - Success');
      results.passed++;
      results.tests.push({ endpoint: 'dpd-trends', status: 'PASS' });
    } else {
      console.log('❌ Test 9: dpd-trends endpoint failed');
      results.failed++;
      results.tests.push({ endpoint: 'dpd-trends', status: 'FAIL', error: data.error });
    }
  } catch (error) {
    console.log('❌ Test 9: Error calling dpd-trends:', error.message);
    results.failed++;
    results.tests.push({ endpoint: 'dpd-trends', status: 'FAIL', error: error.message });
  }

  // Test 10: GET /api/alerts
  try {
    const response = await fetch(`${BASE_URL}/api/alerts`);
    const data = await response.json();

    if (response.ok && data.success && Array.isArray(data.data)) {
      console.log(`✅ Test 10: GET /api/alerts - Found ${data.data.length} alerts`);
      results.passed++;
      results.tests.push({ endpoint: 'alerts', status: 'PASS', count: data.data.length });
    } else {
      console.log('❌ Test 10: alerts endpoint failed');
      results.failed++;
      results.tests.push({ endpoint: 'alerts', status: 'FAIL', error: data.error });
    }
  } catch (error) {
    console.log('❌ Test 10: Error calling alerts:', error.message);
    results.failed++;
    results.tests.push({ endpoint: 'alerts', status: 'FAIL', error: error.message });
  }

  return results;
}

// Run tests
testAPIEndpoints()
  .then(results => {
    console.log('\n📊 API Endpoints Test Summary:');
    console.log(`   Passed: ${results.passed}`);
    console.log(`   Failed: ${results.failed}`);
    console.log(`   Total:  ${results.passed + results.failed}\n`);

    process.exit(results.failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Fatal error running API tests:', error);
    console.error('   Make sure the server is running: npm run dev');
    process.exit(1);
  });
