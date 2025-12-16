/**
 * This file has been refactored to follow the project's file organization guidelines.
 * The implementation has been split into smaller, focused files in the 'bot-microservice-service' directory.
 *
 * This file now re-exports the implementation from the refactored module to maintain
 * backward compatibility for existing code that imports from this path.
 *
 * @see ./bot-microservice-service/README.md for details on the refactoring
 */

// Import from the refactored module
module.exports = require('./bot-microservice-service');