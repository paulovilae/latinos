#!/usr/bin/env node
/**
 * AI Trading Bot Platform - Startup Orchestrator
 * Central controller that coordinates the entire startup process
 */

const configManager = require('./config-manager');
const ServiceManager = require('./service-manager');
const HealthChecker = require('./health-checker');
const platformAdapter = require('./platform-adapter');
const errorHandler = require('./error-handler');
const dependencyChecker = require('./dependency-checker');

class Orchestrator {
  constructor() {
    this.initTime = new Date();
    this.config = null;
    this.serviceManager = null;
    this.healthChecker = null;
  }

  /**
   * Initialize the orchestrator
   */
  async initialize() {
    try {
      console.log('\x1b[36m===============================================\x1b[0m');
      console.log('\x1b[36m      AI Trading Bot Platform - Startup        \x1b[0m');
      console.log('\x1b[36m===============================================\x1b[0m');
      console.log(`Running on ${platformAdapter.getPlatformName()}`);
      
      // Load configuration
      this.config = configManager.loadConfig();
      console.log(`Platform mode: ${this.config.platform.mode}`);
      
      // Initialize service manager
      this.serviceManager = new ServiceManager(this.config);
      
      // Initialize health checker
      this.healthChecker = new HealthChecker(this.config);
      
      return true;
    } catch (error) {
      errorHandler.handleError(error, 'orchestrator.initialize');
      return false;
    }
  }

  /**
   * Start all platform services in the correct sequence
   */
  async startPlatform() {
    try {
      // Initialize the orchestrator
      const initSuccess = await this.initialize();
      if (!initSuccess) {
        console.error('\x1b[31mFailed to initialize platform\x1b[0m');
        return false;
      }
      
      // Check for required dependencies before starting
      console.log('\n\x1b[36mChecking required dependencies...\x1b[0m');
      const dependencyResults = await dependencyChecker.checkAllDependencies();
      
      if (!dependencyResults.success) {
        console.error('\x1b[31mMissing required dependencies\x1b[0m');
        console.log(dependencyChecker.generateInstallationInstructions(dependencyResults));
        return false;
      }
      
      console.log('\x1b[32m✓ All required dependencies are installed\x1b[0m');
      
      // Get dependency order for services
      const serviceOrder = this.serviceManager.getDependencyOrder();
      console.log(`Starting services in order: ${serviceOrder.join(' → ')}`);
      
      // Start services in sequence
      for (const serviceName of serviceOrder) {
        const result = await this.serviceManager.startService(serviceName);
        if (!result || !result.success) {
          console.error(`\x1b[31mFailed to start ${serviceName}\x1b[0m`);
          return false;
        }
      }
      
      // Verify all services are healthy
      const health = await this.healthChecker.checkAllServices();
      if (health.overall !== 'healthy') {
        console.error('\x1b[31mNot all services are healthy:\x1b[0m');
        console.log(JSON.stringify(health, null, 2));
        return false;
      }
      
      // Report success
      const startupTime = (new Date() - this.initTime) / 1000;
      console.log('\x1b[32m✓ Platform started successfully\x1b[0m');
      console.log(`\x1b[32m✓ Startup completed in ${startupTime.toFixed(2)} seconds\x1b[0m`);
      this.displayServiceUrls();
      
      return true;
    } catch (error) {
      errorHandler.handleError(error, 'orchestrator.startPlatform');
      return false;
    }
  }

  /**
   * Stop all platform services in reverse order
   */
  async shutdownPlatform() {
    try {
      if (!this.serviceManager) {
        console.log('No services to shut down');
        return true;
      }
      
      await this.serviceManager.stopAllServices();
      console.log('\x1b[32m✓ Platform shutdown complete\x1b[0m');
      return true;
    } catch (error) {
      errorHandler.handleError(error, 'orchestrator.shutdownPlatform');
      return false;
    }
  }

  /**
   * Display URLs for accessing services
   */
  displayServiceUrls() {
    console.log('\x1b[36m===============================================\x1b[0m');
    console.log('\x1b[36m             Service Access URLs               \x1b[0m');
    console.log('\x1b[36m===============================================\x1b[0m');
    
    const services = this.config.services;
    
    // Frontend URL
    console.log(`\x1b[36m→ Frontend:\x1b[0m http://localhost:${services.frontend.port}`);
    
    // Backend URL - Check for actual port
    let backendPort = services.backend.port;
    try {
      // Try to check for actual port in selected-port.txt
      const fs = require('fs');
      const path = require('path');
      const backendDir = path.resolve(__dirname, '../backend');
      const portFilePath = path.join(backendDir, 'selected-port.txt');
      
      if (fs.existsSync(portFilePath)) {
        const portContent = fs.readFileSync(portFilePath, 'utf8').trim();
        // Also check server output for "Server running on port X" message
        if (portContent) {
          const actualPort = parseInt(portContent, 10);
          if (!isNaN(actualPort)) {
            backendPort = actualPort;
          }
        }
      }
    } catch (error) {
      console.warn(`Could not determine actual backend port: ${error.message}`);
    }
    
    console.log(`\x1b[36m→ Backend API:\x1b[0m http://localhost:${backendPort}/api`);
    console.log(`\x1b[36m→ Backend API Docs:\x1b[0m http://localhost:${backendPort}/api-docs`);
    
    // Bot microservice URL
    const botPort = services.bot.port;
    console.log(`\x1b[36m→ Bot Microservice API:\x1b[0m http://localhost:${botPort}/api`);
    
    console.log('\x1b[36m===============================================\x1b[0m');
    console.log('\x1b[33mPress Ctrl+C to stop all services\x1b[0m');
  }
}

// Run as main script
if (require.main === module) {
  const orchestrator = new Orchestrator();
  
  // Handle command line arguments
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node orchestrator.js [options]');
    console.log('Options:');
    console.log('  --help, -h     Show this help message');
    console.log('  --stop, -s     Stop all services');
    process.exit(0);
  }
  
  if (args.includes('--stop') || args.includes('-s')) {
    orchestrator.initialize()
      .then(() => orchestrator.shutdownPlatform())
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Failed to stop services:', error);
        process.exit(1);
      });
  } else {
    // Default: start platform
    orchestrator.startPlatform()
      .then(success => {
        if (!success) {
          console.error('\x1b[31mPlatform startup failed\x1b[0m');
          process.exit(1);
        }
      })
      .catch((error) => {
        console.error('\x1b[31mUnexpected error during startup:\x1b[0m', error);
        process.exit(1);
      });
  }
}

module.exports = Orchestrator;