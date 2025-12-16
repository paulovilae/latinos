# AI Trading Bot Platform - Startup System Testing

This document provides instructions for testing the unified startup system for the AI Trading Bot Platform.

## Test Components

The testing framework consists of the following components:

1. **Main Startup System Tests** (`test-startup-system.js`)
   - Tests the startup sequence
   - Verifies health checking functionality
   - Tests error handling
   - Verifies cross-platform compatibility
   - Tests the shutdown process
   - Verifies configuration management

2. **Failure Handling Tests** (`test-startup-failures.js`)
   - Introduces artificial failures to test error handling
   - Tests port conflicts
   - Tests missing dependencies
   - Tests invalid configuration
   - Tests service startup failures
   - Tests network failures

3. **Test Runners**
   - `run-tests.js` - Node.js unified test runner
   - `run-tests.bat` - Windows batch script
   - `run-tests.sh` - Unix shell script

## Running the Tests

### Prerequisites

- Node.js v16+ and npm
- Python 3.9+ for the bot microservice
- Required dependencies for each service

### Option 1: Using npm scripts

```bash
# Run all tests
npm run test:all

# Run only startup system tests
npm run test:startup

# Run only failure handling tests
npm run test:failures
```

### Option 2: Using platform-specific scripts

For Windows:
```bash
run-tests.bat
```

For macOS/Linux:
```bash
chmod +x run-tests.sh
./run-tests.sh
```

### Option 3: Running individual test files

```bash
node test-startup-system.js
node test-startup-failures.js
```

## Test Output

The tests generate the following output:

1. **Console Output**
   - Real-time progress and results of tests
   - Summary of test results

2. **Log Files**
   - Detailed logs are saved to the `test-logs` directory
   - `combined-test-results.json` - JSON file with all test results
   - `startup-system-test-report.md` - Markdown report for startup tests
   - `failure-handling-test-report.md` - Markdown report for failure tests

3. **Test Report**
   - A comprehensive test report template is available in `STARTUP-SYSTEM-TEST-REPORT.md`

## Testing Strategy

### 1. Startup Sequence Testing

Tests that all three services (frontend, backend, and bot microservice) start correctly in the proper dependency order:

1. Bot microservice (no dependencies)
2. Backend server (depends on bot microservice)
3. Frontend application (depends on backend)

### 2. Health Checking

Verifies that the system correctly identifies when services are operational by checking health endpoints.

### 3. Error Handling

Introduces artificial failures to verify error handling capabilities:

- Port conflicts
- Missing dependencies
- Invalid configuration
- Service startup failures
- Network failures

### 4. Cross-Platform Compatibility

Tests startup scripts on both Windows and Unix-like environments.

### 5. Shutdown Process

Verifies that all services terminate gracefully during shutdown.

### 6. Configuration Management

Tests configuration management with different settings:

- Environment variable overrides
- Custom configuration files
- Validation of configuration

## Troubleshooting

If you encounter issues while running the tests:

1. **Port conflicts**: Ensure no other applications are using the required ports (5173, 3000-3020, 5555)
2. **Missing dependencies**: Verify that all required dependencies are installed
3. **Permission issues**: Ensure you have the necessary permissions to run the scripts
4. **Timeout errors**: Increase timeout values in the test scripts if services take longer to start

## Test Coverage

The tests cover all critical functionality of the startup system:

- Correct service startup order
- Health checking mechanisms
- Error detection and reporting
- Graceful shutdown process
- Configuration flexibility
- Cross-platform compatibility

This comprehensive testing ensures the startup system is reliable and robust across different environments and scenarios.