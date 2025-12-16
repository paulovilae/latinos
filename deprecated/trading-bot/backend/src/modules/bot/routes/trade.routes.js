const express = require('express');
const { authenticateJWT } = require('../../../middlewares/auth.middleware');
const tradeController = require('../controllers/trade.controller');

const router = express.Router();

/**
 * @route   GET /api/bot/trades
 * @desc    Get all trade history
 * @access  Private
 */
router.get(
  '/',
  authenticateJWT,
  tradeController.getAllTrades
);

/**
 * @route   GET /api/bot/trades/current
 * @desc    Get currently active trades
 * @access  Private
 */
router.get(
  '/current',
  authenticateJWT,
  tradeController.getCurrentTrades
);

/**
 * @route   GET /api/bot/performance
 * @desc    Get performance metrics
 * @access  Private
 */
router.get(
  '/performance',
  authenticateJWT,
  tradeController.getPerformanceMetrics
);

module.exports = router;