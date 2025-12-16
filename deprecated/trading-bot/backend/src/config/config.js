/**
 * Central configuration module for the backend
 * Loads and validates all environment variables with defaults
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });

/**
 * Environment validation functions
 */
const validators = {
  isNotEmpty: (value) => value !== undefined && value !== '',
  isNumber: (value) => !isNaN(Number(value)),
  isPort: (value) => {
    const port = Number(value);
    return !isNaN(port) && port >= 0 && port <= 65535;
  },
  isBoolean: (value) => typeof value === 'boolean' || value === 'true' || value === 'false',
  isOneOf: (options) => (value) => options.includes(value),
};

/**
 * Validate an environment variable with specified validators
 * @param {string} name - Environment variable name
 * @param {*} value - Environment variable value
 * @param {Function[]} validatorFns - Array of validator functions
 * @returns {boolean} - Whether validation passed
 */
const validateEnv = (name, value, validatorFns = []) => {
  for (const validatorFn of validatorFns) {
    if (!validatorFn(value)) {
      console.warn(`Environment variable ${name} failed validation`);
      return false;
    }
  }
  return true;
};

/**
 * Get an environment variable with validation and default value
 * @param {string} name - Environment variable name
 * @param {*} defaultValue - Default value if not set
 * @param {Function[]} validatorFns - Array of validator functions
 * @returns {*} - Environment variable value or default
 */
const getEnv = (name, defaultValue, validatorFns = []) => {
  const value = process.env[name];
  
  // Use default if value is not set
  if (value === undefined) {
    return defaultValue;
  }
  
  // Validate if validators are provided
  if (validatorFns.length > 0 && !validateEnv(name, value, validatorFns)) {
    console.warn(`Using default value for ${name}: ${defaultValue}`);
    return defaultValue;
  }
  
  return value;
};

/**
 * Get a boolean environment variable
 * @param {string} name - Environment variable name
 * @param {boolean} defaultValue - Default value if not set
 * @returns {boolean} - Environment variable as boolean
 */
const getBoolEnv = (name, defaultValue) => {
  const value = getEnv(name, defaultValue ? 'true' : 'false', [validators.isBoolean]);
  return value === true || value === 'true';
};

/**
 * Get a number environment variable
 * @param {string} name - Environment variable name
 * @param {number} defaultValue - Default value if not set
 * @returns {number} - Environment variable as number
 */
const getNumEnv = (name, defaultValue) => {
  const value = getEnv(name, defaultValue, [validators.isNumber]);
  return Number(value);
};

/**
 * Central configuration object with all environment variables
 */
const config = {
  // General
  nodeEnv: getEnv('NODE_ENV', 'development', [validators.isOneOf(['development', 'test', 'production'])]),
  isProduction: getEnv('NODE_ENV', 'development') === 'production',
  isDevelopment: getEnv('NODE_ENV', 'development') === 'development',
  isTest: getEnv('NODE_ENV', 'development') === 'test',
  
  // Server
  port: getNumEnv('PORT', 3000),
  cookieSecret: getEnv('COOKIE_SECRET', 'default-cookie-secret-for-dev-only'),
  corsOrigin: getEnv('CORS_ORIGIN', '*'),
  
  // JWT Authentication
  jwt: {
    secret: getEnv('JWT_SECRET', 'default-jwt-secret-for-dev-only'),
    accessExpiration: getEnv('JWT_ACCESS_EXPIRATION', '15m'),
    refreshExpiration: getEnv('JWT_REFRESH_EXPIRATION', '7d')
  },
  
  // Database (loaded from database.js, included here for reference)
  db: require('./database')[getEnv('NODE_ENV', 'development')]
};

// Warn about using default secrets in production
if (config.isProduction) {
  if (config.jwt.secret === 'default-jwt-secret-for-dev-only') {
    console.error('WARNING: Using default JWT secret in production!');
  }
  if (config.cookieSecret === 'default-cookie-secret-for-dev-only') {
    console.error('WARNING: Using default cookie secret in production!');
  }
}

module.exports = config;