/**
 * Service Manager
 * Handles the lifecycle of individual services
 */

const fs = require('fs');
const path = require('path');
const platformAdapter = require('./platform-adapter');
const errorHandler = require('./error-handler');
const HealthChecker = require('./health-checker');

class ServiceManager {
  constructor(config) {
    this.config = config;
    this.processes = {};
    this.healthChecker = new HealthChecker(config);
    this.setupShutdownHandlers();
  }

  /**
   * Setup handlers for graceful shutdown
   */
  setupShutdownHandlers() {
    // Handle process termination signals
    ['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => {
      process.on(signal, async () => {
        console.log(`\n${signal} received. Shutting down services...`);
        await this.stopAllServices();
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', async (error) => {
      console.error('Uncaught exception:', error);
      await this.stopAllServices();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
      console.error('Unhandled promise rejection:', reason);
      await this.stopAllServices();
      process.exit(1);
    });
  }

  /**
   * Start a service by name
   * @param {string} serviceName Name of the service to start
   * @returns {Promise<Object>} Service process information
   */
  async startService(serviceName) {
    try {
      console.log(`\n\x1b[34m▶ Starting ${serviceName} service...\x1b[0m`);
      const serviceConfig = this.config.services[serviceName];

      // Check dependencies first
      if (serviceConfig.dependencies && serviceConfig.dependencies.length > 0) {
        for (const dependency of serviceConfig.dependencies) {
          if (!this.isServiceRunning(dependency)) {
            throw new Error(`Dependency '${dependency}' is not running for '${serviceName}'`);
          }
        }
        console.log(`Dependencies for ${serviceName} are satisfied.`);
      }

      // Handle port selection for services with port ranges
      if (serviceConfig.portRange) {
        await this.findAvailablePort(serviceName, serviceConfig);
      }

      // Update environment variables for service
      const env = this.buildEnvironment(serviceName);

      // Ensure the service directory exists
      const directory = path.resolve(serviceConfig.directory);
      if (!fs.existsSync(directory)) {
        throw new Error(`Service directory not found: ${directory}`);
      }

      // Start the service
      const process = await this.spawnServiceProcess(serviceName, serviceConfig, env);
      this.processes[serviceName] = {
        process,
        config: serviceConfig,
        startTime: new Date()
      };

      // Wait for service to be healthy
      try {
        await this.healthChecker.waitForService(serviceName);
        console.log(`\x1b[32m✓ ${serviceName} service started successfully\x1b[0m`);
        
        // Display service URL
        const port = serviceConfig.port;
        let serviceUrl;
        
        if (serviceName === 'frontend') {
          serviceUrl = `http://localhost:${port}`;
          console.log(`\x1b[36m🌐 ${serviceName} is available at: ${serviceUrl}\x1b[0m`);
        } else if (serviceName === 'backend') {
          // Read actual port from log message or selected-port.txt
          let actualPort = port;
          try {
            // Try to check if the server output indicates a different port
            const fs = require('fs');
            const backendDir = path.resolve(__dirname, '../backend');
            const portFilePath = path.join(backendDir, 'selected-port.txt');
            if (fs.existsSync(portFilePath)) {
              const portContent = fs.readFileSync(portFilePath, 'utf8').trim();
              actualPort = parseInt(portContent, 10) || port;
              console.log(`Using actual backend port from file: ${actualPort}`);
            }
          } catch (error) {
            console.warn(`Could not determine actual backend port: ${error.message}`);
          }
          serviceConfig.port = actualPort;
          serviceUrl = `http://localhost:${actualPort}/api`;
          console.log(`\x1b[36m🌐 ${serviceName} API is available at: ${serviceUrl}\x1b[0m`);
        } else if (serviceName === 'bot') {
          serviceUrl = `http://localhost:${port}/api`;
          console.log(`\x1b[36m🌐 ${serviceName} API is available at: ${serviceUrl}\x1b[0m`);
        }
        
        return { success: true, serviceName, serviceUrl };
      } catch (healthError) {
        console.error(`\x1b[31m✗ ${serviceName} service health check failed\x1b[0m`);
        
        // Stop the service if health check fails
        this.stopService(serviceName);
        throw new Error(`Failed to start ${serviceName}: ${healthError.message}`);
      }
    } catch (error) {
      return errorHandler.handleError(error, `startService(${serviceName})`);
    }
  }

  /**
   * Check if a service is currently running
   * @param {string} serviceName Name of the service
   * @returns {boolean} True if service is running
   */
  isServiceRunning(serviceName) {
    return (
      this.processes[serviceName] && 
      this.processes[serviceName].process && 
      !this.processes[serviceName].process.killed
    );
  }

  /**
   * Find an available port for a service
   * @param {string} serviceName Name of the service
   * @param {Object} serviceConfig Service configuration
   */
  async findAvailablePort(serviceName, serviceConfig) {
    if (!serviceConfig.portRange || !Array.isArray(serviceConfig.portRange) || serviceConfig.portRange.length !== 2) {
      return; // No port range to search
    }

    const [startPort, endPort] = serviceConfig.portRange;
    console.log(`Finding available port for ${serviceName} in range ${startPort}-${endPort}...`);
    
    try {
      const port = await platformAdapter.findAvailablePort(startPort, endPort);
      console.log(`Found available port for ${serviceName}: ${port}`);
      
      // Update the service configuration with the found port
      serviceConfig.port = port;
      
      // Save the port to a file for scripts
      if (serviceName === 'backend') {
        try {
          const backendDir = path.resolve(__dirname, '../backend');
          const portFilePath = path.join(backendDir, 'selected-port.txt');
          fs.writeFileSync(portFilePath, port.toString());
          console.log(`Saved selected backend port to ${portFilePath}`);
        } catch (error) {
          console.warn(`Could not save backend port to file: ${error.message}`);
        }
      } else if (serviceName === 'bot') {
        try {
          const botDir = path.resolve(__dirname, '../bot_microservice');
          const portFilePath = path.join(botDir, 'selected-port.txt');
          fs.writeFileSync(portFilePath, port.toString());
          console.log(`Saved selected bot port to ${portFilePath}`);
        } catch (error) {
          console.warn(`Could not save bot port to file: ${error.message}`);
        }
      }
      
      return port;
    } catch (error) {
      throw new Error(`Failed to find available port for ${serviceName}: ${error.message}`);
    }
  }

  /**
   * Spawn a process for a service
   * @param {string} serviceName Name of the service
   * @param {Object} serviceConfig Service configuration
   * @param {Object} env Environment variables
   * @returns {ChildProcess} Spawned process
   */
  spawnServiceProcess(serviceName, serviceConfig, env) {
    const directory = path.resolve(serviceConfig.directory);
    const command = serviceConfig.command;
    
    console.log(`Spawning process for ${serviceName}: ${command} (in ${directory})`);
    
    // For backend service, use pipe for stdout to capture port information
    const stdioOption = serviceName === 'backend' ? ['inherit', 'pipe', 'inherit'] : 'inherit';
    
    const process = platformAdapter.spawnProcess(command, {
      cwd: directory,
      env,
      stdio: stdioOption
    });
    
    // For backend service, capture stdout to detect actual port
    if (serviceName === 'backend' && process.stdout) {
      process.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output); // Still show output in terminal
        
        // Look for actual port in output
        const portMatch = output.match(/Server running on port (\d+)/);
        if (portMatch && portMatch[1]) {
          const actualPort = parseInt(portMatch[1], 10);
          if (actualPort !== serviceConfig.port) {
            console.log(`\x1b[33mDetected actual backend port: ${actualPort} (different from selected port ${serviceConfig.port})\x1b[0m`);
            serviceConfig.port = actualPort;
            
            // Update the port file
            try {
              const backendDir = path.resolve(__dirname, '../backend');
              const portFilePath = path.join(backendDir, 'selected-port.txt');
              fs.writeFileSync(portFilePath, actualPort.toString());
              console.log(`Updated selected port to ${actualPort}`);
            } catch (error) {
              console.warn(`Could not save actual port to file: ${error.message}`);
            }
          }
        }
      });
    }
    
    // Log process events
    process.on('error', (error) => {
      console.error(`\x1b[31m✗ ${serviceName} process error: ${error.message}\x1b[0m`);
    });
    
    process.on('exit', (code, signal) => {
      if (code !== null) {
        console.log(`\x1b[33m! ${serviceName} process exited with code ${code}\x1b[0m`);
      } else if (signal !== null) {
        console.log(`\x1b[33m! ${serviceName} process killed with signal ${signal}\x1b[0m`);
      }
      
      // Remove from running processes
      delete this.processes[serviceName];
    });
    
    return process;
  }

  /**
   * Build environment variables for a service
   * @param {string} serviceName Name of the service
   * @returns {Object} Environment variables
   */
  buildEnvironment(serviceName) {
    const env = { ...process.env };
    const serviceConfig = this.config.services[serviceName];
    
    // Add NODE_ENV if not set
    if (!env.NODE_ENV) {
      env.NODE_ENV = this.config.platform.mode || 'development';
    }
    
    // Add service-specific variables
    if (serviceName === 'frontend') {
      const backendPort = this.config.services.backend.port;
      env.VITE_API_URL = `http://localhost:${backendPort}`;
      env.PORT = serviceConfig.port.toString();
    } else if (serviceName === 'backend') {
      env.PORT = serviceConfig.port.toString();
      
      // Add bot microservice URL for backend
      const botPort = this.config.services.bot.port;
      env.BOT_MICROSERVICE_URL = `http://localhost:${botPort}`;
    } else if (serviceName === 'bot') {
      env.PORT = serviceConfig.port.toString();
      env.BOT_PORT = serviceConfig.port.toString();
    }
    
    return env;
  }

  /**
   * Stop a specific service
   * @param {string} serviceName Name of the service
   * @returns {Promise<boolean>} True if service was stopped
   */
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
      
      // Send kill signal with special handling for different service types
      if (platformAdapter.isWindows) {
        if (serviceName === 'bot') {
          // For Python processes on Windows, use taskkill to ensure all child processes are terminated
          console.log(`Using taskkill to terminate bot process and children (PID ${process.pid})`);
          const { exec } = require('child_process');
          exec(`taskkill /F /T /PID ${process.pid}`);
        } else {
          // For Node.js processes on Windows
          process.kill();
        }
      } else {
        // SIGTERM for graceful shutdown on Unix
        process.kill('SIGTERM');
      }
      
      // Wait for process to exit with timeout
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => resolve('timeout'), 5000);
      });
      
      const result = await Promise.race([exitPromise, timeoutPromise]);
      
      if (result === 'timeout') {
        console.log(`\x1b[31m${serviceName} did not exit gracefully, forcing termination...\x1b[0m`);
        
        // Force kill with platform-specific approach
        if (platformAdapter.isWindows) {
          const { exec } = require('child_process');
          exec(`taskkill /F /T /PID ${process.pid}`);
        } else {
          process.kill('SIGKILL');
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

  /**
   * Stop all running services in reverse dependency order
   * @returns {Promise<void>}
   */
  async stopAllServices() {
    console.log('\x1b[33m■ Stopping all services...\x1b[0m');
    
    // Determine reverse dependency order
    const reverseOrder = this.getDependencyOrder().reverse();
    
    // Stop services in reverse order
    for (const serviceName of reverseOrder) {
      if (this.isServiceRunning(serviceName)) {
        await this.stopService(serviceName);
      }
    }
    
    console.log('\x1b[32m✓ All services stopped\x1b[0m');
  }

  /**
   * Get dependency order for starting services
   * @returns {string[]} Services in dependency order
   */
  getDependencyOrder() {
    const visited = new Set();
    const order = [];
    
    const visit = (serviceName) => {
      if (visited.has(serviceName)) return;
      visited.add(serviceName);
      
      const dependencies = this.config.services[serviceName].dependencies || [];
      for (const dependency of dependencies) {
        visit(dependency);
      }
      
      order.push(serviceName);
    };
    
    // Visit each service to build dependency order
    for (const serviceName of Object.keys(this.config.services)) {
      visit(serviceName);
    }
    
    return order;
  }

  /**
   * Get information about running services
   * @returns {Object} Service status information
   */
  getServiceStatus() {
    const status = {};
    
    for (const [name, info] of Object.entries(this.processes)) {
      status[name] = {
        running: this.isServiceRunning(name),
        startTime: info.startTime,
        uptime: info.startTime ? Math.floor((new Date() - info.startTime) / 1000) : 0,
        port: info.config.port
      };
    }
    
    return status;
  }
}

module.exports = ServiceManager;