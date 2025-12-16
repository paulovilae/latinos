# AI Trading Bot Platform - Unified Startup System

This document explains how to use the unified startup system for the AI Trading Bot Platform. The system allows developers to start all three services (frontend, backend, and bot microservice) simultaneously with proper dependency handling.

## System Components

The startup system consists of the following components:

1. **Orchestrator** (`orchestrator.js`) - Central controller that coordinates the startup process
2. **Configuration Manager** (`config-manager.js`) - Manages configuration for all services
3. **Service Manager** (`service-manager.js`) - Handles service lifecycle operations
4. **Health Checker** (`health-checker.js`) - Verifies services are operational
5. **Platform Adapter** (`platform-adapter.js`) - Ensures cross-platform compatibility
6. **Error Handler** (`error-handler.js`) - Provides comprehensive error handling

## Getting Started

### Prerequisites

- Node.js v16+ and npm
- Python 3.9+ for the bot microservice
- Required dependencies for each service

### Starting the Platform

You can start the platform using one of the following methods:

#### Using Platform Scripts

For Windows:
```
start-platform.bat
```

For macOS/Linux:
```
./start-platform.sh
```

#### Using npm Scripts

```
npm run start:platform
```

For development mode with specific configuration:
```
npm run start:dev
```

### Stopping the Platform

To stop all services:

#### Using Platform Scripts

For Windows:
```
stop-platform.bat
```

For macOS/Linux:
```
./stop-platform.sh
```

#### Using npm Scripts

```
npm run stop:platform
```

## Startup Sequence

The startup system follows this sequence:

1. Load configuration from `platform-config.js`
2. Start the bot microservice (no dependencies)
3. Wait for the bot microservice to become healthy
4. Start the backend server (depends on bot microservice)
5. Wait for the backend server to become healthy
6. Start the frontend application (depends on backend)
7. Wait for the frontend application to become healthy
8. Display access URLs for all services

## Configuration

The system uses a central configuration file `platform-config.js` that can be customized to change:

- Service startup commands
- Port configurations
- Health check endpoints and timeouts
- Dependencies between services
- Platform mode (development/production)

### Environment Variables

You can override configuration using environment variables:

- `PLATFORM_MODE` - Set to "development" or "production"
- `PLATFORM_LOG_LEVEL` - Set logging level
- `FRONTEND_PORT` - Override frontend port
- `BACKEND_PORT` - Override backend port
- `BOT_PORT` - Override bot microservice port

## Troubleshooting

If you encounter issues starting the platform:

1. Check the error messages displayed in the console
2. Verify that all required dependencies are installed
3. Ensure no other applications are using the required ports
4. Check the logs for each service for detailed errors

Common issues and solutions:

- **Port already in use**: Another application is using the required port. Stop the application or change the port in configuration.
- **Command not found**: Make sure all dependencies are installed and paths are set correctly.
- **Health check timeout**: Service is taking too long to start. Check service logs for errors.

## Advanced Usage

### Command Line Arguments

The orchestrator supports several command line arguments:

- `--help` or `-h`: Show help message
- `--stop` or `-s`: Stop all services

Example:
```
node orchestrator.js --help
```

### Custom Configuration

You can create a custom configuration file and use it with the startup system:

1. Create a custom configuration file (e.g., `my-config.js`)
2. Set the `PLATFORM_CONFIG_PATH` environment variable to point to your custom configuration
3. Start the platform as usual

Example:
```
set PLATFORM_CONFIG_PATH=./my-config.js
npm run start:platform
```

## Development

When developing new features, you can:

1. Start individual services directly for faster iteration
2. Use the startup system for integration testing
3. Extend the configuration for additional services or settings