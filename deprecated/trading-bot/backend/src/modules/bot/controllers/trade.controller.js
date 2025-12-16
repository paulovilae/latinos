const botMicroserviceService = require('../services/botMicroservice.service');

/**
 * Get all trades history
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.getAllTrades = async (req, res, next) => {
  try {
    const trades = await botMicroserviceService.getAllTrades();
    res.status(200).json({
      success: true,
      data: trades,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get currently active trades
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.getCurrentTrades = async (req, res, next) => {
  try {
    const currentTrades = await botMicroserviceService.getCurrentTrades();
    res.status(200).json({
      success: true,
      data: currentTrades,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get performance metrics
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.getPerformanceMetrics = async (req, res, next) => {
  try {
    const metrics = await botMicroserviceService.getPerformanceMetrics();
    res.status(200).json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};