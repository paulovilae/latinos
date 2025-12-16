/**
 * Routes for [resource name] resources
 * 
 * These routes define the API endpoints for managing [resource name] resources.
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/controllerName.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validation.middleware');
const { resourceValidationRules } = require('../validations/resource.validation');

/**
 * Resource Routes
 * Base path: /api/resourceName
 */

// Create a new resource
// POST /api/resourceName
router.post(
  '/',
  authenticate,
  validate(resourceValidationRules.create),
  controller.create
);

// Retrieve all resources
// GET /api/resourceName
router.get(
  '/',
  authenticate,
  controller.findAll
);

// Retrieve a single resource by id
// GET /api/resourceName/:id
router.get(
  '/:id',
  authenticate,
  controller.findOne
);

// Update a resource with id
// PUT /api/resourceName/:id
router.put(
  '/:id',
  authenticate,
  validate(resourceValidationRules.update),
  controller.update
);

// Delete a resource with id
// DELETE /api/resourceName/:id
router.delete(
  '/:id',
  authenticate,
  controller.delete
);

// Add additional routes as needed for your specific resource
// For example:

// Activate a resource
// POST /api/resourceName/:id/activate
// router.post(
//   '/:id/activate',
//   authenticate,
//   controller.activate
// );

// Get resource statistics
// GET /api/resourceName/stats
// router.get(
//   '/stats',
//   authenticate,
//   controller.getStats
// );

module.exports = router;