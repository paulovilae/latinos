/**
 * Configuration Manager
 * Handles loading, validating, and providing configuration for all services
 */

const fs = require('fs');
const path = require('path');

class ConfigManager {
  constructor() {
    this.config = null;
  }

  /**
   * Load configuration from default file and override with environment variables
   * @returns {Object} The loaded and processed configuration
   */
  loadConfig() {
    try {
      // Determine configuration file path
      let configPath;
      
      if (process.env.PLATFORM_CONFIG_PATH) {
        // Use custom configuration file if specified
        configPath = path.resolve(process.env.PLATFORM_CONFIG_PATH);
        console.log(`\x1b[36mLoading custom configuration from: ${configPath}\x1b[0m`);
      } else {
        // Use default configuration file
        configPath = path.join(__dirname, 'platform-config.js');
        console.log(`\x1b[36mLoading default configuration from: ${configPath}\x1b[0m`);
      }
      
      // Check if configuration file exists
      if (!fs.existsSync(configPath)) {
        throw new Error(`Configuration file not found: ${configPath}`);
      }
      
      // Clear require cache to ensure fresh load
      delete require.cache[require.resolve(configPath)];
      
      // Load the configuration
      this.config = require(configPath);
      console.log(`\x1b[32m✓ Configuration loaded successfully\x1b[0m`);
      
      // Apply environment variable overrides
      this.applyEnvironmentOverrides();
      
      // Validate the configuration
      this.validateConfig();
      
      return this.config;
    } catch (error) {
      console.error('\x1b[31mFailed to load configuration:\x1b[0m', error.message);
      throw new Error(`Configuration error: ${error.message}`);
    }
  }

  /**
   * Apply environment variable overrides to configuration
   */
  applyEnvironmentOverrides() {
    let overridesApplied = false;
    
    // Override platform settings
    if (process.env.PLATFORM_MODE) {
      console.log(`\x1b[36mApplying environment override: PLATFORM_MODE=${process.env.PLATFORM_MODE}\x1b[0m`);
      this.config.platform.mode = process.env.PLATFORM_MODE;
      overridesApplied = true;
    }
    
    if (process.env.PLATFORM_LOG_LEVEL) {
      console.log(`\x1b[36mApplying environment override: PLATFORM_LOG_LEVEL=${process.env.PLATFORM_LOG_LEVEL}\x1b[0m`);
      this.config.platform.logLevel = process.env.PLATFORM_LOG_LEVEL;
      overridesApplied = true;
    }
    
    // Override service ports if specified in environment
    if (process.env.FRONTEND_PORT) {
      const port = parseInt(process.env.FRONTEND_PORT, 10);
      console.log(`\x1b[36mApplying environment override: FRONTEND_PORT=${port}\x1b[0m`);
      this.config.services.frontend.port = port;
      overridesApplied = true;
    }
    
    if (process.env.BACKEND_PORT) {
      const port = parseInt(process.env.BACKEND_PORT, 10);
      if (!isNaN(port)) {
        console.log(`\x1b[36mApplying environment override: BACKEND_PORT=${port}\x1b[0m`);
        // If specific port is set, remove the port range
        this.config.services.backend.port = port;
        delete this.config.services.backend.portRange;
        overridesApplied = true;
      } else {
        console.log(`\x1b[33mWarning: Invalid BACKEND_PORT value "${process.env.BACKEND_PORT}", using default port range\x1b[0m`);
      }
    }
    
    if (process.env.BOT_PORT) {
      const port = parseInt(process.env.BOT_PORT, 10);
      console.log(`\x1b[36mApplying environment override: BOT_PORT=${port}\x1b[0m`);
      this.config.services.bot.port = port;
      overridesApplied = true;
    }
    
    // Check for custom config path
    if (process.env.PLATFORM_CONFIG_PATH) {
      console.log(`\x1b[36mCustom configuration path specified: ${process.env.PLATFORM_CONFIG_PATH}\x1b[0m`);
      // Note: The actual loading of the custom config is done in loadConfig
    }
    
    if (overridesApplied) {
      console.log('\x1b[32m✓ Environment overrides applied\x1b[0m');
    }
  }

  /**
   * Validate the configuration for required values and consistency
   */
  validateConfig() {
    // Check if required services are defined
    const requiredServices = ['frontend', 'backend', 'bot'];
    for (const service of requiredServices) {
      if (!this.config.services[service]) {
        throw new Error(`Required service '${service}' is not defined in configuration`);
      }
    }
    
    // Validate each service configuration
    for (const [name, service] of Object.entries(this.config.services)) {
      if (!service.command) {
        throw new Error(`Service '${name}' is missing required 'command' property`);
      }
      
      if (!service.directory) {
        throw new Error(`Service '${name}' is missing required 'directory' property`);
      }
      
      // Ensure either port or portRange is defined
      if (!service.port && !service.portRange) {
        throw new Error(`Service '${name}' must define either 'port' or 'portRange'`);
      }
      
      // Validate port range if defined
      if (service.portRange && (!Array.isArray(service.portRange) || service.portRange.length !== 2)) {
        throw new Error(`Service '${name}' has invalid 'portRange' format. Expected [min, max]`);
      }
      
      // Validate dependencies are defined services
      if (service.dependencies) {
        for (const dependency of service.dependencies) {
          if (!this.config.services[dependency]) {
            throw new Error(`Service '${name}' has undefined dependency '${dependency}'`);
          }
        }
      }
    }
  }

  /**
   * Get the full configuration
   * @returns {Object} The current configuration
   */
  getConfig() {
    if (!this.config) {
      return this.loadConfig();
    }
    return this.config;
  }

  /**
   * Get configuration for a specific service
   * @param {string} serviceName The name of the service
   * @returns {Object} The service configuration
   */
  getServiceConfig(serviceName) {
    if (!this.config) {
      this.loadConfig();
    }
    
    if (!this.config.services[serviceName]) {
      throw new Error(`Service '${serviceName}' not found in configuration`);
    }
    
    return this.config.services[serviceName];
  }
}

module.exports = new ConfigManager();