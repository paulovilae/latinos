const rateLimit = require('express-rate-limit');

/**
 * Rate limiting middleware for authentication routes
 * Limits login attempts to prevent brute force attacks
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true // Skip rate limiting for successful authentication requests
});

/**
 * Rate limiting middleware for general API routes
 * Prevents API abuse
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many requests. Please try again later.'
  }
});

/**
 * Rate limiting middleware for account creation
 * Prevents mass account creation
 */
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 accounts per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Too many accounts created from this IP. Please try again after an hour.'
  }
});

module.exports = {
  authLimiter,
  apiLimiter,
  createAccountLimiter
};