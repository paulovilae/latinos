/**
 * Trade service for bot microservice
 * Handles all trade and performance-related operations
 */

const { makeRequest } = require('./http-client');
const { setCacheValue, getCacheValue, logger } = require('./cache-manager');
const { CACHE_KEYS, CACHE_TTL } = require('./config');

/**
 * Retrieves the complete trading history from the bot microservice
 *
 * @returns {Promise<Array>} List of historical trades with their outcomes
 * @throws {Error} When microservice connection fails
 * @example
 * // Get all trade history
 * const tradeHistory = await tradeService.getAllTrades();
 * console.log(`Retrieved ${tradeHistory.length} historical trades`);
 */
async function getAllTrades() {
  try {
    // Check cache first
    const cachedTrades = await getCacheValue(CACHE_KEYS.TRADES);
    if (cachedTrades) {
      logger.debug('Returning cached trades');
      return cachedTrades;
    }

    // Fetch from microservice
    const trades = await makeRequest('GET', '/api/trades');
    
    // Update cache
    await setCacheValue(CACHE_KEYS.TRADES, trades, CACHE_TTL.TRADES);
    
    return trades;
  } catch (error) {
    logger.error(`Failed to get trades: ${error.message}`);
    throw new Error(`Failed to fetch trades: ${error.message}`);
  }
}

/**
 * Retrieves the currently active trades from the bot microservice
 *
 * @returns {Promise<Array>} List of active trades that haven't been filled or cancelled
 * @throws {Error} When microservice connection fails
 * @example
 * // Get current active trades
 * const activeTrades = await tradeService.getCurrentTrades();
 * console.log(`Currently ${activeTrades.length} active trades`);
 */
async function getCurrentTrades() {
  try {
    // Check cache first
    const cachedTrades = await getCacheValue(CACHE_KEYS.CURRENT_TRADES);
    if (cachedTrades) {
      logger.debug('Returning cached current trades');
      return cachedTrades;
    }

    // Fetch from microservice
    const currentTrades = await makeRequest('GET', '/api/trades/current');
    
    // Update cache with shorter TTL for current trades
    await setCacheValue(CACHE_KEYS.CURRENT_TRADES, currentTrades, CACHE_TTL.CURRENT_TRADES);
    
    return currentTrades;
  } catch (error) {
    logger.error(`Failed to get current trades: ${error.message}`);
    throw new Error(`Failed to fetch current trades: ${error.message}`);
  }
}

/**
 * Retrieves trading performance metrics from the bot microservice
 *
 * @returns {Promise<object>} Comprehensive performance metrics including
 *                           success rates, profits, and symbol-specific data
 * @throws {Error} When microservice connection fails
 * @example
 * // Get performance metrics
 * const metrics = await tradeService.getPerformanceMetrics();
 * console.log(`Overall success rate: ${metrics.success_rate}%`);
 * console.log(`Total profit: $${metrics.total_profit}`);
 */
async function getPerformanceMetrics() {
  try {
    // Check cache first
    const cachedMetrics = await getCacheValue(CACHE_KEYS.PERFORMANCE);
    if (cachedMetrics) {
      logger.debug('Returning cached performance metrics');
      return cachedMetrics;
    }

    // Fetch from microservice
    const metrics = await makeRequest('GET', '/api/performance');
    
    // Update cache
    await setCacheValue(CACHE_KEYS.PERFORMANCE, metrics, CACHE_TTL.PERFORMANCE);
    
    return metrics;
  } catch (error) {
    logger.error(`Failed to get performance metrics: ${error.message}`);
    throw new Error(`Failed to fetch performance metrics: ${error.message}`);
  }
}

module.exports = {
  getAllTrades,
  getCurrentTrades,
  getPerformanceMetrics
};