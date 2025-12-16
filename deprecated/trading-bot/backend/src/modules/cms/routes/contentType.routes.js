const express = require('express');
const router = express.Router();
const contentTypeController = require('../controllers/contentType.controller');
const { verifyJWT, isAdmin } = require('../../../middlewares/auth.middleware');
const { validate } = require('../../../middlewares/validation.middleware');
const { body, param } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Content Types
 *   description: Content type management endpoints
 *
 * /cms/content-types:
 *   get:
 *     summary: Get all content types
 *     description: Retrieve a list of all content types
 *     tags: [Content Types]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of content types
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
 *                     $ref: '#/components/schemas/ContentType'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new content type
 *     description: Create a new content type (admin only)
 *     tags: [Content Types]
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
 *                 description: Content type name
 *               slug:
 *                 type: string
 *                 description: URL-friendly identifier
 *               description:
 *                 type: string
 *                 description: Optional description
 *               isListable:
 *                 type: boolean
 *                 description: Whether to show in listings
 *               defaultStatus:
 *                 type: string
 *                 description: Default status for new content
 *               fields:
 *                 type: array
 *                 description: Field definitions
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     key:
 *                       type: string
 *                     type:
 *                       type: string
 *                     required:
 *                       type: boolean
 *                     displayOrder:
 *                       type: integer
 *                     settings:
 *                       type: object
 *     responses:
 *       201:
 *         description: Content type created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ContentType'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not an admin
 *       500:
 *         description: Server error
 *
 * /cms/content-types/{id}:
 *   get:
 *     summary: Get content type by ID
 *     description: Retrieve a specific content type by its ID
 *     tags: [Content Types]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content type UUID
 *     responses:
 *       200:
 *         description: Content type retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ContentType'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Content type not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update a content type
 *     description: Update an existing content type (admin only)
 *     tags: [Content Types]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content type UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               isListable:
 *                 type: boolean
 *               defaultStatus:
 *                 type: string
 *     responses:
 *       200:
 *         description: Content type updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/ContentType'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not an admin
 *       404:
 *         description: Content type not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete a content type
 *     description: Delete an existing content type (admin only)
 *     tags: [Content Types]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content type UUID
 *     responses:
 *       200:
 *         description: Content type deleted successfully
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
 *                   example: Content type deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not an admin
 *       404:
 *         description: Content type not found
 *       500:
 *         description: Server error
 */

// Get all content types
router.get(
  '/',
  verifyJWT,
  contentTypeController.getAll
);

// Get content type by ID
router.get(
  '/:id',
  verifyJWT,
  param('id').isUUID().withMessage('Invalid content type ID'),
  validate,
  contentTypeController.getById
);

// Create content type (admin only)
router.post(
  '/',
  verifyJWT,
  isAdmin,
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('slug').notEmpty().withMessage('Slug is required')
      .matches(/^[a-z0-9-]+$/i).withMessage('Slug can only contain alphanumeric characters and hyphens'),
    body('fields').optional().isArray().withMessage('Fields must be an array')
  ],
  validate,
  contentTypeController.create
);

// Update content type (admin only)
router.put(
  '/:id',
  verifyJWT,
  isAdmin,
  param('id').isUUID().withMessage('Invalid content type ID'),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional(),
    body('isListable').optional().isBoolean().withMessage('isListable must be a boolean'),
    body('defaultStatus').optional()
  ],
  validate,
  contentTypeController.update
);

// Delete content type (admin only)
router.delete(
  '/:id',
  verifyJWT,
  isAdmin,
  param('id').isUUID().withMessage('Invalid content type ID'),
  validate,
  contentTypeController.delete
);

module.exports = router;