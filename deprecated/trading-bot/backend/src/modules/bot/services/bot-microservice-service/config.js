/**
 * Bot Microservice configuration and constants
 */

// Base microservice configuration
const BOT_MICROSERVICE_URL = process.env.BOT_MICROSERVICE_URL || 'http://localhost:5555';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds
const CONNECTION_TIMEOUT = 5000; // 5 seconds timeout for health checks

// Cache keys and TTLs
const CACHE_KEYS = {
  FORMULAS: 'bot:formulas',
  FORMULA: (id) => `bot:formula:${id}`,
  TRADES: 'bot:trades',
  CURRENT_TRADES: 'bot:trades:current',
  PERFORMANCE: 'bot:performance',
  SYSTEM_STATUS: 'bot:system:status',
};

const CACHE_TTL = {
  FORMULAS: 30, // 30 seconds
  FORMULA: 30,
  TRADES: 30,
  CURRENT_TRADES: 15, // 15 seconds (more frequent updates)
  PERFORMANCE: 60, // 1 minute
  SYSTEM_STATUS: 10, // 10 seconds
};

module.exports = {
  BOT_MICROSERVICE_URL,
  MAX_RETRIES,
  RETRY_DELAY,
  CONNECTION_TIMEOUT,
  CACHE_KEYS,
  CACHE_TTL,
};