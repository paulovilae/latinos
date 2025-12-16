# AI Trading Bot Platform - Unified Startup System User Guide

## Introduction

The Unified Startup System is a powerful orchestration tool designed to simplify the development and deployment workflow for the AI Trading Bot Platform. This system coordinates the startup and shutdown of all platform components (bot microservice, backend server, and frontend application) while ensuring proper dependency handling and health verification.

**Key Benefits:**
- **Single Command Operation**: Start and stop the entire platform with one command
- **Dependency Management**: Automatically handles service dependencies in the correct order
- **Health Verification**: Ensures each service is fully operational before starting dependent services
- **Cross-Platform Support**: Works consistently on Windows and Unix-based systems
- **Flexible Configuration**: Easily customize settings through environment variables or config files
- **Comprehensive Error Handling**: Provides detailed error messages and recovery options

The system consists of several core components:
- **Orchestrator** - Central controller for the startup process
- **Configuration Manager** - Handles service settings and environment overrides
- **Service Manager** - Controls service lifecycle operations
- **Health Checker** - Verifies services are operational
- **Platform Adapter** - Ensures cross-platform compatibility
- **Error Handler** - Provides detailed error reporting

## Basic Usage

### Prerequisites

Before using the startup system, ensure you have:
- Node.js v16+ and npm installed
- Python 3.9+ installed for the bot microservice
- Required Python packages: `pip install -r bot_microservice/requirements.txt`
- All service dependencies installed

### Starting the Platform

To start the entire platform with a single command:

**Windows:**
```batch
start-platform.bat
```

**macOS/Linux:**
```bash
./start-platform.sh
```

**Using npm:**
```bash
npm run start:platform
```

The system will:
1. Load configuration from `platform-config.js`
2. Start the bot microservice (no dependencies)
3. Wait for the bot microservice to become healthy
4. Start the backend server (depends on bot microservice)
5. Wait for the backend server to become healthy
6. Start the frontend application (depends on backend)
7. Display access URLs for all services

### Stopping the Platform

To stop all services:

**Windows:**
```batch
stop-platform.bat
```

**macOS/Linux:**
```bash
./stop-platform.sh
```

**Using npm:**
```bash
npm run stop:platform
```

## Configuration Options

The Unified Startup System offers various configuration options to customize the platform behavior.

### Environment Variables

You can override default settings using environment variables:

```bash
# Set platform mode (development or production)
PLATFORM_MODE=development

# Override service ports
FRONTEND_PORT=3000
BACKEND_PORT=5000
BOT_PORT=8000

# Set logging verbosity (error, warn, info, debug, trace)
PLATFORM_LOG_LEVEL=info

# Specify a custom configuration file
PLATFORM_CONFIG_PATH=./my-custom-config.js
```

Examples:

**Windows:**
```batch
set FRONTEND_PORT=8080
set PLATFORM_MODE=development
start-platform.bat
```

**macOS/Linux:**
```bash
FRONTEND_PORT=8080 PLATFORM_MODE=development ./start-platform.sh
```

**npm with environment variables:**
```bash
FRONTEND_PORT=8080 PLATFORM_MODE=development npm run start:platform
```

### Custom Configuration Files

For more advanced customization, you can create a custom configuration file:

1. Create a new JavaScript file (e.g., `my-custom-config.js`)
2. Use the same structure as `platform-config.js`
3. Specify your custom settings

Example custom configuration file:

```javascript
module.exports = {
  platform: {
    mode: "development",
    logLevel: "debug",
    healthCheckTimeout: 90000,
    retryAttempts: 5
  },
  
  services: {
    frontend: {
      command: "npm run dev",
      directory: "./",
      port: 3000,
      healthEndpoint: "/",
      healthTimeout: 45000,
      simpleCheck: true,
      dependencies: ["backend"]
    },
    
    backend: {
      command: "npm run dev",
      directory: "./backend",
      port: 5000,
      healthEndpoint: "/api/health",
      healthTimeout: 20000,
      dependencies: ["bot"]
    },
    
    bot: {
      command: "python main.py",
      directory: "./bot_microservice",
      port: 8000,
      healthEndpoint: "/api/health",
      healthTimeout: 15000,
      dependencies: []
    }
  }
};
```

To use your custom configuration:

```bash
# Windows
set PLATFORM_CONFIG_PATH=./my-custom-config.js
start-platform.bat

# macOS/Linux
PLATFORM_CONFIG_PATH=./my-custom-config.js ./start-platform.sh

# npm
PLATFORM_CONFIG_PATH=./my-custom-config.js npm run start:platform
```

## Troubleshooting

When using the startup system, you might encounter issues. Here are solutions to common problems:

### Missing Python Dependencies

**Symptom:** The bot microservice fails to start with errors like:
```
ModuleNotFoundError: No module named 'alpaca_trade_api'
```

**Solution:**
1. Install the required Python packages:
   ```bash
   pip install -r bot_microservice/requirements.txt
   ```
2. If specific packages are missing, install them individually:
   ```bash
   pip install alpaca_trade_api
   ```

### Node.js Command Execution Problems

**Symptom:** Unable to spawn npm commands with errors like:
```
✗ backend process error: spawn npm ENOENT
✗ frontend process error: spawn npm ENOENT
```

**Solution:**
1. Ensure Node.js and npm are installed and in the system PATH
2. Verify the installation:
   ```bash
   node --version
   npm --version
   ```
3. If using a custom Node.js installation, specify the full path in the configuration

### Port Conflicts

**Symptom:** Services fail to start with errors about ports already in use:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
1. Check if other applications are using the required ports:
   ```bash
   # Windows
   netstat -ano | findstr "3000"
   
   # macOS/Linux
   lsof -i :3000
   ```
2. Stop the conflicting applications or change the port in your configuration:
   ```bash
   FRONTEND_PORT=3001 npm run start:platform
   ```

### Health Check Timeouts

**Symptom:** Services start but health checks fail:
```
✗ frontend service health check failed after 15000ms
```

**Solution:**
1. Increase the health check timeout in the configuration:
   ```javascript
   // In platform-config.js or custom config
   frontend: {
     // Other settings...
     healthTimeout: 30000  // Increase to 30 seconds
   }
   ```
2. Or use environment variables:
   ```bash
   FRONTEND_HEALTH_TIMEOUT=30000 npm run start:platform
   ```

### Incomplete Shutdown

**Symptom:** Services don't fully terminate when stopping the platform

**Solution:**
1. Manually terminate the processes:
   ```bash
   # Windows
   taskkill /F /IM node.exe
   taskkill /F /IM python.exe
   
   # macOS/Linux
   pkill -f node
   pkill -f python
   ```
2. If using the latest version of the startup system, try the force option:
   ```bash
   # Windows
   stop-platform.bat --force
   
   # macOS/Linux
   ./stop-platform.sh --force
   ```

## Advanced Usage

### Development Mode with Custom Ports

Start the platform in development mode with custom ports:

```bash
PLATFORM_MODE=development FRONTEND_PORT=4000 BACKEND_PORT=5500 BOT_PORT=8500 npm run start:platform
```

### Starting Individual Services

For focused development, you can create configurations for individual services:

```javascript
// frontend-only-config.js
module.exports = {
  platform: {
    mode: "development",
    logLevel: "debug"
  },
  services: {
    frontend: {
      command: "npm run dev",
      directory: "./",
      port: 3000,
      healthEndpoint: "/",
      healthTimeout: 30000,
      dependencies: []  // Empty to allow standalone startup
    }
  }
};
```

Then start with:
```bash
PLATFORM_CONFIG_PATH=./frontend-only-config.js npm run start:platform
```

### Command Line Arguments

The startup system supports various command line arguments:

```bash
# Show help
node orchestrator.js --help

# Stop all services
node orchestrator.js --stop

# Start with verbose logging
node orchestrator.js --verbose
```

### Non-Interactive Mode for CI/CD

For use in CI/CD pipelines:

```bash
PLATFORM_NON_INTERACTIVE=true PLATFORM_MODE=production npm run start:platform
```

This disables prompts and uses default behavior when issues are encountered.

### Custom Health Check Configuration

For services with special health check requirements:

```javascript
// In your custom config
services: {
  specialService: {
    command: "npm run special",
    directory: "./special",
    port: 7000,
    healthEndpoint: "/api/status",
    healthTimeout: 45000,
    healthMethod: "POST",  // Use POST instead of GET
    healthHeaders: {       // Custom headers
      "Authorization": "Bearer token123"
    },
    healthBody: {          // Request body for POST
      "check": "full"
    },
    healthSuccess: (res) => res.status === "ok"  // Custom success validation
  }
}
```

## Conclusion

The Unified Startup System simplifies the development workflow by providing a consistent way to start, stop, and configure all platform services. By following this guide, you should be able to effectively use the system for development, testing, and deployment.

For further details or advanced configurations, refer to the full documentation in `STARTUP-SYSTEM.md` or reach out to the platform team.