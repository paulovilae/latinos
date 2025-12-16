const botMicroserviceService = require('../services/botMicroservice.service');

/**
 * Start the trading system
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.startSystem = async (req, res, next) => {
  try {
    const result = await botMicroserviceService.startSystem();
    res.status(200).json({
      success: true,
      message: 'Trading system started successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stop the trading system
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.stopSystem = async (req, res, next) => {
  try {
    const result = await botMicroserviceService.stopSystem();
    res.status(200).json({
      success: true,
      message: 'Trading system stopped successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system status
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.getSystemStatus = async (req, res, next) => {
  try {
    const status = await botMicroserviceService.getSystemStatus();
    res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check bot microservice health
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
exports.healthCheck = async (req, res, next) => {
  try {
    // Check connection to bot microservice
    const isConnected = await botMicroserviceService.checkHealth();
    
    if (isConnected) {
      res.status(200).json({
        success: true,
        message: 'Bot microservice is healthy',
        status: 'connected',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Bot microservice is not reachable',
        status: 'disconnected',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check bot microservice health',
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};