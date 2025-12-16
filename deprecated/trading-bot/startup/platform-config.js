/**
 * AI Trading Bot Platform Configuration
 * Central configuration file for the platform startup system
 */

module.exports = {
  // General platform settings
  platform: {
    mode: process.env.PLATFORM_MODE || "development", // "development" or "production"
    logLevel: process.env.PLATFORM_LOG_LEVEL || "info",
    healthCheckTimeout: 60000,
    retryAttempts: 3
  },
  
  // Service-specific configuration
  services: {
    frontend: {
      command: process.env.FRONTEND_COMMAND || "npm run dev",
      directory: process.env.FRONTEND_DIRECTORY || require('path').resolve(__dirname, '..'),
      port: parseInt(process.env.FRONTEND_PORT || "5173", 10),
      healthEndpoint: process.env.FRONTEND_HEALTH_ENDPOINT || "/__vite_ping",
      healthTimeout: parseInt(process.env.FRONTEND_HEALTH_TIMEOUT || "60000", 10),
      simpleCheck: true, // Use simple port check for frontend
      dependencies: ["backend"]
    },
    
    backend: {
      command: process.env.BACKEND_COMMAND || "npm run dev",
      directory: process.env.BACKEND_DIRECTORY || require('path').resolve(__dirname, '../backend'),
      portRange: [
        parseInt(process.env.BACKEND_PORT_RANGE_START || "3000", 10),
        parseInt(process.env.BACKEND_PORT_RANGE_END || "3020", 10)
      ],
      healthEndpoint: process.env.BACKEND_HEALTH_ENDPOINT || "/api/health",
      healthTimeout: parseInt(process.env.BACKEND_HEALTH_TIMEOUT || "15000", 10),
      dependencies: ["bot"]
    },
    
    bot: {
      command: process.env.BOT_COMMAND || "python main.py",
      directory: process.env.BOT_DIRECTORY || require('path').resolve(__dirname, '../bot_microservice'),
      portRange: [
        parseInt(process.env.BOT_PORT_RANGE_START || "5555", 10),
        parseInt(process.env.BOT_PORT_RANGE_END || "5565", 10)
      ],
      healthEndpoint: process.env.BOT_HEALTH_ENDPOINT || "/health",
      healthTimeout: parseInt(process.env.BOT_HEALTH_TIMEOUT || "10000", 10),
      dependencies: []
    }
  }
};