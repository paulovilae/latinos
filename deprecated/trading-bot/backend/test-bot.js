/**
 * Bot Microservice API Test Script
 * 
 * This script tests all the bot microservice endpoints for the AI Trading Bot Platform
 * using axios for HTTP requests and provides detailed output.
 */

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs').promises;

// Configuration
const API_URL = 'http://localhost:3001/api';
const OUTPUT_FILE = 'bot-test-results.json';

// Storage for tokens
let accessToken = null;

// Test results storage
const testResults = {
  formulas: [],
  trades: [],
  system: []
};

// Test data for formula
const testFormula = {
  name: "Test Trading Bot",
  symbol: "BTC",
  exchange: "USD",
  interval: "1h",
  parameters: {
    strategy: "MOVING_AVERAGE_CROSSOVER",
    investmentAmount: 1000,
    riskLevel: "medium"
  },
  is_active: false
};

// Storage for created formula ID
let createdFormulaId = null;

/**
 * Utility function to log test results
 */
function logTest(category, testName, passed, response) {
  const result = {
    test: testName,
    passed,
    timestamp: new Date().toISOString(),
    response: response.data || response
  };
  
  testResults[category].push(result);
  
  if (passed) {
    console.log(chalk.blue(`[${testName}]`) + ' - ' + chalk.green('PASSED'));
  } else {
    console.log(chalk.blue(`[${testName}]`) + ' - ' + chalk.red('FAILED'));
    console.log(chalk.yellow('Response:'), JSON.stringify(response.data || response, null, 2));
  }
  
  console.log('--------------------------------------------------------');
  return result;
}

/**
 * Save test results to file
 */
async function saveTestResults() {
  try {
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(testResults, null, 2));
    console.log(chalk.blue(`\nTest results saved to ${OUTPUT_FILE}`));
  } catch (error) {
    console.error(chalk.red('Error saving test results:'), error);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  try {
    // First authenticate to get a token
    console.log(chalk.blue('\n===== AUTHENTICATING FOR BOT API TESTS ====='));
    await authenticate();
    
    console.log(chalk.blue('\n===== TESTING FORMULA ENDPOINTS ====='));
    await testFormulaEndpoints();
    
    console.log(chalk.blue('\n===== TESTING TRADE ENDPOINTS ====='));
    await testTradeEndpoints();
    
    console.log(chalk.blue('\n===== TESTING SYSTEM ENDPOINTS ====='));
    await testSystemEndpoints();
    
    console.log(chalk.blue('\n===== TEST SUMMARY ====='));
    console.log(chalk.blue('Formula Tests:'), testResults.formulas.filter(t => t.passed).length + '/' + testResults.formulas.length + ' passed');
    console.log(chalk.blue('Trade Tests:'), testResults.trades.filter(t => t.passed).length + '/' + testResults.trades.length + ' passed');
    console.log(chalk.blue('System Tests:'), testResults.system.filter(t => t.passed).length + '/' + testResults.system.length + ' passed');
    
    await saveTestResults();
  } catch (error) {
    console.error(chalk.red('Test execution error:'), error);
  }
}

/**
 * Authenticate to get a valid token
 */
async function authenticate() {
  try {
    console.log(chalk.blue('\n[TEST]') + ' Authentication');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'Password123'
    });
    
    if (response.data.status === 'success' && response.data.data && response.data.data.tokens) {
      accessToken = response.data.data.tokens.accessToken;
      console.log(chalk.green('Successfully authenticated for bot API tests'));
    } else {
      console.log(chalk.red('Failed to authenticate. Check credentials or create a test user.'));
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red('Authentication error:'), error.response ? error.response.data : error.message);
    process.exit(1);
  }
}

/**
 * Test Formula Endpoints
 */
async function testFormulaEndpoints() {
  // Test 1: Get all formulas (empty list initially)
  try {
    console.log(chalk.blue('\n[TEST]') + ' Get all formulas');
    const response = await axios.get(`${API_URL}/bot/formulas`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const passed = response.data.status === 'success';
    logTest('formulas', 'Get All Formulas', passed, response);
  } catch (error) {
    logTest('formulas', 'Get All Formulas', false, error.response || error);
  }
  
  // Test 2: Create a new formula
  try {
    console.log(chalk.blue('\n[TEST]') + ' Create formula');
    const response = await axios.post(`${API_URL}/bot/formulas`, testFormula, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const passed = response.data.status === 'success';
    logTest('formulas', 'Create Formula', passed, response);
    
    if (passed && response.data.data) {
      createdFormulaId = response.data.data.id;
    }
  } catch (error) {
    logTest('formulas', 'Create Formula', false, error.response || error);
  }
  
  // Test 3: Get formula by ID
  try {
    console.log(chalk.blue('\n[TEST]') + ' Get formula by ID');
    
    if (!createdFormulaId) {
      throw new Error('No formula ID available. Create formula test failed.');
    }
    
    const response = await axios.get(`${API_URL}/bot/formulas/${createdFormulaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const passed = response.data.status === 'success';
    logTest('formulas', 'Get Formula By ID', passed, response);
  } catch (error) {
    logTest('formulas', 'Get Formula By ID', false, error.response || error);
  }
  
  // Test 4: Update formula
  try {
    console.log(chalk.blue('\n[TEST]') + ' Update formula');
    
    if (!createdFormulaId) {
      throw new Error('No formula ID available. Create formula test failed.');
    }
    
    const response = await axios.put(`${API_URL}/bot/formulas/${createdFormulaId}`, {
      name: "Updated Test Bot",
      parameters: {
        investmentAmount: 2000
      }
    }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const passed = response.data.status === 'success';
    logTest('formulas', 'Update Formula', passed, response);
  } catch (error) {
    logTest('formulas', 'Update Formula', false, error.response || error);
  }
  
  // Test 5: Get formula with invalid ID
  try {
    console.log(chalk.blue('\n[TEST]') + ' Get formula with invalid ID');
    const response = await axios.get(`${API_URL}/bot/formulas/invalid-id`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    // This should fail, so success would be a failure here
    logTest('formulas', 'Get Formula - Invalid ID', false, response);
  } catch (error) {
    const passed = error.response && error.response.data.status === 'error';
    logTest('formulas', 'Get Formula - Invalid ID', passed, error.response || error);
  }
  
  // Test 6: Delete formula
  try {
    console.log(chalk.blue('\n[TEST]') + ' Delete formula');
    
    if (!createdFormulaId) {
      throw new Error('No formula ID available. Create formula test failed.');
    }
    
    const response = await axios.delete(`${API_URL}/bot/formulas/${createdFormulaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const passed = response.data.status === 'success';
    logTest('formulas', 'Delete Formula', passed, response);
  } catch (error) {
    logTest('formulas', 'Delete Formula', false, error.response || error);
  }
}

/**
 * Test Trade Endpoints
 */
async function testTradeEndpoints() {
  // Test 7: Get all trades
  try {
    console.log(chalk.blue('\n[TEST]') + ' Get all trades');
    const response = await axios.get(`${API_URL}/bot/trades`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const passed = response.data.status === 'success';
    logTest('trades', 'Get All Trades', passed, response);
  } catch (error) {
    logTest('trades', 'Get All Trades', false, error.response || error);
  }
  
  // Test 8: Get current trades
  try {
    console.log(chalk.blue('\n[TEST]') + ' Get current trades');
    const response = await axios.get(`${API_URL}/bot/trades/current`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const passed = response.data.status === 'success';
    logTest('trades', 'Get Current Trades', passed, response);
  } catch (error) {
    logTest('trades', 'Get Current Trades', false, error.response || error);
  }
  
  // Test 9: Get performance metrics
  try {
    console.log(chalk.blue('\n[TEST]') + ' Get performance metrics');
    const response = await axios.get(`${API_URL}/bot/trades/performance`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const passed = response.data.status === 'success';
    logTest('trades', 'Get Performance Metrics', passed, response);
  } catch (error) {
    logTest('trades', 'Get Performance Metrics', false, error.response || error);
  }
  
  // Test 10: Get trades with filters
  try {
    console.log(chalk.blue('\n[TEST]') + ' Get trades with filters');
    const response = await axios.get(`${API_URL}/bot/trades`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        symbol: 'BTC',
        status: 'filled',
        page: 1,
        limit: 5
      }
    });
    
    const passed = response.data.status === 'success';
    logTest('trades', 'Get Trades With Filters', passed, response);
  } catch (error) {
    logTest('trades', 'Get Trades With Filters', false, error.response || error);
  }
}

/**
 * Test System Endpoints
 */
async function testSystemEndpoints() {
  // Test 11: Get system status
  try {
    console.log(chalk.blue('\n[TEST]') + ' Get system status');
    const response = await axios.get(`${API_URL}/bot/system/status`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const passed = response.data.status === 'success';
    logTest('system', 'Get System Status', passed, response);
  } catch (error) {
    logTest('system', 'Get System Status', false, error.response || error);
  }
  
  // Test 12: Start system
  try {
    console.log(chalk.blue('\n[TEST]') + ' Start system');
    const response = await axios.post(`${API_URL}/bot/system/start`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const passed = response.data.status === 'success';
    logTest('system', 'Start System', passed, response);
  } catch (error) {
    logTest('system', 'Start System', false, error.response || error);
  }
  
  // Test 13: Stop system
  try {
    console.log(chalk.blue('\n[TEST]') + ' Stop system');
    const response = await axios.post(`${API_URL}/bot/system/stop`, {}, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const passed = response.data.status === 'success';
    logTest('system', 'Stop System', passed, response);
  } catch (error) {
    logTest('system', 'Stop System', false, error.response || error);
  }
  
  // Test 14: Access system endpoint without authentication
  try {
    console.log(chalk.blue('\n[TEST]') + ' Access system endpoint without authentication');
    const response = await axios.get(`${API_URL}/bot/system/status`);
    
    // This should fail, so success would be a failure here
    logTest('system', 'System Access - No Auth', false, response);
  } catch (error) {
    const passed = error.response && error.response.data.status === 'error';
    logTest('system', 'System Access - No Auth', passed, error.response || error);
  }
}

// Run tests
runTests();