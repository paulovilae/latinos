const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');
const { verifyJWT, isAdmin } = require('../../../middlewares/auth.middleware');
const { validate } = require('../../../middlewares/validation.middleware');
const { body, param, query } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Content
 *   description: Content entry management endpoints
 *
 * /cms/content:
 *   get:
 *     summary: Get all content entries
 *     description: Retrieve a list of content entries with optional filtering by content type, status, etc.
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: contentTypeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by content type ID
 *       - in: query
 *         name: contentTypeSlug
 *         schema:
 *           type: string
 *         description: Filter by content type slug
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *         description: Filter by content status
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
 *         description: List of content entries
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
 *                     $ref: '#/components/schemas/Content'
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
 *       500:
 *         description: Server error
 *
 *   post:
 *     summary: Create a new content entry
 *     description: Create a new content entry for a specific content type
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentTypeId
 *               - title
 *               - slug
 *             properties:
 *               contentTypeId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the content type
 *               title:
 *                 type: string
 *                 description: Content title
 *               slug:
 *                 type: string
 *                 description: URL-friendly identifier
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 default: draft
 *                 description: Content status
 *               fields:
 *                 type: object
 *                 description: Dynamic fields based on content type
 *                 example:
 *                   body: "This is the main content body."
 *                   featuredImage: "123e4567-e89b-12d3-a456-426614174003"
 *     responses:
 *       201:
 *         description: Content created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Content'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 *
 * /cms/content/{id}:
 *   get:
 *     summary: Get content by ID
 *     description: Retrieve a specific content entry by its ID
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content UUID
 *     responses:
 *       200:
 *         description: Content retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Content'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Content not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update content
 *     description: Update an existing content entry
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Content title
 *               slug:
 *                 type: string
 *                 description: URL-friendly identifier
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *                 description: Content status
 *               fields:
 *                 type: object
 *                 description: Dynamic fields based on content type
 *     responses:
 *       200:
 *         description: Content updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Content'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Content not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete content
 *     description: Delete an existing content entry (admin only)
 *     tags: [Content]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content UUID
 *     responses:
 *       200:
 *         description: Content deleted successfully
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
 *                   example: Content deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Not an admin
 *       404:
 *         description: Content not found
 *       500:
 *         description: Server error
 */

// Get all content entries with optional filtering
router.get(
  '/',
  verifyJWT,
  [
    query('contentTypeId').optional().isUUID().withMessage('Invalid content type ID'),
    query('contentTypeSlug').optional().isString().withMessage('Invalid content type slug'),
    query('status').optional().isString().withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validate,
  contentController.getAll
);

// Get content by ID
router.get(
  '/:id',
  verifyJWT,
  param('id').isUUID().withMessage('Invalid content ID'),
  validate,
  contentController.getById
);

// Create content
router.post(
  '/',
  verifyJWT,
  [
    body('contentTypeId').notEmpty().isUUID().withMessage('Valid content type ID is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('slug').notEmpty().withMessage('Slug is required')
      .matches(/^[a-z0-9-]+$/i).withMessage('Slug can only contain alphanumeric characters and hyphens'),
    body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
    body('fields').optional().isObject().withMessage('Fields must be an object')
  ],
  validate,
  contentController.create
);

// Update content
router.put(
  '/:id',
  verifyJWT,
  param('id').isUUID().withMessage('Invalid content ID'),
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    body('slug').optional().notEmpty().withMessage('Slug cannot be empty')
      .matches(/^[a-z0-9-]+$/i).withMessage('Slug can only contain alphanumeric characters and hyphens'),
    body('status').optional().isIn(['draft', 'published', 'archived']).withMessage('Invalid status'),
    body('fields').optional().isObject().withMessage('Fields must be an object')
  ],
  validate,
  contentController.update
);

// Delete content (admin only)
router.delete(
  '/:id',
  verifyJWT,
  isAdmin,
  param('id').isUUID().withMessage('Invalid content ID'),
  validate,
  contentController.delete
);

module.exports = router;