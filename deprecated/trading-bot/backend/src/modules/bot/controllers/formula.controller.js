const botMicroserviceService = require('../services/botMicroservice.service');

/**
 * Controller for handling trading formula API endpoints
 * @module FormulaController
 */

/**
 * Retrieves all trading formula configurations
 *
 * @async
 * @function getAllFormulas
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {Promise<void>} Promise representing the completion of the request handling
 * @description Fetches all formula configurations from the bot microservice and returns them
 * with a standardized response format.
 *
 * @example
 * // Route definition
 * // GET /api/bot/formulas
 */
exports.getAllFormulas = async (req, res, next) => {
  try {
    const formulas = await botMicroserviceService.getAllFormulas();
    res.status(200).json({
      success: true,
      data: formulas,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves a specific formula configuration by ID
 *
 * @async
 * @function getFormulaById
 * @param {object} req - Express request object
 * @param {object} req.params - Request URL parameters
 * @param {string} req.params.id - Formula ID to retrieve
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {Promise<void>} Promise representing the completion of the request handling
 * @description Fetches a specific formula by its ID from the bot microservice.
 * Returns 404 if the formula is not found.
 *
 * @example
 * // Route definition
 * // GET /api/bot/formulas/:id
 */
exports.getFormulaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const formula = await botMicroserviceService.getFormulaById(id);
    
    if (!formula) {
      return res.status(404).json({
        success: false,
        error: 'Formula not found',
      });
    }

    res.status(200).json({
      success: true,
      data: formula,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Formula not found',
      });
    }
    next(error);
  }
};

/**
 * Creates a new trading formula configuration
 *
 * @async
 * @function createFormula
 * @param {object} req - Express request object
 * @param {object} req.body - Request body containing formula data
 * @param {string} req.body.name - Name of the formula
 * @param {string} req.body.symbol - Trading symbol (e.g., 'AAPL')
 * @param {string} [req.body.exchange] - Exchange name (default: 'AMEX')
 * @param {string} req.body.interval - Time interval ('1m', '5m', '15m', '1h', '1d')
 * @param {object} req.body.parameters - Formula-specific parameters
 * @param {boolean} [req.body.is_active] - Whether the formula is active
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {Promise<void>} Promise representing the completion of the request handling
 * @description Creates a new trading formula configuration with the provided data.
 * Returns 400 if validation fails.
 *
 * @example
 * // Route definition
 * // POST /api/bot/formulas
 */
exports.createFormula = async (req, res, next) => {
  try {
    const formulaData = req.body;
    const newFormula = await botMicroserviceService.createFormula(formulaData);
    
    res.status(201).json({
      success: true,
      data: newFormula,
    });
  } catch (error) {
    if (error.message.includes('Missing required field')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

/**
 * Updates an existing formula configuration
 *
 * @async
 * @function updateFormula
 * @param {object} req - Express request object
 * @param {object} req.params - Request URL parameters
 * @param {string} req.params.id - Formula ID to update
 * @param {object} req.body - Request body containing formula data to update
 * @param {string} [req.body.name] - Name of the formula
 * @param {string} [req.body.symbol] - Trading symbol
 * @param {string} [req.body.exchange] - Exchange name
 * @param {string} [req.body.interval] - Time interval
 * @param {object} [req.body.parameters] - Formula-specific parameters
 * @param {boolean} [req.body.is_active] - Whether the formula is active
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {Promise<void>} Promise representing the completion of the request handling
 * @description Updates an existing formula with the provided data.
 * Returns 404 if the formula is not found.
 *
 * @example
 * // Route definition
 * // PUT /api/bot/formulas/:id
 */
exports.updateFormula = async (req, res, next) => {
  try {
    const { id } = req.params;
    const formulaData = req.body;
    
    const updatedFormula = await botMicroserviceService.updateFormula(id, formulaData);
    
    res.status(200).json({
      success: true,
      data: updatedFormula,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Formula not found',
      });
    }
    next(error);
  }
};

/**
 * Deletes a formula configuration
 *
 * @async
 * @function deleteFormula
 * @param {object} req - Express request object
 * @param {object} req.params - Request URL parameters
 * @param {string} req.params.id - Formula ID to delete
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @returns {Promise<void>} Promise representing the completion of the request handling
 * @description Deletes a specific formula configuration by its ID.
 * Returns 404 if the formula is not found.
 *
 * @example
 * // Route definition
 * // DELETE /api/bot/formulas/:id
 */
exports.deleteFormula = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await botMicroserviceService.deleteFormula(id);
    
    res.status(200).json({
      success: true,
      message: 'Formula deleted successfully',
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Formula not found',
      });
    }
    next(error);
  }
};