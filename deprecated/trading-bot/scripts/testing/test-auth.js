/**
 * Authentication API Test Script
 * 
 * This script tests all the authentication endpoints for the AI Trading Bot Platform
 * using axios for HTTP requests and provides detailed output.
 */

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs').promises;

// Configuration
const API_URL = 'http://localhost:3001/api';
const OUTPUT_FILE = 'auth-test-results.json';

// Storage for tokens
let tokens = {
  accessToken: null,
  refreshToken: null
};

// Test results storage
const testResults = {
  registration: [],
  login: [],
  protectedRoutes: [],
  refreshToken: [],
  logout: []
};

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
    console.log(chalk.blue('\n===== TESTING USER REGISTRATION ====='));
    await testRegistration();
    
    console.log(chalk.blue('\n===== TESTING USER LOGIN ====='));
    await testLogin();
    
    console.log(chalk.blue('\n===== TESTING PROTECTED ROUTES ====='));
    await testProtectedRoutes();
    
    console.log(chalk.blue('\n===== TESTING TOKEN REFRESH ====='));
    await testRefreshToken();
    
    console.log(chalk.blue('\n===== TESTING LOGOUT ====='));
    await testLogout();
    
    console.log(chalk.blue('\n===== TEST SUMMARY ====='));
    console.log(chalk.blue('Registration Tests:'), testResults.registration.filter(t => t.passed).length + '/' + testResults.registration.length + ' passed');
    console.log(chalk.blue('Login Tests:'), testResults.login.filter(t => t.passed).length + '/' + testResults.login.length + ' passed');
    console.log(chalk.blue('Protected Route Tests:'), testResults.protectedRoutes.filter(t => t.passed).length + '/' + testResults.protectedRoutes.length + ' passed');
    console.log(chalk.blue('Refresh Token Tests:'), testResults.refreshToken.filter(t => t.passed).length + '/' + testResults.refreshToken.length + ' passed');
    console.log(chalk.blue('Logout Tests:'), testResults.logout.filter(t => t.passed).length + '/' + testResults.logout.length + ' passed');
    
    await saveTestResults();
  } catch (error) {
    console.error(chalk.red('Test execution error:'), error);
  }
}

/**
 * Test Registration Endpoints
 */
async function testRegistration() {
  // Test 1: Successful registration
  try {
    console.log(chalk.blue('\n[TEST]') + ' Registration with valid data');
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Password123',
      confirmPassword: 'Password123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    const passed = response.data.status === 'success';
    logTest('registration', 'Registration - Valid Data', passed, response);
    
    if (passed && response.data.data && response.data.data.tokens) {
      tokens.accessToken = response.data.data.tokens.accessToken;
      tokens.refreshToken = response.data.data.tokens.refreshToken;
    }
  } catch (error) {
    logTest('registration', 'Registration - Valid Data', false, error.response || error);
  }
  
  // Test 2: Registration with existing email
  try {
    console.log(chalk.blue('\n[TEST]') + ' Registration with existing email');
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: 'test@example.com',
      username: 'testuser2',
      password: 'Password123',
      confirmPassword: 'Password123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    // This should fail, so success would be a failure here
    logTest('registration', 'Registration - Duplicate Email', false, response);
  } catch (error) {
    const passed = error.response && error.response.data.status === 'error';
    logTest('registration', 'Registration - Duplicate Email', passed, error.response || error);
  }
  
  // Test 3: Registration with existing username
  try {
    console.log(chalk.blue('\n[TEST]') + ' Registration with existing username');
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: 'test2@example.com',
      username: 'testuser',
      password: 'Password123',
      confirmPassword: 'Password123',
      firstName: 'Test',
      lastName: 'User'
    });
    
    // This should fail, so success would be a failure here
    logTest('registration', 'Registration - Duplicate Username', false, response);
  } catch (error) {
    const passed = error.response && error.response.data.status === 'error';
    logTest('registration', 'Registration - Duplicate Username', passed, error.response || error);
  }
  
  // Test 4: Registration with invalid data (password mismatch)
  try {
    console.log(chalk.blue('\n[TEST]') + ' Registration with password mismatch');
    const response = await axios.post(`${API_URL}/auth/register`, {
      email: 'test3@example.com',
      username: 'testuser3',
      password: 'Password123',
      confirmPassword: 'Password1234',
      firstName: 'Test',
      lastName: 'User'
    });
    
    // This should fail, so success would be a failure here
    logTest('registration', 'Registration - Password Mismatch', false, response);
  } catch (error) {
    const passed = error.response && error.response.data.status === 'error';
    logTest('registration', 'Registration - Password Mismatch', passed, error.response || error);
  }
}

/**
 * Test Login Endpoints
 */
async function testLogin() {
  // Test 5: Login with email
  try {
    console.log(chalk.blue('\n[TEST]') + ' Login with email');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'Password123'
    });
    
    const passed = response.data.status === 'success';
    logTest('login', 'Login with Email', passed, response);
    
    if (passed && response.data.data && response.data.data.tokens) {
      tokens.accessToken = response.data.data.tokens.accessToken;
      tokens.refreshToken = response.data.data.tokens.refreshToken;
    }
  } catch (error) {
    logTest('login', 'Login with Email', false, error.response || error);
  }
  
  // Test 6: Login with username
  try {
    console.log(chalk.blue('\n[TEST]') + ' Login with username');
    const response = await axios.post(`${API_URL}/auth/login`, {
      username: 'testuser',
      password: 'Password123'
    });
    
    const passed = response.data.status === 'success';
    logTest('login', 'Login with Username', passed, response);
    
    if (passed && response.data.data && response.data.data.tokens) {
      tokens.accessToken = response.data.data.tokens.accessToken;
      tokens.refreshToken = response.data.data.tokens.refreshToken;
    }
  } catch (error) {
    logTest('login', 'Login with Username', false, error.response || error);
  }
  
  // Test 7: Login with invalid credentials
  try {
    console.log(chalk.blue('\n[TEST]') + ' Login with invalid credentials');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'WrongPassword123'
    });
    
    // This should fail, so success would be a failure here
    logTest('login', 'Login - Invalid Credentials', false, response);
  } catch (error) {
    const passed = error.response && error.response.data.status === 'error';
    logTest('login', 'Login - Invalid Credentials', passed, error.response || error);
  }
}

/**
 * Test Protected Routes
 */
async function testProtectedRoutes() {
  // Test 8: Access protected route with valid token
  try {
    console.log(chalk.blue('\n[TEST]') + ' Access protected route with valid token');
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`
      }
    });
    
    const passed = response.data.status === 'success';
    logTest('protectedRoutes', 'Protected Route - Valid Token', passed, response);
  } catch (error) {
    logTest('protectedRoutes', 'Protected Route - Valid Token', false, error.response || error);
  }
  
  // Test 9: Access protected route with invalid token
  try {
    console.log(chalk.blue('\n[TEST]') + ' Access protected route with invalid token');
    const response = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer invalid_token`
      }
    });
    
    // This should fail, so success would be a failure here
    logTest('protectedRoutes', 'Protected Route - Invalid Token', false, response);
  } catch (error) {
    const passed = error.response && error.response.data.status === 'error';
    logTest('protectedRoutes', 'Protected Route - Invalid Token', passed, error.response || error);
  }
  
  // Test 10: Access protected route without token
  try {
    console.log(chalk.blue('\n[TEST]') + ' Access protected route without token');
    const response = await axios.get(`${API_URL}/auth/me`);
    
    // This should fail, so success would be a failure here
    logTest('protectedRoutes', 'Protected Route - No Token', false, response);
  } catch (error) {
    const passed = error.response && error.response.data.status === 'error';
    logTest('protectedRoutes', 'Protected Route - No Token', passed, error.response || error);
  }
}

/**
 * Test Refresh Token
 */
async function testRefreshToken() {
  // Test 11: Refresh token with valid token
  try {
    console.log(chalk.blue('\n[TEST]') + ' Refresh token with valid refresh token');
    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
      refreshToken: tokens.refreshToken
    });
    
    const passed = response.data.status === 'success';
    logTest('refreshToken', 'Refresh Token - Valid', passed, response);
    
    if (passed && response.data.data) {
      tokens.accessToken = response.data.data.accessToken;
    }
  } catch (error) {
    logTest('refreshToken', 'Refresh Token - Valid', false, error.response || error);
  }
  
  // Test 12: Refresh token with invalid token
  try {
    console.log(chalk.blue('\n[TEST]') + ' Refresh token with invalid refresh token');
    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
      refreshToken: 'invalid_refresh_token'
    });
    
    // This should fail, so success would be a failure here
    logTest('refreshToken', 'Refresh Token - Invalid', false, response);
  } catch (error) {
    const passed = error.response && error.response.data.status === 'error';
    logTest('refreshToken', 'Refresh Token - Invalid', passed, error.response || error);
  }
}

/**
 * Test Logout
 */
async function testLogout() {
  // Test 13: Logout with valid refresh token
  try {
    console.log(chalk.blue('\n[TEST]') + ' Logout with valid refresh token');
    const response = await axios.post(`${API_URL}/auth/logout`, {
      refreshToken: tokens.refreshToken
    });
    
    const passed = response.data.status === 'success';
    logTest('logout', 'Logout - Valid Token', passed, response);
  } catch (error) {
    logTest('logout', 'Logout - Valid Token', false, error.response || error);
  }
  
  // Test 14: Try to use refresh token after logout
  try {
    console.log(chalk.blue('\n[TEST]') + ' Try to use refresh token after logout');
    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
      refreshToken: tokens.refreshToken
    });
    
    // This should fail, so success would be a failure here
    logTest('logout', 'Refresh After Logout', false, response);
  } catch (error) {
    const passed = error.response && error.response.data.status === 'error';
    logTest('logout', 'Refresh After Logout', passed, error.response || error);
  }
}

// Run tests
runTests();