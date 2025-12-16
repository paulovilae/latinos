/**
 * Unified Test Runner for AI Trading Bot Platform Startup System
 * This script executes all startup system tests and consolidates results
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Check if running directly
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Unhandled error during test execution:', error);
    process.exit(1);
  });
}

async function runAllTests() {
  const startTime = Date.now();
  
  console.log('\x1b[36m=======================================================\x1b[0m');
  console.log('\x1b[36m AI Trading Bot Platform - Startup System Test Runner  \x1b[0m');
  console.log('\x1b[36m=======================================================\x1b[0m');
  console.log(`Running on ${process.platform} platform`);
  
  // Create test logs directory if it doesn't exist
  const logDir = path.join(__dirname, 'test-logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Results storage
  const results = {
    platform: process.platform,
    startTime: new Date().toISOString(),
    endTime: null,
    duration: 0,
    startupTests: {
      success: false,
      details: {}
    },
    failureTests: {
      success: false,
      details: {}
    },
    overallSuccess: false
  };

  try {
    // Step 1: Run startup system tests
    console.log('\n\x1b[33m1. Running startup system tests...\x1b[0m');
    const startupTestResult = await runTest('test-startup-system.js');
    results.startupTests.success = startupTestResult.code === 0;
    results.startupTests.details = {
      exitCode: startupTestResult.code,
      output: startupTestResult.output
    };
    
    if (startupTestResult.code === 0) {
      console.log('\x1b[32m✓ Startup system tests completed successfully\x1b[0m');
    } else {
      console.log('\x1b[31m✗ Startup system tests failed with code ' + startupTestResult.code + '\x1b[0m');
    }
    
    // Step 2: Run failure handling tests
    console.log('\n\x1b[33m2. Running failure handling tests...\x1b[0m');
    const failureTestResult = await runTest('test-startup-failures.js');
    results.failureTests.success = failureTestResult.code === 0;
    results.failureTests.details = {
      exitCode: failureTestResult.code,
      output: failureTestResult.output
    };
    
    if (failureTestResult.code === 0) {
      console.log('\x1b[32m✓ Failure handling tests completed successfully\x1b[0m');
    } else {
      console.log('\x1b[31m✗ Failure handling tests failed with code ' + failureTestResult.code + '\x1b[0m');
    }
    
    // Calculate overall success
    results.overallSuccess = results.startupTests.success && results.failureTests.success;
    
    // Record finish time and duration
    results.endTime = new Date().toISOString();
    results.duration = Date.now() - startTime;
    
    // Save results to JSON file
    const resultsPath = path.join(logDir, 'combined-test-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    // Check if we have test reports to combine
    const startupReportPath = path.join(logDir, 'startup-system-test-report.md');
    const failureReportPath = path.join(__dirname, 'failure-handling-test-report.md');
    
    // Output summary
    console.log('\n\x1b[36m=======================================================\x1b[0m');
    console.log('\x1b[36m                   Test Summary                        \x1b[0m');
    console.log('\x1b[36m=======================================================\x1b[0m');
    console.log(`Total duration: ${(results.duration / 1000).toFixed(2)} seconds`);
    console.log(`Startup tests: ${results.startupTests.success ? 'PASSED' : 'FAILED'}`);
    console.log(`Failure tests: ${results.failureTests.success ? 'PASSED' : 'FAILED'}`);
    console.log(`Overall status: ${results.overallSuccess ? 'SUCCESS' : 'FAILURE'}`);
    
    console.log('\nDetailed test reports are available in:');
    console.log(`- ${logDir}/startup-system-test-report.md`);
    console.log(`- ${__dirname}/failure-handling-test-report.md`);
    console.log(`- ${__dirname}/STARTUP-SYSTEM-TEST-REPORT.md (combined template)`);
    
    // Return the results
    return results;
  } catch (error) {
    console.error('\x1b[31mTest execution failed:\x1b[0m', error);
    
    // Save error to log
    const errorLogPath = path.join(logDir, 'test-error.log');
    fs.writeFileSync(errorLogPath, `Error during test execution:\n${error.stack}`);
    
    throw error;
  }
}

async function runTest(testScript) {
  return new Promise((resolve, reject) => {
    const process = spawn('node', [testScript], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let output = '';
    
    process.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.log(text);
    });
    
    process.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      console.error(text);
    });
    
    process.on('error', (error) => {
      reject(error);
    });
    
    process.on('close', (code) => {
      resolve({
        code,
        output
      });
    });
  });
}

module.exports = {
  runAllTests
};