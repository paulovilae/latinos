# AI Trading Bot Platform - Startup System Issues

This document outlines the issues identified during testing of the unified startup system and provides recommendations for fixing them.

## Identified Issues

### 1. Missing Python Dependencies

**Issue:** The bot microservice fails to start because of missing Python dependencies.

```
ModuleNotFoundError: No module named 'alpaca_trade_api'
```

**Recommendation:** 
- Install the required Python packages using pip:
  ```
  pip install alpaca_trade_api
  ```
- Update the `requirements.txt` file to include all necessary dependencies
- Add dependency checking to the startup system to verify required packages are installed before attempting to start services

### 2. Node.js Command Execution Problems

**Issue:** The system is unable to spawn npm commands:

```
✗ backend process error: spawn npm ENOENT
✗ frontend process error: spawn npm ENOENT
```

**Recommendation:**
- Verify Node.js and npm are installed and in the system PATH
- In `platform-adapter.js`, modify the `spawnProcess` method to use the full path to npm executables
- Add checks for npm and Node.js before attempting to start services

### 3. Frontend Health Check Timeout

**Issue:** The frontend service fails to become healthy within the timeout period:

```
✗ frontend service health check failed
```

**Recommendation:**
- Increase the health check timeout for the frontend service
- Implement more sophisticated health checking for the frontend (e.g., wait for Vite to indicate server is ready)
- Add more verbose logging during frontend startup to identify specific issues

### 4. Incomplete Shutdown Process

**Issue:** The shutdown process does not properly terminate all services:

```
frontend shutdown successfully
backend still running after shutdown attempt
bot still running after shutdown attempt
```

**Recommendation:**
- Enhance the shutdown process in `service-manager.js` to force termination if graceful shutdown fails
- Add process group handling for more reliable termination of child processes
- Implement proper signal handling for the Python bot microservice

### 5. Configuration Management Issues

**Issue:** The environment variable overrides and custom configuration tests are failing:

```
PLATFORM_MODE override test failed
Custom configuration file test failed
```

**Recommendation:**
- Fix the environment variable handling in `config-manager.js`
- Ensure custom configuration files are properly loaded and validated
- Add more detailed error messages for configuration-related issues

## Implementation Fixes

### 1. Fix for Python Dependencies

Add a dependency checker to the orchestrator:

```javascript
// Add to orchestrator.js before starting services
async function checkDependencies() {
  console.log('Checking dependencies...');
  
  // Check Python dependencies
  try {
    const { stdout } = await exec('pip list');
    const missingDeps = [];
    
    // Check for required packages
    if (!stdout.includes('alpaca-trade-api')) {
      missingDeps.push('alpaca-trade-api');
    }
    
    if (missingDeps.length > 0) {
      console.error(`Missing Python dependencies: ${missingDeps.join(', ')}`);
      console.log('Run: pip install ' + missingDeps.join(' '));
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to check Python dependencies:', error.message);
    return false;
  }
}
```

### 2. Fix for Node.js Command Execution

Update the platform adapter to handle npm execution more robustly:

```javascript
// Modify in platform-adapter.js
spawnProcess(command, options = {}) {
  // Default to inherit stdio unless specified
  if (!options.stdio) {
    options.stdio = 'inherit';
  }
  
  // Ensure environment variables are set
  options.env = options.env || process.env;
  
  // Split command into executable and args
  const parts = command.split(' ');
  const executable = parts[0];
  const args = parts.slice(1);
  
  // Create and log the full command
  const fullCommand = `${executable} ${args.join(' ')}`;
  console.log(`Executing: ${fullCommand} in ${options.cwd || process.cwd()}`);
  
  // Handle platform-specific spawning
  if (this.isWindows) {
    // On Windows, use cmd.exe for all commands to ensure PATH is properly resolved
    return spawn('cmd.exe', ['/c', fullCommand], options);
  } else {
    // Unix platforms can spawn directly
    return spawn(executable, args, options);
  }
}
```

### 3. Fix for Frontend Health Check

Update the frontend health check configuration:

```javascript
// Modify in platform-config.js
frontend: {
  command: "npm run dev",
  directory: "./",
  port: 5173,
  healthEndpoint: "/",
  healthTimeout: 30000, // Increase from 15000 to 30000
  simpleCheck: true,    // Add this flag for simpler health check
  dependencies: ["backend"]
}
```

### 4. Fix for Incomplete Shutdown

Enhance the service shutdown in service-manager.js:

```javascript
// Modify in service-manager.js
async stopService(serviceName) {
  if (!this.isServiceRunning(serviceName)) {
    console.log(`Service ${serviceName} is not running.`);
    return false;
  }
  
  console.log(`\x1b[33m■ Stopping ${serviceName} service...\x1b[0m`);
  
  try {
    const process = this.processes[serviceName].process;
    
    // Create a promise that resolves when the process exits
    const exitPromise = new Promise((resolve) => {
      process.once('exit', () => resolve());
    });
    
    // Send kill signal
    if (this.platformAdapter.isWindows) {
      // On Windows, use taskkill to ensure the process and its children are terminated
      if (serviceName === 'bot') {
        // For Python processes
        exec(`taskkill /F /T /PID ${process.pid}`);
      } else {
        process.kill();
      }
    } else {
      // On Unix, use process groups for better termination
      process.kill('-SIGTERM'); 
    }
    
    // Wait for process to exit with timeout
    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => resolve('timeout'), 5000);
    });
    
    const result = await Promise.race([exitPromise, timeoutPromise]);
    
    if (result === 'timeout') {
      console.log(`\x1b[31m${serviceName} did not exit gracefully, forcing termination...\x1b[0m`);
      // Force kill
      if (this.platformAdapter.isWindows) {
        exec(`taskkill /F /T /PID ${process.pid}`);
      } else {
        process.kill('-SIGKILL');
      }
    }
    
    console.log(`\x1b[32m✓ ${serviceName} service stopped\x1b[0m`);
    delete this.processes[serviceName];
    return true;
  } catch (error) {
    console.error(`Failed to stop ${serviceName}:`, error.message);
    
    // Force cleanup even if error occurred
    delete this.processes[serviceName];
    return false;
  }
}
```

### 5. Fix for Configuration Management

Update the config manager to handle environment variables properly:

```javascript
// Modify in config-manager.js
applyEnvironmentOverrides() {
  // Override platform settings - ensure parsing and type conversion
  if (process.env.PLATFORM_MODE) {
    console.log(`Applying environment override for PLATFORM_MODE: ${process.env.PLATFORM_MODE}`);
    this.config.platform.mode = process.env.PLATFORM_MODE;
  }
  
  if (process.env.PLATFORM_LOG_LEVEL) {
    console.log(`Applying environment override for PLATFORM_LOG_LEVEL: ${process.env.PLATFORM_LOG_LEVEL}`);
    this.config.platform.logLevel = process.env.PLATFORM_LOG_LEVEL;
  }
  
  // Override service ports if specified in environment
  if (process.env.FRONTEND_PORT) {
    const port = parseInt(process.env.FRONTEND_PORT, 10);
    console.log(`Applying environment override for FRONTEND_PORT: ${port}`);
    this.config.services.frontend.port = port;
  }
  
  if (process.env.BACKEND_PORT) {
    const port = parseInt(process.env.BACKEND_PORT, 10);
    console.log(`Applying environment override for BACKEND_PORT: ${port}`);
    // If specific port is set, remove the port range
    this.config.services.backend.port = port;
    delete this.config.services.backend.portRange;
  }
  
  if (process.env.BOT_PORT) {
    const port = parseInt(process.env.BOT_PORT, 10);
    console.log(`Applying environment override for BOT_PORT: ${port}`);
    this.config.services.bot.port = port;
  }
}
```

## Next Steps

1. Implement the recommended fixes
2. Re-run the tests to verify the issues have been resolved
3. Document any remaining issues
4. Update the startup system documentation with troubleshooting information

By addressing these issues, the startup system will be more robust and reliable across different environments.