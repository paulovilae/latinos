const express = require('express');
const authRoutes = require('./auth.routes');
const cmsRoutes = require('../modules/cms/routes');
const botRoutes = require('../modules/bot/routes');

const router = express.Router();

// Register all routes
router.use('/auth', authRoutes);
router.use('/cms', cmsRoutes);
router.use('/bot', botRoutes);

module.exports = router;