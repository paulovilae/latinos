# Repetitive Tasks Documentation

This document contains step-by-step workflows for common repetitive tasks in the AI Trading Bot Platform project. Each documented task includes the files that need to be modified, specific steps to follow, and important considerations.

## Add New Trading Formula

**Files to modify:**
- `/bot_microservice/formula_calc/calculate_formulas.py` - Add the new formula calculation
- `/bot_microservice/formula_manage/formula_manager.py` - Register the new formula with the scheduler (if needed)
- `/components/BotConfigurationPage.tsx` - Add UI option for the new formula

**Steps:**
1. Implement the formula logic in calculate_formulas.py
2. Add appropriate validation and error handling
3. Update the UI configuration options
4. Test the formula with historical data
5. Add the formula to the available strategies list

**Important notes:**
- Ensure formulas are properly validated with edge cases
- Document the formula's strategy and expected outcomes
- Consider caching requirements for formula inputs

## Add New Dashboard Widget

**Files to modify:**
- Create new component in `/components/dashboard/`
- Update relevant dashboard page (Overview, Technical, or Performance)
- Add any required data services in `/services/`

**Steps:**
1. Create the widget component with appropriate props and styling
2. Add data fetching logic and state management
3. Integrate the widget into the relevant dashboard page
4. Implement responsive design for all screen sizes
5. Add any necessary translations to locale files

**Important notes:**
- Follow established design patterns and component structure
- Ensure proper error handling and loading states
- Test on multiple screen sizes and browsers

## Use the Unified Startup System

**Files/components involved:**
- `orchestrator.js` - Central controller for the startup process
- `platform-config.js` - Configuration for all services
- `start-platform.bat/sh` - Platform scripts for startup
- `stop-platform.bat/sh` - Platform scripts for shutdown

**Steps for starting the platform:**
1. Ensure all required dependencies are installed:
   - Node.js v16+ and npm for frontend and backend
   - Python 3.9+ for bot microservice
   - Required packages: `pip install -r bot_microservice/requirements.txt`

2. Start the platform using one of these methods:
   - **Windows:** Run `start-platform.bat`
   - **macOS/Linux:** Run `./start-platform.sh`
   - **NPM Script:** Run `npm run start:platform`

3. Monitor the startup process in the console:
   - Bot microservice should start first (no dependencies)
   - Backend server will start after the bot is healthy
   - Frontend will start after the backend is healthy
   - Access URLs will be displayed for all services

**Steps for stopping the platform:**
1. Stop all services using one of these methods:
   - **Windows:** Run `stop-platform.bat`
   - **macOS/Linux:** Run `./stop-platform.sh`
   - **NPM Script:** Run `npm run stop:platform`

2. Verify all services have terminated properly in the console output

**Configuration customization:**
1. Environment variable overrides:
   - `PLATFORM_MODE=production` - Set platform mode
   - `FRONTEND_PORT=3000` - Override frontend port
   - `BACKEND_PORT=5000` - Override backend port
   - `BOT_PORT=8000` - Override bot microservice port
   - `PLATFORM_LOG_LEVEL=debug` - Set logging verbosity

2. Custom configuration file:
   - Create a custom config file based on `platform-config.js`
   - Set `PLATFORM_CONFIG_PATH=./my-config.js`
   - Start the platform normally

**Important notes:**
- The system follows a strict dependency order: Bot → Backend → Frontend
- Health checks verify each service is operational before starting dependent services
- If a service fails to start, check the console for detailed error messages
- Common issues include:
  - Port conflicts: Ensure no other applications are using the required ports
  - Missing dependencies: Verify all required packages are installed
  - Invalid configuration: Check for typos or incorrect settings
  - Service startup failures: Check individual service logs for errors
- For development of individual services, you can still use the traditional method of starting each service separately