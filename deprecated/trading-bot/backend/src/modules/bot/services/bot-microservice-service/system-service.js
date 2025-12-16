/**
 * System service for bot microservice
 * Handles system control operations (start, stop, status)
 */

const { makeRequest } = require('./http-client');
const { setCacheValue, getCacheValue, invalidateCache, logger } = require('./cache-manager');
const { CACHE_KEYS, CACHE_TTL, CONNECTION_TIMEOUT } = require('./config');

/**
 * Check if the bot microservice is healthy and connected
 * 
 * @returns {Promise<boolean>} True if the microservice is healthy, false otherwise
 */
async function checkHealth() {
  try {
    // Use a short timeout for health checks to fail fast
    await makeRequest('GET', '/api/health', null, { timeout: CONNECTION_TIMEOUT });
    logger.info('Bot microservice health check successful');
    return true;
  } catch (error) {
    logger.error(`Bot microservice health check failed: ${error.message}`);
    return false;
  }
}

/**
 * Starts the trading system in the bot microservice
 *
 * @returns {Promise<object>} Start confirmation with system status
 * @throws {Error} When system fails to start or microservice connection fails
 * @example
 * // Start the trading system
 * const result = await systemService.startSystem();
 * console.log(`System started with ${result.active_formulas} active formulas`);
 */
async function startSystem() {
  try {
    const result = await makeRequest('POST', '/api/system/start');
    
    // Invalidate system status cache
    await invalidateCache(CACHE_KEYS.SYSTEM_STATUS);
    
    return result;
  } catch (error) {
    logger.error(`Failed to start system: ${error.message}`);
    throw new Error(`Failed to start trading system: ${error.message}`);
  }
}

/**
 * Stops the trading system in the bot microservice
 *
 * @returns {Promise<object>} Stop confirmation with system status
 * @throws {Error} When system fails to stop or microservice connection fails
 * @example
 * // Stop the trading system
 * const result = await systemService.stopSystem();
 * console.log(`System stopped at ${result.updated_at}`);
 */
async function stopSystem() {
  try {
    const result = await makeRequest('POST', '/api/system/stop');
    
    // Invalidate system status cache
    await invalidateCache(CACHE_KEYS.SYSTEM_STATUS);
    
    return result;
  } catch (error) {
    logger.error(`Failed to stop system: ${error.message}`);
    throw new Error(`Failed to stop trading system: ${error.message}`);
  }
}

/**
 * Retrieves the current status of the trading system from the bot microservice
 *
 * @returns {Promise<object>} Current system status including running state,
 *                           active formulas, and execution schedule
 * @throws {Error} When microservice connection fails
 * @example
 * // Get current system status
 * const status = await systemService.getSystemStatus();
 * console.log(`System is currently ${status.status}`);
 * console.log(`Next execution scheduled for: ${status.next_execution}`);
 */
async function getSystemStatus() {
  try {
    // Check cache first
    const cachedStatus = await getCacheValue(CACHE_KEYS.SYSTEM_STATUS);
    if (cachedStatus) {
      logger.debug('Returning cached system status');
      return cachedStatus;
    }

    // Fetch from microservice
    const status = await makeRequest('GET', '/api/system/status');
    
    // Update cache with short TTL for system status
    await setCacheValue(CACHE_KEYS.SYSTEM_STATUS, status, CACHE_TTL.SYSTEM_STATUS);
    
    return status;
  } catch (error) {
    logger.error(`Failed to get system status: ${error.message}`);
    throw new Error(`Failed to fetch system status: ${error.message}`);
  }
}

module.exports = {
  checkHealth,
  startSystem,
  stopSystem,
  getSystemStatus
};