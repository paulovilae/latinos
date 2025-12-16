const express = require('express');
const formulaRoutes = require('./formula.routes');
const tradeRoutes = require('./trade.routes');
const systemRoutes = require('./system.routes');

const router = express.Router();

// Register all bot routes
router.use('/formulas', formulaRoutes);
router.use('/trades', tradeRoutes);
router.use('/system', systemRoutes);

module.exports = router;