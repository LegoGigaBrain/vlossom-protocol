/**
 * Vlossom Wallet Features Test Suite
 * Tests F1.2-F1.10 API endpoints
 *
 * Usage: node test-wallet-features.js [feature]
 * Examples:
 *   node test-wallet-features.js all       - Run all tests
 *   node test-wallet-features.js f1.6      - Test P2P Send only
 *   node test-wallet-features.js auth      - Test authentication only
 */

const API_URL = process.env.API_URL || 'http://localhost:3002';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test state
let authToken1 = null;
let authToken2 = null;
let user1 = null;
let user2 = null;
let wallet1 = null;
let wallet2 = null;

// Test results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✓' : status === 'FAIL' ? '✗' : '○';
  const color = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
  log(`  ${icon} ${name}${details ? ': ' + details : ''}`, color);

  results.tests.push({ name, status, details });
  if (status === 'PASS') results.passed++;
  else if (status === 'FAIL') results.failed++;
  else results.skipped++;
}

function logSection(title) {
  log(`\n${colors.bright}${title}${colors.reset}`, 'cyan');
  log('='.repeat(title.length), 'cyan');
}

async function apiCall(method, endpoint, data = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_URL}${endpoint}`, options);
  const responseData = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    data: responseData,
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test Suites

async function testAuth() {
  logSection('F1.2: Authentication System');

  // Test 1: Signup User 1
  try {
    const email1 = `test-user1-${Date.now()}@vlossom.com`;
    const password1 = 'TestPassword123!';

    const res = await apiCall('POST', '/api/auth/signup', {
      email: email1,
      password: password1,
      displayName: 'Test User 1',
      role: 'CUSTOMER',
    });

    if (res.ok && res.data.user) {
      user1 = res.data.user;
      authToken1 = res.data.token;
      logTest('Signup User 1', 'PASS', `Created user: ${user1.email}`);
    } else {
      logTest('Signup User 1', 'FAIL', res.data.error?.message || 'Unknown error');
      return false;
    }
  } catch (err) {
    logTest('Signup User 1', 'FAIL', err.message);
    return false;
  }

  // Test 2: Signup User 2 (for P2P testing)
  try {
    const email2 = `test-user2-${Date.now()}@vlossom.com`;
    const password2 = 'TestPassword123!';

    const res = await apiCall('POST', '/api/auth/signup', {
      email: email2,
      password: password2,
      displayName: 'Test User 2',
      role: 'CUSTOMER',
    });

    if (res.ok && res.data.user) {
      user2 = res.data.user;
      authToken2 = res.data.token;
      logTest('Signup User 2', 'PASS', `Created user: ${user2.email}`);
    } else {
      logTest('Signup User 2', 'FAIL', res.data.error?.message || 'Unknown error');
      return false;
    }
  } catch (err) {
    logTest('Signup User 2', 'FAIL', err.message);
    return false;
  }

  // Test 3: Login User 1
  try {
    const res = await apiCall('POST', '/api/auth/login', {
      email: user1.email,
      password: 'TestPassword123!',
    });

    if (res.ok && res.data.token) {
      authToken1 = res.data.token;
      logTest('Login User 1', 'PASS', 'JWT token received');
    } else {
      logTest('Login User 1', 'FAIL', res.data.error?.message || 'No token');
      return false;
    }
  } catch (err) {
    logTest('Login User 1', 'FAIL', err.message);
    return false;
  }

  // Test 4: Get Current User
  try {
    const res = await apiCall('GET', '/api/auth/me', null, authToken1);

    if (res.ok && res.data.user) {
      logTest('Get Current User', 'PASS', `Authenticated as: ${res.data.user.email}`);
    } else {
      logTest('Get Current User', 'FAIL', res.data.error?.message || 'No user data');
      return false;
    }
  } catch (err) {
    logTest('Get Current User', 'FAIL', err.message);
    return false;
  }

  return true;
}

async function testWalletCreation() {
  logSection('F1.3: AA Wallet Creation');

  // Test 1: Get Wallet for User 1
  try {
    const res = await apiCall('GET', '/api/wallet', null, authToken1);

    if (res.ok && res.data.address) {
      wallet1 = res.data;
      logTest('Get Wallet User 1', 'PASS', `Address: ${wallet1.address.slice(0, 10)}...`);
      logTest('Wallet is Counterfactual', wallet1.isDeployed ? 'FAIL' : 'PASS',
        `isDeployed: ${wallet1.isDeployed}`);
    } else {
      logTest('Get Wallet User 1', 'FAIL', res.data.error?.message || 'No wallet data');
      return false;
    }
  } catch (err) {
    logTest('Get Wallet User 1', 'FAIL', err.message);
    return false;
  }

  // Test 2: Get Wallet for User 2
  try {
    const res = await apiCall('GET', '/api/wallet', null, authToken2);

    if (res.ok && res.data.address) {
      wallet2 = res.data;
      logTest('Get Wallet User 2', 'PASS', `Address: ${wallet2.address.slice(0, 10)}...`);
    } else {
      logTest('Get Wallet User 2', 'FAIL', res.data.error?.message || 'No wallet data');
      return false;
    }
  } catch (err) {
    logTest('Get Wallet User 2', 'FAIL', err.message);
    return false;
  }

  return true;
}

async function testBalanceDisplay() {
  logSection('F1.4: Wallet Balance Display');

  try {
    const res = await apiCall('GET', '/api/wallet', null, authToken1);

    if (res.ok && res.data.balance) {
      const balance = res.data.balance;
      logTest('Get Balance', 'PASS', `${balance.usdcFormatted} USDC (≈ $${balance.fiatValue})`);
      logTest('Balance Format', balance.usdc && balance.usdcFormatted !== undefined ? 'PASS' : 'FAIL',
        'Contains usdc and usdcFormatted fields');
    } else {
      logTest('Get Balance', 'FAIL', res.data.error?.message || 'No balance data');
      return false;
    }
  } catch (err) {
    logTest('Get Balance', 'FAIL', err.message);
    return false;
  }

  return true;
}

async function testFaucet() {
  logSection('F1.5: MockUSDC Faucet');

  // Test 1: Claim Faucet for User 1
  try {
    const res = await apiCall('POST', '/api/wallet/faucet', null, authToken1);

    if (res.ok && res.data.txHash) {
      logTest('Claim Faucet User 1', 'PASS', `TxHash: ${res.data.txHash.slice(0, 10)}...`);
      logTest('Faucet Amount', res.data.amountFormatted === '1000.00' ? 'PASS' : 'FAIL',
        `Amount: ${res.data.amountFormatted} USDC`);
    } else {
      logTest('Claim Faucet User 1', 'FAIL', res.data.error?.message || 'Failed to claim');
      return false;
    }
  } catch (err) {
    logTest('Claim Faucet User 1', 'FAIL', err.message);
    return false;
  }

  // Wait for balance to update
  await sleep(2000);

  // Test 2: Verify Balance Updated
  try {
    const res = await apiCall('GET', '/api/wallet', null, authToken1);

    if (res.ok && res.data.balance) {
      const balance = parseFloat(res.data.balance.usdcFormatted);
      logTest('Balance Updated', balance >= 1000 ? 'PASS' : 'FAIL',
        `New balance: ${balance} USDC`);
    } else {
      logTest('Balance Updated', 'FAIL', 'Could not fetch updated balance');
    }
  } catch (err) {
    logTest('Balance Updated', 'FAIL', err.message);
  }

  // Test 3: Claim Faucet for User 2
  try {
    const res = await apiCall('POST', '/api/wallet/faucet', null, authToken2);

    if (res.ok && res.data.txHash) {
      logTest('Claim Faucet User 2', 'PASS', `TxHash: ${res.data.txHash.slice(0, 10)}...`);
    } else {
      logTest('Claim Faucet User 2', 'FAIL', res.data.error?.message || 'Failed to claim');
      return false;
    }
  } catch (err) {
    logTest('Claim Faucet User 2', 'FAIL', err.message);
    return false;
  }

  await sleep(2000);

  // Test 4: Rate Limiting (should fail)
  try {
    const res = await apiCall('POST', '/api/wallet/faucet', null, authToken1);

    if (!res.ok && res.data.error?.message.includes('Rate limit')) {
      logTest('Rate Limiting Works', 'PASS', 'Correctly rejected second claim');
    } else {
      logTest('Rate Limiting Works', 'FAIL', 'Should have been rate limited');
    }
  } catch (err) {
    logTest('Rate Limiting Works', 'FAIL', err.message);
  }

  return true;
}

async function testP2PSend() {
  logSection('F1.6: P2P Send');

  if (!wallet2) {
    logTest('P2P Send', 'SKIP', 'User 2 wallet not available');
    return false;
  }

  // Test 1: Get Initial Balances
  let initialBalance1, initialBalance2;
  try {
    const res1 = await apiCall('GET', '/api/wallet', null, authToken1);
    const res2 = await apiCall('GET', '/api/wallet', null, authToken2);

    if (res1.ok && res2.ok) {
      initialBalance1 = parseFloat(res1.data.balance.usdcFormatted);
      initialBalance2 = parseFloat(res2.data.balance.usdcFormatted);
      logTest('Get Initial Balances', 'PASS',
        `User1: ${initialBalance1} USDC, User2: ${initialBalance2} USDC`);
    } else {
      logTest('Get Initial Balances', 'FAIL', 'Could not fetch balances');
      return false;
    }
  } catch (err) {
    logTest('Get Initial Balances', 'FAIL', err.message);
    return false;
  }

  // Test 2: Send 10 USDC from User 1 to User 2
  const sendAmount = '10000000'; // 10 USDC in raw units (6 decimals)
  try {
    const res = await apiCall('POST', '/api/wallet/transfer', {
      toAddress: wallet2.address,
      amount: sendAmount,
      memo: 'Test P2P transfer',
    }, authToken1);

    if (res.ok && res.data.txHash) {
      logTest('Send 10 USDC', 'PASS', `TxHash: ${res.data.txHash.slice(0, 10)}...`);
      logTest('Transaction ID', res.data.transactionId ? 'PASS' : 'FAIL',
        `ID: ${res.data.transactionId || 'missing'}`);
    } else {
      logTest('Send 10 USDC', 'FAIL', res.data.error?.message || 'Transfer failed');
      return false;
    }
  } catch (err) {
    logTest('Send 10 USDC', 'FAIL', err.message);
    return false;
  }

  // Wait for transaction to settle
  await sleep(3000);

  // Test 3: Verify Balances Updated
  try {
    const res1 = await apiCall('GET', '/api/wallet', null, authToken1);
    const res2 = await apiCall('GET', '/api/wallet', null, authToken2);

    if (res1.ok && res2.ok) {
      const finalBalance1 = parseFloat(res1.data.balance.usdcFormatted);
      const finalBalance2 = parseFloat(res2.data.balance.usdcFormatted);

      const user1Decreased = (initialBalance1 - finalBalance1).toFixed(2);
      const user2Increased = (finalBalance2 - initialBalance2).toFixed(2);

      logTest('Sender Balance Decreased', user1Decreased === '10.00' ? 'PASS' : 'FAIL',
        `Decreased by ${user1Decreased} USDC (expected 10.00)`);
      logTest('Recipient Balance Increased', user2Increased === '10.00' ? 'PASS' : 'FAIL',
        `Increased by ${user2Increased} USDC (expected 10.00)`);
    } else {
      logTest('Verify Balances Updated', 'FAIL', 'Could not fetch final balances');
    }
  } catch (err) {
    logTest('Verify Balances Updated', 'FAIL', err.message);
  }

  // Test 4: Insufficient Balance (should fail)
  try {
    const res = await apiCall('POST', '/api/wallet/transfer', {
      toAddress: wallet2.address,
      amount: '999999999999999', // Huge amount
      memo: 'This should fail',
    }, authToken1);

    if (!res.ok && res.data.error?.code === 'INSUFFICIENT_BALANCE') {
      logTest('Insufficient Balance Check', 'PASS', 'Correctly rejected overdraft');
    } else {
      logTest('Insufficient Balance Check', 'FAIL', 'Should have been rejected');
    }
  } catch (err) {
    logTest('Insufficient Balance Check', 'FAIL', err.message);
  }

  // Test 5: Invalid Address (should fail)
  try {
    const res = await apiCall('POST', '/api/wallet/transfer', {
      toAddress: '0x123invalid',
      amount: '1000000',
      memo: 'Invalid address',
    }, authToken1);

    if (!res.ok && res.data.error?.code === 'VALIDATION_ERROR') {
      logTest('Invalid Address Check', 'PASS', 'Correctly rejected invalid address');
    } else {
      logTest('Invalid Address Check', 'FAIL', 'Should have been rejected');
    }
  } catch (err) {
    logTest('Invalid Address Check', 'FAIL', err.message);
  }

  return true;
}

async function testTransactionHistory() {
  logSection('F1.8: Transaction History');

  try {
    const res = await apiCall('GET', '/api/wallet/transactions?page=1&limit=20', null, authToken1);

    if (res.ok && res.data.transactions) {
      const txs = res.data.transactions;
      logTest('Get Transaction History', 'PASS', `Found ${txs.length} transactions`);

      if (txs.length > 0) {
        const sendTx = txs.find(tx => tx.type === 'SEND');
        const faucetTx = txs.find(tx => tx.type === 'FAUCET_CLAIM');

        logTest('SEND Transaction Found', sendTx ? 'PASS' : 'FAIL',
          sendTx ? `Amount: ${sendTx.amount}` : 'Not found');
        logTest('FAUCET_CLAIM Transaction Found', faucetTx ? 'PASS' : 'FAIL',
          faucetTx ? `Amount: ${faucetTx.amount}` : 'Not found');
      }

      logTest('Pagination Info', res.data.pagination ? 'PASS' : 'FAIL',
        res.data.pagination ? `Page ${res.data.pagination.page}, Total: ${res.data.pagination.total}` : 'Missing');
    } else {
      logTest('Get Transaction History', 'FAIL', res.data.error?.message || 'No data');
      return false;
    }
  } catch (err) {
    logTest('Get Transaction History', 'FAIL', err.message);
    return false;
  }

  return true;
}

// Main test runner
async function runTests(featureFilter = 'all') {
  log('\n' + '='.repeat(60), 'bright');
  log('  VLOSSOM WALLET FEATURES TEST SUITE', 'bright');
  log('='.repeat(60) + '\n', 'bright');
  log(`API URL: ${API_URL}`, 'cyan');
  log(`Filter: ${featureFilter}\n`, 'cyan');

  const shouldRun = (feature) => {
    if (featureFilter === 'all') return true;
    return feature.toLowerCase() === featureFilter.toLowerCase();
  };

  try {
    // Always run auth first as it's a dependency
    if (shouldRun('all') || shouldRun('auth') || shouldRun('f1.2')) {
      await testAuth();
    }

    if (shouldRun('all') || shouldRun('wallet') || shouldRun('f1.3')) {
      await testWalletCreation();
    }

    if (shouldRun('all') || shouldRun('balance') || shouldRun('f1.4')) {
      await testBalanceDisplay();
    }

    if (shouldRun('all') || shouldRun('faucet') || shouldRun('f1.5')) {
      await testFaucet();
    }

    if (shouldRun('all') || shouldRun('send') || shouldRun('f1.6')) {
      await testP2PSend();
    }

    if (shouldRun('all') || shouldRun('history') || shouldRun('f1.8')) {
      await testTransactionHistory();
    }

    // Print summary
    log('\n' + '='.repeat(60), 'bright');
    log('  TEST SUMMARY', 'bright');
    log('='.repeat(60), 'bright');
    log(`✓ Passed: ${results.passed}`, 'green');
    log(`✗ Failed: ${results.failed}`, 'red');
    log(`○ Skipped: ${results.skipped}`, 'yellow');
    log(`Total: ${results.tests.length}\n`, 'cyan');

    if (results.failed > 0) {
      log('Failed Tests:', 'red');
      results.tests
        .filter(t => t.status === 'FAIL')
        .forEach(t => log(`  - ${t.name}: ${t.details}`, 'red'));
      process.exit(1);
    } else {
      log('🎉 All tests passed!', 'green');
      process.exit(0);
    }
  } catch (err) {
    log(`\n❌ Test suite error: ${err.message}`, 'red');
    console.error(err);
    process.exit(1);
  }
}

// Run tests
const featureArg = process.argv[2] || 'all';
runTests(featureArg);
