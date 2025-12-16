const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const { verifyJWT } = require('../../../middlewares/auth.middleware');
const { hasPermission } = require('../../../middlewares/permission.middleware');
const { validate } = require('../../../middlewares/validation.middleware');
const { param, query } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Permission management endpoints
 *
 * /cms/permissions:
 *   get:
 *     summary: Get all permissions
 *     description: Retrieve a list of all permissions with optional filtering by category
 *     tags: [Permissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter permissions by category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Permission'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 *
 * /cms/permissions/{id}:
 *   get:
 *     summary: Get permission by ID
 *     description: Retrieve a specific permission by its ID
 *     tags: [Permissions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Permission UUID
 *     responses:
 *       200:
 *         description: Permission retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Permission'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Permission not found
 *       500:
 *         description: Server error
 *
 * /cms/permissions/categories/list:
 *   get:
 *     summary: Get all permission categories
 *     description: Retrieve a list of all permission categories
 *     tags: [Permissions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of permission categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: string
 *                     example: content
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 *
 * /cms/permissions/grouped/by-category:
 *   get:
 *     summary: Get permissions grouped by category
 *     description: Retrieve all permissions grouped by their categories
 *     tags: [Permissions]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions grouped by category
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   additionalProperties:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/Permission'
 *                   example:
 *                     content: [
 *                       {
 *                         "id": "123e4567-e89b-12d3-a456-426614174005",
 *                         "name": "Create Content",
 *                         "slug": "create-content",
 *                         "description": "Can create new content entries",
 *                         "category": "content"
 *                       }
 *                     ]
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */

// Get all permissions
router.get(
  '/',
  verifyJWT,
  hasPermission('view_roles'), // Same permission as roles
  [
    query('category').optional().isString().withMessage('Invalid category'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validate,
  permissionController.getAll
);

// Get permission by ID
router.get(
  '/:id',
  verifyJWT,
  hasPermission('view_roles'),
  param('id').isUUID().withMessage('Invalid permission ID'),
  validate,
  permissionController.getById
);

// Get all permission categories
router.get(
  '/categories/list',
  verifyJWT,
  hasPermission('view_roles'),
  permissionController.getCategories
);

// Get permissions grouped by category
router.get(
  '/grouped/by-category',
  verifyJWT,
  hasPermission('view_roles'),
  permissionController.getGroupedByCategory
);

module.exports = router;