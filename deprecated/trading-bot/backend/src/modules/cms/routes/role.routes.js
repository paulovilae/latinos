const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { verifyJWT } = require('../../../middlewares/auth.middleware');
const { hasPermission } = require('../../../middlewares/permission.middleware');
const { validate } = require('../../../middlewares/validation.middleware');
const { body, param, query } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management endpoints
 *
 * /cms/roles:
 *   get:
 *     summary: Get all roles
 *     description: Retrieve a list of all roles with pagination
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *         description: List of roles
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
 *                     $ref: '#/components/schemas/Role'
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
 *   post:
 *     summary: Create a new role
 *     description: Create a new role with specified permissions
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name
 *               slug:
 *                 type: string
 *                 description: URL-friendly identifier
 *               description:
 *                 type: string
 *                 description: Role description
 *               permissions:
 *                 type: array
 *                 description: Array of permission IDs
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 *
 * /cms/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     description: Retrieve a specific role by its ID
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role UUID
 *     responses:
 *       200:
 *         description: Role retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a role
 *     description: Update an existing role
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Role name
 *               description:
 *                 type: string
 *                 description: Role description
 *               permissions:
 *                 type: array
 *                 description: Array of permission IDs
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Role updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Role'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a role
 *     description: Delete an existing role
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role UUID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Role deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */

// Get all roles
router.get(
  '/',
  verifyJWT,
  hasPermission('view_roles'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validate,
  roleController.getAll
);

// Get role by ID
router.get(
  '/:id',
  verifyJWT,
  hasPermission('view_roles'),
  param('id').isUUID().withMessage('Invalid role ID'),
  validate,
  roleController.getById
);

// Create role
router.post(
  '/',
  verifyJWT,
  hasPermission('manage_roles'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('slug').notEmpty().withMessage('Slug is required')
      .matches(/^[a-z0-9-]+$/i).withMessage('Slug can only contain alphanumeric characters and hyphens'),
    body('description').optional(),
    body('permissions').optional().isArray().withMessage('Permissions must be an array of permission IDs')
  ],
  validate,
  roleController.create
);

// Update role
router.put(
  '/:id',
  verifyJWT,
  hasPermission('manage_roles'),
  [
    param('id').isUUID().withMessage('Invalid role ID'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional(),
    body('permissions').optional().isArray().withMessage('Permissions must be an array of permission IDs')
  ],
  validate,
  roleController.update
);

// Delete role
router.delete(
  '/:id',
  verifyJWT,
  hasPermission('manage_roles'),
  param('id').isUUID().withMessage('Invalid role ID'),
  validate,
  roleController.delete
);

module.exports = router;