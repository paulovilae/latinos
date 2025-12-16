# Bot Microservice Service

This directory contains the implementation of the Bot Microservice Service, which was refactored from a single large file into multiple focused files to improve maintainability.

## Directory Structure

- `index.js` - Re-exports the main BotMicroserviceService
- `config.js` - Configuration values, constants, and cache key definitions
- `cache-manager.js` - Cache handling functionality (Redis and in-memory)
- `http-client.js` - HTTP request handling with retry mechanism
- `formula-service.js` - Trading formula management methods
- `trade-service.js` - Trade history and performance metrics
- `system-service.js` - System control operations (start/stop/status)

## Refactoring Rationale

The original `botMicroservice.service.js` file (542 lines) was refactored following the project's file organization guideline to split files exceeding 800 lines. Although the file hadn't reached that threshold, it was approaching it and contained distinct logical components that benefit from separation.

This refactoring improves:
- Code maintainability through focused, single-responsibility files
- Readability by grouping related functionality
- Future extensibility as each component can grow independently
- Testability as individual components can be tested in isolation

## Usage

The API remains unchanged. Import and use the service as before:

```javascript
const botMicroserviceService = require('../services/bot-microservice-service');

// Use the service methods
const formulas = await botMicroserviceService.getAllFormulas();