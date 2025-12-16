/**
 * Bot Microservice Service
 * Provides methods for interacting with the Python-based trading bot microservice.
 * Handles formula management, trade monitoring, and system control operations.
 * Implements caching and retry mechanisms for performance and reliability.
 */

const formulaService = require('./formula-service');
const tradeService = require('./trade-service');
const systemService = require('./system-service');

/**
 * Bot Microservice API Service
 * Main service class that integrates all sub-services
 */
class BotMicroserviceService {
  // System operations
  async checkHealth() {
    return systemService.checkHealth();
  }

  async startSystem() {
    return systemService.startSystem();
  }

  async stopSystem() {
    return systemService.stopSystem();
  }

  async getSystemStatus() {
    return systemService.getSystemStatus();
  }

  // Formula operations
  async getAllFormulas() {
    return formulaService.getAllFormulas();
  }

  async getFormulaById(id) {
    return formulaService.getFormulaById(id);
  }

  async createFormula(formulaData) {
    return formulaService.createFormula(formulaData);
  }

  async updateFormula(id, formulaData) {
    return formulaService.updateFormula(id, formulaData);
  }

  async deleteFormula(id) {
    return formulaService.deleteFormula(id);
  }

  // Trade operations
  async getAllTrades() {
    return tradeService.getAllTrades();
  }

  async getCurrentTrades() {
    return tradeService.getCurrentTrades();
  }

  async getPerformanceMetrics() {
    return tradeService.getPerformanceMetrics();
  }
}

// Export a singleton instance of the service
module.exports = new BotMicroserviceService();