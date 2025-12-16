/**
 * @fileOverview Monitoring service for bot microservice integration
 * @module MonitoringService
 * @description Provides performance tracking and error logging for the bot module API
 */

const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const path = require('path');

/**
 * Ensures log directory exists, creating it if necessary
 */
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Configure formatter
const formatter = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
);

// Create performance logger
const performanceLogger = createLogger({
  level: 'info',
  format: formatter,
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(logDir, 'bot-performance.log') })
  ]
});

// Create error logger
const errorLogger = createLogger({
  level: 'error',
  format: formatter,
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(logDir, 'bot-error.log') })
  ]
});

/**
 * Tracks API endpoint performance metrics
 *
 * @function trackPerformance
 * @param {string} endpoint - API endpoint path (e.g., '/api/bot/formulas')
 * @param {number} responseTime - Response time in milliseconds
 * @description Logs API performance metrics to both console and file for monitoring and analysis
 * @example
 * // Track performance of a formula API call
 * trackPerformance('/api/bot/formulas', 125);
 */
exports.trackPerformance = (endpoint, responseTime) => {
  performanceLogger.info(`${endpoint} - ${responseTime}ms`);
};

/**
 * Logs API endpoint errors with context for debugging
 *
 * @function trackError
 * @param {string} endpoint - API endpoint path where the error occurred
 * @param {Error} error - Error object that was thrown
 * @param {object} [requestData={}] - Request data for debugging context
 * @description Logs detailed error information including stack trace and request context
 * to help with troubleshooting API issues
 * @example
 * // Log an error that occurred during formula creation
 * trackError('/api/bot/formulas', new Error('Invalid formula parameters'), { body: req.body });
 */
exports.trackError = (endpoint, error, requestData = {}) => {
  errorLogger.error(`${endpoint} - ${error.message}`, {
    stack: error.stack,
    requestData: JSON.stringify(requestData)
  });
};

/**
 * Express middleware for tracking API performance metrics
 *
 * @function performanceMiddleware
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @description Measures and logs the response time for each API request
 * @example
 * // Apply to all bot routes
 * router.use(performanceMiddleware);
 */
exports.performanceMiddleware = (req, res, next) => {
  const start = Date.now();
  
  // Once response is finished, log the performance
  res.on('finish', () => {
    const duration = Date.now() - start;
    exports.trackPerformance(`${req.method} ${req.originalUrl}`, duration);
  });
  
  next();
};

/**
 * Express middleware for tracking API errors
 *
 * @function errorMiddleware
 * @param {Error} err - Error object from previous middleware
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 * @description Logs detailed error information when an exception occurs in the API
 * @example
 * // Apply as error handler
 * app.use('/api/bot', botRoutes);
 * app.use(errorMiddleware);
 */
exports.errorMiddleware = (err, req, res, next) => {
  exports.trackError(`${req.method} ${req.originalUrl}`, err, {
    body: req.body,
    params: req.params,
    query: req.query
  });
  
  // Pass to next error handler
  next(err);
};