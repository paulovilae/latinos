const express = require('express');
const { authenticateJWT } = require('../../../middlewares/auth.middleware');
const systemController = require('../controllers/system.controller');

const router = express.Router();

/**
 * @route   POST /api/bot/system/start
 * @desc    Start the trading system
 * @access  Private
 */
router.post(
  '/start',
  authenticateJWT,
  systemController.startSystem
);

/**
 * @route   POST /api/bot/system/stop
 * @desc    Stop the trading system
 * @access  Private
 */
router.post(
  '/stop',
  authenticateJWT,
  systemController.stopSystem
);

/**
 * @route   GET /api/bot/system/status
 * @desc    Get system status
 * @access  Private
 */
router.get(
  '/status',
  authenticateJWT,
  systemController.getSystemStatus
);

/**
 * @route   GET /api/bot/system/health
 * @desc    Check bot microservice health
 * @access  Private
 */
router.get(
  '/health',
  authenticateJWT,
  systemController.healthCheck
);

module.exports = router;