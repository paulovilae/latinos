# Unified Startup System

This directory contains the implementation of the Unified Startup System, a comprehensive orchestration tool designed to simplify the development and deployment workflow for the AI Trading Bot Platform.

## Purpose

The Unified Startup System coordinates the startup and shutdown of all platform components (bot microservice, backend server, and frontend application) while ensuring proper dependency handling and health verification.

## Key Features

- **Single Command Operation**: Start and stop the entire platform with one command
- **Dependency Management**: Automatically handles service dependencies in the correct order
- **Health Verification**: Ensures each service is fully operational before starting dependent services
- **Cross-Platform Support**: Works consistently on Windows and Unix-based systems
- **Flexible Configuration**: Easily customize settings through environment variables or config files
- **Error Handling**: Provides detailed error messages and recovery options

## Directory Structure

- **Core Files** (root of this directory): Main system scripts and configuration
  - `orchestrator.js` - Central controller for the startup process
  - `config-manager.js` - Handles service settings and environment overrides
  - `service-manager.js` - Controls service lifecycle operations
  - `health-checker.js` - Verifies services are operational
  - `platform-adapter.js` - Ensures cross-platform compatibility
  - `error-handler.js` - Provides detailed error reporting
  - `dependency-checker.js` - Verifies required dependencies
  - `platform-config.js` - Central configuration file

- **`/scripts`**: Platform execution scripts
  - `start-platform.bat/.sh` - Windows/Unix scripts to start the platform
  - `stop-platform.bat/.sh` - Windows/Unix scripts to stop the platform

- **`/docs`**: System documentation
  - `STARTUP-SYSTEM.md` - Technical documentation
  - `USER-GUIDE.md` - User guide for using the startup system
  - `KNOWN-ISSUES.md` - Documentation of known issues and workarounds

- **`/testing`**: Testing framework and reports
  - `test-startup-system.js` - Main test suite
  - `test-startup-failures.js` - Tests for failure scenarios
  - `run-tests.js/.bat/.sh` - Test runners
  - Test reports and status documentation

## Usage

The system can be used in multiple ways:

1. **Platform Scripts**:
   - Windows: `scripts/start-platform.bat` and `scripts/stop-platform.bat`
   - macOS/Linux: `scripts/start-platform.sh` and `scripts/stop-platform.sh`

2. **NPM Scripts** (defined in root package.json):
   - `npm run start:platform` - Start all services
   - `npm run stop:platform` - Stop all services

For detailed usage instructions, please refer to the [User Guide](docs/USER-GUIDE.md).

## Development

For technical details about the system architecture and implementation, see the [Technical Documentation](docs/STARTUP-SYSTEM.md).

If you encounter issues, check the [Known Issues](docs/KNOWN-ISSUES.md) document for possible solutions.