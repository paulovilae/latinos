/**
 * Health Checker
 * Verifies services are operational after startup
 */

const http = require('http');
const https = require('https');
const errorHandler = require('./error-handler');

class HealthChecker {
  constructor(config) {
    this.config = config;
  }

  /**
   * Wait for a service to become healthy
   * @param {string} serviceName Name of the service
   * @param {Object} options Options for health check
   * @returns {Promise<Object>} Health check result
   */
  async waitForService(serviceName, options = {}) {
    const serviceConfig = this.config.services[serviceName];
    const timeout = options.timeout || serviceConfig.healthTimeout || 30000;
    const maxAttempts = options.retryAttempts || this.config.platform.retryAttempts || 3;
    
    console.log(`Waiting for ${serviceName} to become healthy (timeout: ${timeout}ms, attempts: ${maxAttempts})...`);
    
    let attempts = 0;
    const startTime = Date.now();
    
    while (attempts < maxAttempts && (Date.now() - startTime) < timeout) {
      try {
        const health = await this.checkServiceHealth(serviceName);
        if (health.status === 'healthy') {
          console.log(`\x1b[32m✓ ${serviceName} is healthy\x1b[0m`);
          return health;
        }
        console.log(`\x1b[33m! ${serviceName} is not healthy yet: ${health.reason}\x1b[0m`);
      } catch (error) {
        console.log(`\x1b[33m! Health check failed for ${serviceName}: ${error.message}\x1b[0m`);
      }
      
      attempts++;
      if (attempts < maxAttempts && (Date.now() - startTime) < timeout) {
        const delayMs = Math.min(1000 * attempts, 5000); // Exponential backoff with cap
        console.log(`Retrying in ${delayMs}ms (attempt ${attempts}/${maxAttempts})...`);
        await this.delay(delayMs);
      }
    }
    
    const errorMessage = `Service ${serviceName} failed to become healthy within timeout`;
    throw new Error(errorMessage);
  }
  
  /**
   * Check health status of a specific service
   * @param {string} serviceName Name of the service
   * @returns {Promise<Object>} Health check result
   */
  async checkServiceHealth(serviceName) {
    const serviceConfig = this.config.services[serviceName];
    const port = serviceConfig.port;
    const healthEndpoint = serviceConfig.healthEndpoint || '/';
    const url = `http://localhost:${port}${healthEndpoint}`;
    
    try {
      const responseData = await this.makeRequest(url, 5000);
      
      // For simple endpoints that don't return JSON, just check if we get a response
      if (serviceConfig.simpleCheck) {
        return {
          status: 'healthy',
          details: { message: 'Service responded successfully' }
        };
      }
      
      // Try to parse JSON response if possible
      try {
        const data = JSON.parse(responseData);
        return {
          status: 'healthy',
          details: data
        };
      } catch (e) {
        // If not JSON but we got a response, consider it healthy
        return {
          status: 'healthy',
          details: { message: 'Service responded successfully (non-JSON)' }
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        reason: error.message
      };
    }
  }
  
  /**
   * Check health of all services
   * @returns {Promise<Object>} Health status for all services
   */
  async checkAllServices() {
    const results = {};
    
    for (const serviceName of Object.keys(this.config.services)) {
      try {
        results[serviceName] = await this.checkServiceHealth(serviceName);
      } catch (error) {
        results[serviceName] = {
          status: 'error',
          reason: error.message
        };
      }
    }
    
    // Determine overall health
    const allHealthy = Object.values(results).every(r => r.status === 'healthy');
    
    return {
      overall: allHealthy ? 'healthy' : 'unhealthy',
      services: results,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Make HTTP request with timeout
   * @param {string} url URL to request
   * @param {number} timeout Timeout in ms
   * @returns {Promise<string>} Response data
   */
  makeRequest(url, timeout) {
    return new Promise((resolve, reject) => {
      const lib = url.startsWith('https') ? https : http;
      const request = lib.get(url, (response) => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return reject(new Error(`Health check returned status ${response.statusCode}`));
        }
        
        const data = [];
        response.on('data', chunk => data.push(chunk));
        response.on('end', () => resolve(Buffer.concat(data).toString()));
      });
      
      request.on('error', reject);
      
      request.setTimeout(timeout, () => {
        request.abort();
        reject(new Error(`Health check timed out after ${timeout}ms`));
      });
    });
  }
  
  /**
   * Delay execution for specified milliseconds
   * @param {number} ms Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = HealthChecker;