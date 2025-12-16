const express = require('express');
const router = express.Router();

// Import route modules
const contentTypeRoutes = require('./contentType.routes');
const contentRoutes = require('./content.routes');
const mediaAssetRoutes = require('./mediaAsset.routes');
const roleRoutes = require('./role.routes');
const permissionRoutes = require('./permission.routes');
const contentVersionRoutes = require('./contentVersion.routes');

// Mount routes
router.use('/content-types', contentTypeRoutes);
router.use('/content', contentRoutes);
router.use('/media', mediaAssetRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/content', contentVersionRoutes); // Content version routes are nested under content

module.exports = router;