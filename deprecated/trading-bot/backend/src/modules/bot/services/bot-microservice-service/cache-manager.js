/**
 * Cache manager for bot microservice
 * Provides Redis and in-memory cache functionality
 */

const NodeCache = require('node-cache');
const { Redis } = require('ioredis');
const { createLogger, format, transports } = require('winston');

// Configure logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/bot-microservice.log' })
  ]
});

// Configure Redis client if enabled
let redisClient;
const useRedis = process.env.USE_REDIS === 'true';
if (useRedis) {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD || '',
      db: process.env.REDIS_DB || 0,
    });
    logger.info('Redis client connected successfully');
  } catch (error) {
    logger.error(`Failed to connect to Redis: ${error.message}`);
  }
}

// In-memory cache fallback
const memoryCache = new NodeCache({
  stdTTL: 60, // Default TTL in seconds
  checkperiod: 120, // Check for expired keys every 2 minutes
});

/**
 * Sets a value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to store
 * @param {number} ttl - Time to live in seconds
 */
async function setCacheValue(key, value, ttl) {
  try {
    if (useRedis && redisClient) {
      await redisClient.setex(key, ttl, JSON.stringify(value));
    } else {
      memoryCache.set(key, value, ttl);
    }
    logger.debug(`Cache set for key: ${key}`);
  } catch (error) {
    logger.error(`Failed to set cache for key ${key}: ${error.message}`);
  }
}

/**
 * Gets a value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} - Cached value or null
 */
async function getCacheValue(key) {
  try {
    if (useRedis && redisClient) {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } else {
      return memoryCache.get(key) || null;
    }
  } catch (error) {
    logger.error(`Failed to get cache for key ${key}: ${error.message}`);
    return null;
  }
}

/**
 * Invalidates a cache key
 * @param {string} key - Cache key to invalidate
 */
async function invalidateCache(key) {
  try {
    if (useRedis && redisClient) {
      await redisClient.del(key);
    } else {
      memoryCache.del(key);
    }
    logger.debug(`Cache invalidated for key: ${key}`);
  } catch (error) {
    logger.error(`Failed to invalidate cache for key ${key}: ${error.message}`);
  }
}

module.exports = {
  logger,
  setCacheValue,
  getCacheValue,
  invalidateCache
};