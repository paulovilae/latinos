/**
 * Formula service for bot microservice
 * Handles all formula configuration operations
 */

const { makeRequest } = require('./http-client');
const { setCacheValue, getCacheValue, invalidateCache, logger } = require('./cache-manager');
const { CACHE_KEYS, CACHE_TTL } = require('./config');

/**
 * Retrieves all trading formula configurations from the bot microservice
 *
 * @returns {Promise<Array>} List of formula configurations with their parameters and status
 * @throws {Error} When the microservice connection fails or returns an error
 * @example
 * // Get all formulas
 * const formulas = await formulaService.getAllFormulas();
 * console.log(`Found ${formulas.length} formulas`);
 */
async function getAllFormulas() {
  try {
    // Check cache first
    const cachedFormulas = await getCacheValue(CACHE_KEYS.FORMULAS);
    if (cachedFormulas) {
      logger.debug('Returning cached formulas');
      return cachedFormulas;
    }

    // Fetch from microservice
    const formulas = await makeRequest('GET', '/api/formulas');
    
    // Update cache
    await setCacheValue(CACHE_KEYS.FORMULAS, formulas, CACHE_TTL.FORMULAS);
    
    return formulas;
  } catch (error) {
    logger.error(`Failed to get formulas: ${error.message}`);
    throw new Error(`Failed to fetch formula configurations: ${error.message}`);
  }
}

/**
 * Retrieves a specific formula configuration by its unique identifier
 *
 * @param {string} id - The unique identifier of the formula to retrieve
 * @returns {Promise<object>} The formula configuration object
 * @throws {Error} When the formula is not found or microservice connection fails
 * @example
 * // Get a specific formula
 * const formula = await formulaService.getFormulaById('550e8400-e29b-41d4-a716-446655440000');
 * console.log(`Retrieved formula: ${formula.name}`);
 */
async function getFormulaById(id) {
  try {
    if (!id) {
      throw new Error('Formula ID is required');
    }

    // Check cache first
    const cacheKey = CACHE_KEYS.FORMULA(id);
    const cachedFormula = await getCacheValue(cacheKey);
    if (cachedFormula) {
      logger.debug(`Returning cached formula for ID: ${id}`);
      return cachedFormula;
    }

    // Fetch from microservice
    const formula = await makeRequest('GET', `/api/formulas/${id}`);
    
    // Update cache
    await setCacheValue(cacheKey, formula, CACHE_TTL.FORMULA);
    
    return formula;
  } catch (error) {
    logger.error(`Failed to get formula ${id}: ${error.message}`);
    throw new Error(`Failed to fetch formula: ${error.message}`);
  }
}

/**
 * Creates a new trading formula configuration in the bot microservice
 *
 * @param {object} formulaData - The formula configuration data
 * @param {string} formulaData.name - Name of the formula
 * @param {string} formulaData.symbol - Trading symbol (e.g., 'AAPL', 'MSFT')
 * @param {string} formulaData.exchange - Exchange name (default: 'AMEX')
 * @param {string} formulaData.interval - Time interval ('1m', '5m', '15m', '1h', '1d')
 * @param {object} formulaData.parameters - Formula-specific parameters
 * @param {boolean} [formulaData.is_active=true] - Whether the formula is active
 * @returns {Promise<object>} The created formula configuration with generated ID
 * @throws {Error} When validation fails or microservice connection fails
 * @example
 * // Create a new RSI formula
 * const newFormula = await formulaService.createFormula({
 *   name: 'RSI Strategy',
 *   symbol: 'AAPL',
 *   interval: '1h',
 *   parameters: {
 *     rsi_period: 14,
 *     oversold_threshold: 30,
 *     overbought_threshold: 70
 *   }
 * });
 */
async function createFormula(formulaData) {
  try {
    if (!formulaData) {
      throw new Error('Formula data is required');
    }

    // Validate required fields
    const requiredFields = ['name', 'symbol', 'interval', 'parameters'];
    for (const field of requiredFields) {
      if (!formulaData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Create formula via microservice
    const newFormula = await makeRequest('POST', '/api/formulas', formulaData);
    
    // Invalidate formulas cache
    await invalidateCache(CACHE_KEYS.FORMULAS);
    
    return newFormula;
  } catch (error) {
    logger.error(`Failed to create formula: ${error.message}`);
    throw new Error(`Failed to create formula: ${error.message}`);
  }
}

/**
 * Updates an existing formula configuration in the bot microservice
 *
 * @param {string} id - The unique identifier of the formula to update
 * @param {object} formulaData - The updated formula configuration data
 * @param {string} [formulaData.name] - Name of the formula
 * @param {string} [formulaData.symbol] - Trading symbol
 * @param {string} [formulaData.exchange] - Exchange name
 * @param {string} [formulaData.interval] - Time interval
 * @param {object} [formulaData.parameters] - Formula-specific parameters
 * @param {boolean} [formulaData.is_active] - Whether the formula is active
 * @returns {Promise<object>} The updated formula configuration
 * @throws {Error} When formula is not found or microservice connection fails
 * @example
 * // Update a formula's parameters and status
 * const updatedFormula = await formulaService.updateFormula('550e8400-e29b-41d4-a716-446655440000', {
 *   parameters: { rsi_period: 10 },
 *   is_active: false
 * });
 */
async function updateFormula(id, formulaData) {
  try {
    if (!id) {
      throw new Error('Formula ID is required');
    }

    if (!formulaData) {
      throw new Error('Formula data is required');
    }

    // Update formula via microservice
    const updatedFormula = await makeRequest('PUT', `/api/formulas/${id}`, formulaData);
    
    // Invalidate caches
    await invalidateCache(CACHE_KEYS.FORMULAS);
    await invalidateCache(CACHE_KEYS.FORMULA(id));
    
    return updatedFormula;
  } catch (error) {
    logger.error(`Failed to update formula ${id}: ${error.message}`);
    throw new Error(`Failed to update formula: ${error.message}`);
  }
}

/**
 * Deletes a formula configuration from the bot microservice
 *
 * @param {string} id - The unique identifier of the formula to delete
 * @returns {Promise<object>} Deletion confirmation
 * @throws {Error} When formula is not found or microservice connection fails
 * @example
 * // Delete a formula
 * await formulaService.deleteFormula('550e8400-e29b-41d4-a716-446655440000');
 */
async function deleteFormula(id) {
  try {
    if (!id) {
      throw new Error('Formula ID is required');
    }

    // Delete formula via microservice
    const result = await makeRequest('DELETE', `/api/formulas/${id}`);
    
    // Invalidate caches
    await invalidateCache(CACHE_KEYS.FORMULAS);
    await invalidateCache(CACHE_KEYS.FORMULA(id));
    
    return result;
  } catch (error) {
    logger.error(`Failed to delete formula ${id}: ${error.message}`);
    throw new Error(`Failed to delete formula: ${error.message}`);
  }
}

module.exports = {
  getAllFormulas,
  getFormulaById,
  createFormula,
  updateFormula,
  deleteFormula
};