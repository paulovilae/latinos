/**
 * Startup System Failure Testing
 * This script introduces artificial failures to test error handling and recovery
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

// Configuration for failure testing
const FAILURE_TESTS = {
  portConflict: {
    name: 'Port Conflict Test',
    description: 'Tests system behavior when required ports are already in use',
    setup: setupPortConflict,
    verify: verifyPortConflictHandling
  },
  missingDependency: {
    name: 'Missing Dependency Test',
    description: 'Tests system behavior when a required dependency is not available',
    setup: setupMissingDependency,
    verify: verifyMissingDependencyHandling
  },
  invalidConfig: {
    name: 'Invalid Configuration Test',
    description: 'Tests system behavior with invalid configuration settings',
    setup: setupInvalidConfig,
    verify: verifyInvalidConfigHandling
  },
  serviceFailure: {
    name: 'Service Startup Failure Test',
    description: 'Tests system behavior when a service fails to start',
    setup: setupServiceFailure,
    verify: verifyServiceFailureHandling
  },
  networkFailure: {
    name: 'Network Failure Test',
    description: 'Tests system behavior when network connectivity is disrupted',
    setup: setupNetworkFailure,
    verify: verifyNetworkFailureHandling
  }
};

// Results tracking
const results = {
  tests: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0
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
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// TCP server to block a port
function blockPort(port) {
  const net = require('net');
  const server = net.createServer();
  
  return new Promise((resolve, reject) => {
    server.on('error', (err) => {
      reject(err);
    });
    
    server.listen(port, () => {
      log(`Blocking port ${port}`, 'warning');
      resolve(server);
    });
  });
}

// Create a backup of a file
function backupFile(filePath) {
  const backupPath = `${filePath}.backup`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

// Restore a file from backup
function restoreFile(filePath) {
  const backupPath = `${filePath}.backup`;
  if (fs.existsSync(backupPath)) {
    fs.copyFileSync(backupPath, filePath);
    fs.unlinkSync(backupPath);
  }
}

// Test setup functions
async function setupPortConflict() {
  log('Setting up port conflict test...', 'info');
  
  try {
    // Read platform-config.js to get port numbers
    const configPath = path.join(__dirname, 'platform-config.js');
    const config = require(configPath);
    
    // Block the bot microservice port (no dependencies)
    const botPort = config.services.bot.port;
    const server = await blockPort(botPort);
    
    return {
      success: true,
      server,
      message: `Successfully blocked bot microservice port ${botPort}`
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: `Failed to set up port conflict test: ${error.message}`
    };
  }
}

async function setupMissingDependency() {
  log('Setting up missing dependency test...', 'info');
  
  try {
    // Backup the original bot microservice directory
    const botDir = path.join(__dirname, 'bot_microservice');
    const tempDir = path.join(__dirname, 'bot_microservice_temp');
    
    // Rename directory temporarily to simulate missing dependency
    fs.renameSync(botDir, tempDir);
    
    return {
      success: true,
      originalPath: botDir,
      tempPath: tempDir,
      message: 'Successfully hid bot microservice directory'
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: `Failed to set up missing dependency test: ${error.message}`
    };
  }
}

async function setupInvalidConfig() {
  log('Setting up invalid configuration test...', 'info');
  
  try {
    // Backup the original config file
    const configPath = path.join(__dirname, 'platform-config.js');
    const backupPath = backupFile(configPath);
    
    // Create invalid configuration
    const invalidConfig = `
      module.exports = {
        platform: {
          mode: "invalid"
        },
        // Missing services configuration
      };
    `;
    
    fs.writeFileSync(configPath, invalidConfig);
    
    return {
      success: true,
      configPath,
      backupPath,
      message: 'Successfully created invalid configuration'
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: `Failed to set up invalid configuration test: ${error.message}`
    };
  }
}

async function setupServiceFailure() {
  log('Setting up service failure test...', 'info');
  
  try {
    // Backup bot microservice main file
    const mainPath = path.join(__dirname, 'bot_microservice', 'main.py');
    const backupPath = backupFile(mainPath);
    
    // Create a broken main.py file
    const brokenMain = `
      # Intentionally broken file for testing
      print("Simulating startup failure")
      raise Exception("Artificial failure for testing")
    `;
    
    fs.writeFileSync(mainPath, brokenMain);
    
    return {
      success: true,
      mainPath,
      backupPath,
      message: 'Successfully created broken bot microservice main file'
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: `Failed to set up service failure test: ${error.message}`
    };
  }
}

async function setupNetworkFailure() {
  log('Setting up network failure test...', 'info');
  
  try {
    // Backup health-checker.js
    const healthCheckerPath = path.join(__dirname, 'health-checker.js');
    const backupPath = backupFile(healthCheckerPath);
    
    // Read the original file
    const originalContent = fs.readFileSync(healthCheckerPath, 'utf8');
    
    // Modify the makeRequest method to simulate network failures
    const modifiedContent = originalContent.replace(
      /makeRequest\(url, timeout\) {/,
      'makeRequest(url, timeout) {\n' +
      '      // Simulate network failure for testing\n' +
      '      if (url.includes("bot")) {\n' +
      '        return Promise.reject(new Error("Simulated network failure"));\n' +
      '      }\n'
    );
    
    fs.writeFileSync(healthCheckerPath, modifiedContent);
    
    return {
      success: true,
      healthCheckerPath,
      backupPath,
      message: 'Successfully modified health checker to simulate network failures'
    };
  } catch (error) {
    return {
      success: false,
      error,
      message: `Failed to set up network failure test: ${error.message}`
    };
  }
}

// Test verification functions
async function verifyPortConflictHandling(setupResult) {
  log('Verifying port conflict handling...', 'info');
  
  try {
    // Start the platform and check for appropriate error message
    const orchestrator = spawn('node', ['orchestrator.js'], {
      stdio: 'pipe'
    });
    
    let output = '';
    
    orchestrator.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    orchestrator.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    // Wait for error message or timeout
    await new Promise(resolve => {
      const timeout = setTimeout(() => {
        resolve();
      }, 10000);
      
      orchestrator.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    
    // Close the port blocking server
    if (setupResult.server) {
      setupResult.server.close();
    }
    
    // Check if appropriate error message was displayed
    const portConflictDetected = output.includes('EADDRINUSE') || 
                               output.includes('port is already in use') ||
                               output.includes('Port is already in use');
    
    const errorHandled = output.includes('This is a known issue') || 
                        output.includes('Solution:');
    
    if (portConflictDetected && errorHandled) {
      return {
        success: true,
        message: 'Port conflict was properly detected and handled'
      };
    } else {
      return {
        success: false,
        message: 'Port conflict was not properly handled',
        details: {
          portConflictDetected,
          errorHandled,
          output
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error,
      message: `Failed to verify port conflict handling: ${error.message}`
    };
  } finally {
    // Ensure cleanup
    if (setupResult.server) {
      try {
        setupResult.server.close();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

async function verifyMissingDependencyHandling(setupResult) {
  log('Verifying missing dependency handling...', 'info');
  
  try {
    // Start the platform and check for appropriate error message
    const orchestrator = spawn('node', ['orchestrator.js'], {
      stdio: 'pipe'
    });
    
    let output = '';
    
    orchestrator.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    orchestrator.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    // Wait for error message or timeout
    await new Promise(resolve => {
      const timeout = setTimeout(() => {
        resolve();
      }, 10000);
      
      orchestrator.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    
    // Restore the bot microservice directory
    if (setupResult.originalPath && setupResult.tempPath) {
      fs.renameSync(setupResult.tempPath, setupResult.originalPath);
    }
    
    // Check if appropriate error message was displayed
    const dependencyErrorDetected = output.includes('not found') || 
                                  output.includes('ENOENT') ||
                                  output.includes('no such file or directory');
    
    const errorHandled = output.includes('This is a known issue') || 
                        output.includes('Solution:');
    
    if (dependencyErrorDetected && errorHandled) {
      return {
        success: true,
        message: 'Missing dependency was properly detected and handled'
      };
    } else {
      return {
        success: false,
        message: 'Missing dependency was not properly handled',
        details: {
          dependencyErrorDetected,
          errorHandled,
          output
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error,
      message: `Failed to verify missing dependency handling: ${error.message}`
    };
  } finally {
    // Ensure cleanup
    if (setupResult.originalPath && setupResult.tempPath && fs.existsSync(setupResult.tempPath)) {
      try {
        fs.renameSync(setupResult.tempPath, setupResult.originalPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

async function verifyInvalidConfigHandling(setupResult) {
  log('Verifying invalid configuration handling...', 'info');
  
  try {
    // Start the platform and check for appropriate error message
    const orchestrator = spawn('node', ['orchestrator.js'], {
      stdio: 'pipe'
    });
    
    let output = '';
    
    orchestrator.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    orchestrator.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    // Wait for error message or timeout
    await new Promise(resolve => {
      const timeout = setTimeout(() => {
        resolve();
      }, 10000);
      
      orchestrator.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    
    // Restore the config file
    restoreFile(setupResult.configPath);
    
    // Check if appropriate error message was displayed
    const configErrorDetected = output.includes('Configuration error') || 
                              output.includes('is not defined in configuration');
    
    const errorHandled = !output.includes('Unhandled error');
    
    if (configErrorDetected && errorHandled) {
      return {
        success: true,
        message: 'Invalid configuration was properly detected and handled'
      };
    } else {
      return {
        success: false,
        message: 'Invalid configuration was not properly handled',
        details: {
          configErrorDetected,
          errorHandled,
          output
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error,
      message: `Failed to verify invalid configuration handling: ${error.message}`
    };
  } finally {
    // Ensure cleanup
    if (setupResult.configPath) {
      try {
        restoreFile(setupResult.configPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

async function verifyServiceFailureHandling(setupResult) {
  log('Verifying service failure handling...', 'info');
  
  try {
    // Start the platform and check for appropriate error message
    const orchestrator = spawn('node', ['orchestrator.js'], {
      stdio: 'pipe'
    });
    
    let output = '';
    
    orchestrator.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    orchestrator.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    // Wait for error message or timeout
    await new Promise(resolve => {
      const timeout = setTimeout(() => {
        resolve();
      }, 15000);
      
      orchestrator.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    
    // Restore the bot microservice main file
    restoreFile(setupResult.mainPath);
    
    // Check if appropriate error message was displayed
    const serviceFailureDetected = output.includes('bot service health check failed') || 
                                 output.includes('Failed to start bot');
    
    const errorHandled = !output.includes('Unhandled error');
    
    if (serviceFailureDetected && errorHandled) {
      return {
        success: true,
        message: 'Service failure was properly detected and handled'
      };
    } else {
      return {
        success: false,
        message: 'Service failure was not properly handled',
        details: {
          serviceFailureDetected,
          errorHandled,
          output
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error,
      message: `Failed to verify service failure handling: ${error.message}`
    };
  } finally {
    // Ensure cleanup
    if (setupResult.mainPath) {
      try {
        restoreFile(setupResult.mainPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

async function verifyNetworkFailureHandling(setupResult) {
  log('Verifying network failure handling...', 'info');
  
  try {
    // Start the platform and check for appropriate error message
    const orchestrator = spawn('node', ['orchestrator.js'], {
      stdio: 'pipe'
    });
    
    let output = '';
    
    orchestrator.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    orchestrator.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    // Wait for error message or timeout
    await new Promise(resolve => {
      const timeout = setTimeout(() => {
        resolve();
      }, 15000);
      
      orchestrator.on('close', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
    
    // Restore the health checker file
    restoreFile(setupResult.healthCheckerPath);
    
    // Check if appropriate error message was displayed
    const networkFailureDetected = output.includes('Simulated network failure') || 
                                 output.includes('Health check failed');
    
    const errorHandled = output.includes('is not healthy yet') ||
                        output.includes('health check failed');
    
    if (networkFailureDetected && errorHandled) {
      return {
        success: true,
        message: 'Network failure was properly detected and handled'
      };
    } else {
      return {
        success: false,
        message: 'Network failure was not properly handled',
        details: {
          networkFailureDetected,
          errorHandled,
          output
        }
      };
    }
  } catch (error) {
    return {
      success: false,
      error,
      message: `Failed to verify network failure handling: ${error.message}`
    };
  } finally {
    // Ensure cleanup
    if (setupResult.healthCheckerPath) {
      try {
        restoreFile(setupResult.healthCheckerPath);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
}

// Run a specific test
async function runTest(testName) {
  const test = FAILURE_TESTS[testName];
  if (!test) {
    log(`Test '${testName}' not found`, 'error');
    return { success: false, message: `Test '${testName}' not found` };
  }
  
  log(`\n=== Running ${test.name} ===`, 'info');
  log(test.description, 'info');
  
  try {
    // Set up the test
    const setupResult = await test.setup();
    if (!setupResult.success) {
      log(`Test setup failed: ${setupResult.message}`, 'error');
      return {
        success: false,
        message: `Test setup failed: ${setupResult.message}`,
        error: setupResult.error
      };
    }
    
    // Verify the behavior
    const verifyResult = await test.verify(setupResult);
    
    if (verifyResult.success) {
      log(`Test passed: ${verifyResult.message}`, 'success');
    } else {
      log(`Test failed: ${verifyResult.message}`, 'error');
      if (verifyResult.details) {
        console.log('Details:', verifyResult.details);
      }
    }
    
    return verifyResult;
  } catch (error) {
    log(`Test execution failed: ${error.message}`, 'error');
    return {
      success: false,
      message: `Test execution failed: ${error.message}`,
      error
    };
  }
}

// Run all tests
async function runAllTests() {
  log('Starting failure handling tests...', 'info');
  
  const testNames = Object.keys(FAILURE_TESTS);
  results.summary.total = testNames.length;
  
  for (const testName of testNames) {
    const testResult = await runTest(testName);
    results.tests[testName] = testResult;
    
    if (testResult.success) {
      results.summary.passed++;
    } else {
      results.summary.failed++;
    }
    
    // Wait a moment between tests
    await wait(2000);
  }
  
  // Print summary
  log('\n=== FAILURE HANDLING TEST SUMMARY ===', 'info');
  log(`Total tests: ${results.summary.total}`, 'info');
  log(`Passed: ${results.summary.passed}`, 'success');
  log(`Failed: ${results.summary.failed}`, results.summary.failed > 0 ? 'error' : 'info');
  
  // Generate report
  generateReport();
  
  return results;
}

// Generate test report
function generateReport() {
  const reportPath = path.join(__dirname, 'failure-handling-test-report.md');
  
  const report = `# AI Trading Bot Platform - Failure Handling Test Report
  
## Test Summary

**Date:** ${new Date().toISOString()}
**Platform:** ${process.platform}
**Node Version:** ${process.version}

## Test Results

${Object.entries(results.tests).map(([testName, result]) => `
### ${FAILURE_TESTS[testName].name}
**Status:** ${result.success ? '✅ PASSED' : '❌ FAILED'}
**Description:** ${FAILURE_TESTS[testName].description}
**Result:** ${result.message}
${result.details ? `**Details:**\n\`\`\`\n${JSON.stringify(result.details, null, 2)}\n\`\`\`\n` : ''}
`).join('\n')}

## Overall Assessment

${results.summary.failed === 0 
  ? '✅ The system correctly handles all tested failure scenarios.'
  : `⚠️ The system has issues handling ${results.summary.failed} failure scenarios.`}

## Recommendations

${results.summary.failed === 0
  ? '- Continue with regular monitoring of failure handling mechanisms.'
  : Object.entries(results.tests).filter(([_, result]) => !result.success).map(([testName, _]) => 
      `- Address issues with handling ${FAILURE_TESTS[testName].name.toLowerCase()}`
    ).join('\n')}
`;

  fs.writeFileSync(reportPath, report);
  log(`Test report generated: ${reportPath}`, 'success');
  
  return report;
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Unhandled error during testing:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  runTest,
  results
};