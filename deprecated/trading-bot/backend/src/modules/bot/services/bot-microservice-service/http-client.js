/**
 * HTTP client for bot microservice with retry mechanism
 */

const axios = require('axios');
const { logger } = require('./cache-manager');
const { BOT_MICROSERVICE_URL, MAX_RETRIES, RETRY_DELAY } = require('./config');

/**
 * Makes a request to the bot microservice with retry mechanism
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
 * @param {string} endpoint - API endpoint
 * @param {object} data - Request data (for POST/PUT)
 * @param {object} options - Additional request options
 * @returns {Promise<any>} - Response data
 */
async function makeRequest(method, endpoint, data = null, options = {}) {
  let retries = 0;
  const url = `${BOT_MICROSERVICE_URL}${endpoint}`;
  const requestOptions = {
    timeout: options.timeout || 30000, // Default 30 seconds timeout
    ...options
  };

  const executeRequest = async () => {
    try {
      const response = method === 'GET' 
        ? await axios.get(url, requestOptions)
        : method === 'POST'
          ? await axios.post(url, data, requestOptions)
          : method === 'PUT'
            ? await axios.put(url, data, requestOptions)
            : await axios.delete(url, requestOptions);
      
      return response.data;
    } catch (error) {
      // If the error has a specific status code that indicates a client error (4xx),
      // don't retry as these are typically not resolved by retrying
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        logger.error(`Client error (${error.response.status}) for ${url}: ${error.message}`);
        throw new Error(`Client error: ${error.response.status} - ${error.message}`);
      }
      
      if (retries < MAX_RETRIES) {
        retries++;
        logger.warn(`Request to ${url} failed. Retrying (${retries}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
        return executeRequest();
      }
      
      logger.error(`Request to ${url} failed after ${MAX_RETRIES} retries: ${error.message}`);
      throw error;
    }
  };

  return executeRequest();
}

module.exports = {
  makeRequest
};