/**
 * Comprehensive Startup System Test
 * This script tests all aspects of the unified startup system
 */

const { spawn, exec } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Configuration for testing
const TEST_CONFIG = {
  logDir: './test-logs',
  timeouts: {
    startup: 60000,    // 60 seconds max for startup
    health: 10000,     // 10 seconds for health checks
    shutdown: 15000    // 15 seconds for shutdown
  },
  expectedPorts: {
    frontend: 5173,
    backend: null,     // Dynamic, will be detected
    bot: 5555
  },
  endpoints: {
    frontend: 'http://localhost:5173',
    backend: null,     // Will be set dynamically once port is detected
    bot: 'http://localhost:5555/api/health'
  }
};

// Create log directory if it doesn't exist
if (!fs.existsSync(TEST_CONFIG.logDir)) {
  fs.mkdirSync(TEST_CONFIG.logDir, { recursive: true });
}

// Test result storage
const testResults = {
  startupSequence: {
    success: false,
    duration: 0,
    details: []
  },
  healthChecking: {
    success: false,
    details: []
  },
  errorHandling: {
    success: false,
    details: []
  },
  crossPlatform: {
    success: false,
    details: []
  },
  shutdown: {
    success: false,
    duration: 0,
    details: []
  },
  configManagement: {
    success: false,
    details: []
  }
};

// Utility functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const coloredMessage = type === 'info' 
    ? `\x1b[36m${message}\x1b[0m` 
    : type === 'success' 
      ? `\x1b[32m${message}\x1b[0m` 
      : type === 'error' 
        ? `\x1b[31m${message}\x1b[0m` 
        : `\x1b[33m${message}\x1b[0m`;
  
  console.log(`[${timestamp}] ${coloredMessage}`);
  
  // Log to file
  const logFile = path.join(TEST_CONFIG.logDir, 'test-results.log');
  fs.appendFileSync(logFile, `[${timestamp}] [${type.toUpperCase()}] ${message}\n`);
}

function checkHealth(url, timeout = TEST_CONFIG.timeouts.health) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, { timeout }, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        reject(new Error(`Health check failed with status ${res.statusCode}`));
      }
    });
    
    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Health check timed out')));
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function captureProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';
    
    log(`Executing: ${command} ${args.join(' ')}`);
    const proc = spawn(command, args, {
      ...options,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    proc.stdout.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      process.stdout.write(text);
    });
    
    proc.stderr.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      process.stderr.write(text);
    });
    
    proc.on('error', (error) => {
      reject(new Error(`Process error: ${error.message}`));
    });
    
    proc.on('close', (code) => {
      const duration = Date.now() - startTime;
      const result = {
        code,
        stdout,
        stderr,
        duration
      };
      
      if (code === 0) {
        resolve(result);
      } else {
        reject(Object.assign(
          new Error(`Process exited with code ${code}`),
          { result }
        ));
      }
    });
    
    // Allow killing the process from outside
    resolve({ process: proc, promise: new Promise((res) => proc.on('close', () => res())) });
  });
}

// Main test functions
async function testStartupSequence() {
  log('Testing startup sequence...', 'info');
  
  try {
    const startTime = Date.now();
    
    // Start the platform
    const { process: platformProcess, promise } = await captureProcess('node', ['orchestrator.js'], {
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    // Wait for startup messages
    let botStarted = false;
    let backendStarted = false;
    let frontendStarted = false;
    let allHealthy = false;
    
    const outputHandler = (data) => {
      const text = data.toString();
      
      if (text.includes('bot service started successfully')) {
        botStarted = true;
        testResults.startupSequence.details.push('Bot microservice started');
      }
      
      if (text.includes('backend service started successfully')) {
        backendStarted = true;
        testResults.startupSequence.details.push('Backend started');
        
        // Extract backend port
        const portMatch = text.match(/backend.*available at: http:\/\/localhost:(\d+)/);
        if (portMatch && portMatch[1]) {
          const backendPort = parseInt(portMatch[1], 10);
          TEST_CONFIG.expectedPorts.backend = backendPort;
          TEST_CONFIG.endpoints.backend = `http://localhost:${backendPort}/api/health`;
          testResults.startupSequence.details.push(`Backend running on port ${backendPort}`);
          log(`Backend endpoint set to: ${TEST_CONFIG.endpoints.backend}`, 'info');
        }
      }
      
      if (text.includes('frontend service started successfully')) {
        frontendStarted = true;
        testResults.startupSequence.details.push('Frontend started');
      }
      
      if (text.includes('Platform started successfully')) {
        allHealthy = true;
        testResults.startupSequence.details.push('All services healthy');
      }
    };
    
    platformProcess.stdout.on('data', outputHandler);
    platformProcess.stderr.on('data', outputHandler);
    
    // Wait for startup to complete or timeout
    const MAX_WAIT = TEST_CONFIG.timeouts.startup;
    const POLL_INTERVAL = 1000;
    let elapsed = 0;
    
    while (elapsed < MAX_WAIT && !allHealthy) {
      await wait(POLL_INTERVAL);
      elapsed += POLL_INTERVAL;
      
      if (allHealthy) break;
    }
    
    const duration = Date.now() - startTime;
    testResults.startupSequence.duration = duration;
    
    if (allHealthy) {
      log(`Startup completed successfully in ${duration}ms`, 'success');
      testResults.startupSequence.success = true;
    } else {
      log('Startup did not complete within timeout', 'error');
      testResults.startupSequence.details.push(`Timed out after ${MAX_WAIT}ms`);
      testResults.startupSequence.details.push(`Bot started: ${botStarted}`);
      testResults.startupSequence.details.push(`Backend started: ${backendStarted}`);
      testResults.startupSequence.details.push(`Frontend started: ${frontendStarted}`);
    }
    
    // Keep track of the process for later tests
    return { platformProcess, promise };
  } catch (error) {
    log(`Startup sequence failed: ${error.message}`, 'error');
    testResults.startupSequence.details.push(`Error: ${error.message}`);
    throw error;
  }
}

async function testHealthChecking(platformProcess) {
  log('Testing health checking...', 'info');
  
  try {
    // Wait a moment for services to fully initialize
    await wait(2000);
    
    // Check health of each service
    const results = [];
    
    // Bot health check
    try {
      const botHealthy = await checkHealth(TEST_CONFIG.endpoints.bot);
      results.push({ service: 'bot', healthy: botHealthy });
      testResults.healthChecking.details.push('Bot health check passed');
      log('Bot health check passed', 'success');
    } catch (error) {
      results.push({ service: 'bot', healthy: false, error: error.message });
      testResults.healthChecking.details.push(`Bot health check failed: ${error.message}`);
      log(`Bot health check failed: ${error.message}`, 'error');
    }
    
    // Backend health check
    try {
      const backendHealthy = await checkHealth(TEST_CONFIG.endpoints.backend);
      results.push({ service: 'backend', healthy: backendHealthy });
      testResults.healthChecking.details.push('Backend health check passed');
      log('Backend health check passed', 'success');
    } catch (error) {
      results.push({ service: 'backend', healthy: false, error: error.message });
      testResults.healthChecking.details.push(`Backend health check failed: ${error.message}`);
      log(`Backend health check failed: ${error.message}`, 'error');
    }
    
    // Frontend health check
    try {
      const frontendHealthy = await checkHealth(TEST_CONFIG.endpoints.frontend);
      results.push({ service: 'frontend', healthy: frontendHealthy });
      testResults.healthChecking.details.push('Frontend health check passed');
      log('Frontend health check passed', 'success');
    } catch (error) {
      results.push({ service: 'frontend', healthy: false, error: error.message });
      testResults.healthChecking.details.push(`Frontend health check failed: ${error.message}`);
      log(`Frontend health check failed: ${error.message}`, 'error');
    }
    
    // Overall health status
    const allHealthy = results.every(r => r.healthy);
    testResults.healthChecking.success = allHealthy;
    
    if (allHealthy) {
      log('All health checks passed', 'success');
    } else {
      log('Some health checks failed', 'error');
    }
    
    return results;
  } catch (error) {
    log(`Health checking failed: ${error.message}`, 'error');
    testResults.healthChecking.details.push(`Error: ${error.message}`);
    throw error;
  }
}

async function testErrorHandling(platformProcess) {
  log('Testing error handling...', 'info');
  
  try {
    // Test 1: Try to start on ports that are already in use
    log('Testing port conflict handling...', 'info');
    
    const conflictProcess = await captureProcess('node', ['orchestrator.js'], {
      env: { 
        ...process.env, 
        NODE_ENV: 'development',
        // Use same ports to force conflict
        FRONTEND_PORT: TEST_CONFIG.expectedPorts.frontend,
        BOT_PORT: TEST_CONFIG.expectedPorts.bot,
        BACKEND_PORT: TEST_CONFIG.expectedPorts.backend
      }
    }).catch(error => ({ error }));
    
    if (conflictProcess.error) {
      // Expected error due to port conflict
      testResults.errorHandling.details.push('Port conflict handled correctly');
      log('Port conflict handling test passed', 'success');
    } else {
      testResults.errorHandling.details.push('Port conflict not detected properly');
      log('Port conflict handling test failed - no error detected', 'error');
    }
    
    // Test 2: Simulate a failed health check
    // We'll use an invalid health endpoint
    log('Testing health check failure handling...', 'info');
    
    const badHealthCheck = await checkHealth('http://localhost:9999/non-existent')
      .then(() => false)  // Should not succeed
      .catch(() => true); // Should throw error
    
    if (badHealthCheck) {
      testResults.errorHandling.details.push('Health check failure handled correctly');
      log('Health check failure handling test passed', 'success');
    } else {
      testResults.errorHandling.details.push('Health check failure not detected properly');
      log('Health check failure handling test failed', 'error');
    }
    
    // Overall error handling assessment
    testResults.errorHandling.success = 
      testResults.errorHandling.details.filter(d => d.includes('handled correctly')).length >= 2;
    
    if (testResults.errorHandling.success) {
      log('Error handling tests passed', 'success');
    } else {
      log('Some error handling tests failed', 'error');
    }
    
    return testResults.errorHandling;
  } catch (error) {
    log(`Error handling tests failed: ${error.message}`, 'error');
    testResults.errorHandling.details.push(`Unexpected error: ${error.message}`);
    return testResults.errorHandling;
  }
}

async function testCrossPlatform() {
  log('Testing cross-platform compatibility...', 'info');
  
  // Detect current platform
  const isWindows = process.platform === 'win32';
  const platform = isWindows ? 'Windows' : 'Unix-like';
  
  log(`Current platform: ${platform}`, 'info');
  testResults.crossPlatform.details.push(`Testing on ${platform} platform`);
  
  try {
    // Test platform-specific script
    const scriptName = isWindows ? 'start-platform.bat' : './start-platform.sh';
    
    log(`Testing platform script: ${scriptName}`, 'info');
    
    // Make sure Unix scripts are executable
    if (!isWindows) {
      try {
        await new Promise((resolve, reject) => {
          exec('chmod +x ./start-platform.sh ./stop-platform.sh', (error, stdout, stderr) => {
            if (error) reject(error);
            else resolve();
          });
        });
        testResults.crossPlatform.details.push('Made Unix scripts executable');
      } catch (error) {
        log(`Failed to make scripts executable: ${error.message}`, 'error');
        testResults.crossPlatform.details.push(`Failed to make scripts executable: ${error.message}`);
      }
    }
    
    // Start the platform using the platform-specific script
    const platformScript = await captureProcess(isWindows ? scriptName : 'bash', 
      isWindows ? [] : [scriptName, '--stop'], { shell: true })
      .catch(error => ({ error }));
    
    if (!platformScript.error) {
      testResults.crossPlatform.details.push(`Platform script ${scriptName} executed successfully`);
      log(`Platform script test passed`, 'success');
      testResults.crossPlatform.success = true;
    } else {
      testResults.crossPlatform.details.push(`Platform script execution failed: ${platformScript.error.message}`);
      log(`Platform script test failed: ${platformScript.error.message}`, 'error');
    }
    
    return testResults.crossPlatform;
  } catch (error) {
    log(`Cross-platform testing failed: ${error.message}`, 'error');
    testResults.crossPlatform.details.push(`Error: ${error.message}`);
    return testResults.crossPlatform;
  }
}

async function testShutdown(platformProcess) {
  log('Testing shutdown process...', 'info');
  
  try {
    const startTime = Date.now();
    
    // Execute stop command
    log('Executing stop command...', 'info');
    
    // Use platform-specific stop script
    const isWindows = process.platform === 'win32';
    const stopScript = isWindows ? 'node orchestrator.js --stop' : './stop-platform.sh';
    
    await new Promise((resolve, reject) => {
      exec(stopScript, (error, stdout, stderr) => {
        if (error) {
          log(`Stop script error: ${error.message}`, 'error');
          testResults.shutdown.details.push(`Stop script failed: ${error.message}`);
          reject(error);
        } else {
          log('Stop script executed successfully', 'success');
          testResults.shutdown.details.push('Stop script executed successfully');
          resolve();
        }
      });
    });
    
    // Wait for all processes to terminate
    await wait(5000);
    
    // Check if services are still running
    const healthResults = [];
    
    try {
      await checkHealth(TEST_CONFIG.endpoints.frontend, 2000);
      healthResults.push({ service: 'frontend', shutdown: false });
    } catch (error) {
      healthResults.push({ service: 'frontend', shutdown: true });
    }
    
    try {
      await checkHealth(TEST_CONFIG.endpoints.backend, 2000);
      healthResults.push({ service: 'backend', shutdown: false });
    } catch (error) {
      healthResults.push({ service: 'backend', shutdown: true });
    }
    
    try {
      await checkHealth(TEST_CONFIG.endpoints.bot, 2000);
      healthResults.push({ service: 'bot', shutdown: false });
    } catch (error) {
      healthResults.push({ service: 'bot', shutdown: true });
    }
    
    const allShutdown = healthResults.every(r => r.shutdown);
    testResults.shutdown.success = allShutdown;
    
    for (const result of healthResults) {
      if (result.shutdown) {
        testResults.shutdown.details.push(`${result.service} shutdown successfully`);
        log(`${result.service} shutdown successfully`, 'success');
      } else {
        testResults.shutdown.details.push(`${result.service} still running`);
        log(`${result.service} still running after shutdown attempt`, 'error');
      }
    }
    
    const duration = Date.now() - startTime;
    testResults.shutdown.duration = duration;
    
    if (allShutdown) {
      log(`All services shut down in ${duration}ms`, 'success');
    } else {
      log('Not all services shut down properly', 'error');
    }
    
    return healthResults;
  } catch (error) {
    log(`Shutdown testing failed: ${error.message}`, 'error');
    testResults.shutdown.details.push(`Error: ${error.message}`);
    throw error;
  }
}

async function testConfigManagement() {
  log('Testing configuration management...', 'info');
  
  try {
    // Test 1: Environment variable overrides
    log('Testing environment variable overrides...', 'info');
    
    const customEnv = {
      ...process.env,
      NODE_ENV: 'development',
      PLATFORM_MODE: 'test',
      FRONTEND_PORT: '5174',
      BACKEND_PORT: '3001',
      BOT_PORT: '5556',
      PLATFORM_LOG_LEVEL: 'debug'
    };
    
    const envOverrideProcess = await captureProcess('node', ['orchestrator.js', '--stop'], {
      env: customEnv
    });
    
    const envOverrideOutput = envOverrideProcess.stdout || '';
    
    if (envOverrideOutput.includes('Platform mode: test')) {
      testResults.configManagement.details.push('Environment variable PLATFORM_MODE override worked');
      log('PLATFORM_MODE override test passed', 'success');
    } else {
      testResults.configManagement.details.push('Environment variable PLATFORM_MODE override failed');
      log('PLATFORM_MODE override test failed', 'error');
    }
    
    // Create a temporary custom config file for testing
    const customConfig = `
      module.exports = {
        platform: {
          mode: "custom-test",
          logLevel: "debug",
          healthCheckTimeout: 30000,
          retryAttempts: 2
        },
        services: {
          frontend: {
            command: "npm run dev",
            directory: "./",
            port: 5175,
            healthEndpoint: "/",
            healthTimeout: 15000,
            dependencies: ["backend"]
          },
          backend: {
            command: "npm run dev",
            directory: "./backend",
            port: 3002,
            healthEndpoint: "/api/health",
            healthTimeout: 15000,
            dependencies: ["bot"]
          },
          bot: {
            command: "python main.py",
            directory: "./bot_microservice",
            port: 5557,
            healthEndpoint: "/api/health",
            healthTimeout: 10000,
            dependencies: []
          }
        }
      };
    `;
    
    fs.writeFileSync('./test-custom-config.js', customConfig);
    
    // Test 2: Custom configuration file
    log('Testing custom configuration file...', 'info');
    
    const customConfigEnv = {
      ...process.env,
      NODE_ENV: 'development',
      PLATFORM_CONFIG_PATH: './test-custom-config.js'
    };
    
    const customConfigProcess = await captureProcess('node', ['orchestrator.js', '--stop'], {
      env: customConfigEnv
    });
    
    const customConfigOutput = customConfigProcess.stdout || '';
    
    if (customConfigOutput.includes('Platform mode: custom-test')) {
      testResults.configManagement.details.push('Custom configuration file worked');
      log('Custom configuration file test passed', 'success');
    } else {
      testResults.configManagement.details.push('Custom configuration file failed');
      log('Custom configuration file test failed', 'error');
    }
    
    // Clean up
    try {
      fs.unlinkSync('./test-custom-config.js');
    } catch (error) {
      log(`Failed to clean up test config file: ${error.message}`, 'error');
    }
    
    // Overall config management assessment
    testResults.configManagement.success = 
      testResults.configManagement.details.filter(d => d.includes('worked')).length >= 1;
    
    if (testResults.configManagement.success) {
      log('Configuration management tests passed', 'success');
    } else {
      log('Some configuration management tests failed', 'error');
    }
    
    return testResults.configManagement;
  } catch (error) {
    log(`Configuration management tests failed: ${error.message}`, 'error');
    testResults.configManagement.details.push(`Error: ${error.message}`);
    return testResults.configManagement;
  }
}

async function generateTestReport() {
  log('Generating test report...', 'info');
  
  const reportPath = path.join(TEST_CONFIG.logDir, 'startup-system-test-report.md');
  
  const report = `# AI Trading Bot Platform - Startup System Test Report
  
## Test Summary

**Date:** ${new Date().toISOString()}
**Platform:** ${process.platform}
**Node Version:** ${process.version}

## Test Results

### 1. Startup Sequence
**Status:** ${testResults.startupSequence.success ? '✅ PASSED' : '❌ FAILED'}
**Duration:** ${testResults.startupSequence.duration}ms
**Details:**
${testResults.startupSequence.details.map(d => `- ${d}`).join('\n')}

### 2. Health Checking
**Status:** ${testResults.healthChecking.success ? '✅ PASSED' : '❌ FAILED'}
**Details:**
${testResults.healthChecking.details.map(d => `- ${d}`).join('\n')}

### 3. Error Handling
**Status:** ${testResults.errorHandling.success ? '✅ PASSED' : '❌ FAILED'}
**Details:**
${testResults.errorHandling.details.map(d => `- ${d}`).join('\n')}

### 4. Cross-Platform Compatibility
**Status:** ${testResults.crossPlatform.success ? '✅ PASSED' : '❌ FAILED'}
**Details:**
${testResults.crossPlatform.details.map(d => `- ${d}`).join('\n')}

### 5. Shutdown Process
**Status:** ${testResults.shutdown.success ? '✅ PASSED' : '❌ FAILED'}
**Duration:** ${testResults.shutdown.duration}ms
**Details:**
${testResults.shutdown.details.map(d => `- ${d}`).join('\n')}

### 6. Configuration Management
**Status:** ${testResults.configManagement.success ? '✅ PASSED' : '❌ FAILED'}
**Details:**
${testResults.configManagement.details.map(d => `- ${d}`).join('\n')}

## Overall Assessment

${Object.values(testResults).every(r => r.success) 
  ? '✅ The startup system is functioning correctly.'
  : '⚠️ The startup system has issues that need to be addressed.'}

${Object.values(testResults).filter(r => !r.success).length > 0
  ? `The following areas need attention:\n${Object.entries(testResults)
      .filter(([_, r]) => !r.success)
      .map(([area, _]) => `- ${area}`)
      .join('\n')}`
  : ''}

## Recommendations

${Object.values(testResults).every(r => r.success)
  ? '- Continue with regular maintenance and monitoring of the startup system.'
  : Object.values(testResults).filter(r => !r.success).length > 0
    ? `- Address the issues in the following areas:\n${Object.entries(testResults)
        .filter(([_, r]) => !r.success)
        .map(([area, _]) => `  - ${area}`)
        .join('\n')}`
    : ''}
`;

  fs.writeFileSync(reportPath, report);
  log(`Test report generated: ${reportPath}`, 'success');
  
  return report;
}

// Main test execution
async function runTests() {
  log('Starting startup system tests...', 'info');
  
  try {
    // Test 1: Startup Sequence
    const { platformProcess, promise } = await testStartupSequence();
    
    // Test 2: Health Checking
    await testHealthChecking(platformProcess);
    
    // Test 3: Error Handling
    await testErrorHandling(platformProcess);
    
    // Test 4: Cross-Platform Compatibility
    await testCrossPlatform();
    
    // Test 5: Shutdown Process
    await testShutdown(platformProcess);
    
    // Test 6: Configuration Management
    await testConfigManagement();
    
    // Generate report
    await generateTestReport();
    
    // Summary
    log('\n=== TEST SUMMARY ===', 'info');
    for (const [area, result] of Object.entries(testResults)) {
      log(`${area}: ${result.success ? 'PASSED' : 'FAILED'}`, result.success ? 'success' : 'error');
    }
    
    const allPassed = Object.values(testResults).every(r => r.success);
    log(`\nOverall status: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`, 
      allPassed ? 'success' : 'error');
    
    return testResults;
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
    
    // Generate report even if tests failed
    await generateTestReport();
    
    return testResults;
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('Unhandled error during testing:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testResults
};