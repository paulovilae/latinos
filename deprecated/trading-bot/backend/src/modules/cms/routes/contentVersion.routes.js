const express = require('express');
const router = express.Router();
const contentVersionController = require('../controllers/contentVersion.controller');
const { verifyJWT } = require('../../../middlewares/auth.middleware');
const { hasPermission } = require('../../../middlewares/permission.middleware');
const { validate } = require('../../../middlewares/validation.middleware');
const { param, query } = require('express-validator');

/**
 * @swagger
 * tags:
 *   name: Content Versions
 *   description: Content version history management endpoints
 *
 * /cms/content/{contentId}/versions:
 *   get:
 *     summary: Get all versions of a content
 *     description: Retrieve version history for a specific content entry
 *     tags: [Content Versions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content entry UUID
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
 *         description: List of content versions
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       contentId:
 *                         type: string
 *                         format: uuid
 *                       versionNumber:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       createdById:
 *                         type: string
 *                         format: uuid
 *                       notes:
 *                         type: string
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
 *       404:
 *         description: Content not found
 *       500:
 *         description: Server error
 *
 * /cms/content/{contentId}/versions/{versionNumber}:
 *   get:
 *     summary: Get a specific version of content
 *     description: Retrieve a specific version of a content entry
 *     tags: [Content Versions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content entry UUID
 *       - in: path
 *         name: versionNumber
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Version number
 *     responses:
 *       200:
 *         description: Content version retrieved successfully
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
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     contentId:
 *                       type: string
 *                       format: uuid
 *                     versionNumber:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     status:
 *                       type: string
 *                     data:
 *                       type: object
 *                       description: Full content data at this version
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     createdById:
 *                       type: string
 *                       format: uuid
 *                     notes:
 *                       type: string
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Content or version not found
 *       500:
 *         description: Server error
 *
 * /cms/content/{contentId}/versions/{versionNumber}/publish:
 *   post:
 *     summary: Publish a specific version
 *     description: Change the status of a content entry to published using a specific version
 *     tags: [Content Versions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content entry UUID
 *       - in: path
 *         name: versionNumber
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Version number
 *     responses:
 *       200:
 *         description: Version published successfully
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
 *                   properties:
 *                     content:
 *                       $ref: '#/components/schemas/Content'
 *                     version:
 *                       type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Content or version not found
 *       500:
 *         description: Server error
 *
 * /cms/content/{contentId}/versions/{versionNumber}/restore:
 *   post:
 *     summary: Restore to a previous version
 *     description: Create a new version based on a previous version
 *     tags: [Content Versions]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Content entry UUID
 *       - in: path
 *         name: versionNumber
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Version number to restore from
 *     responses:
 *       200:
 *         description: Version restored successfully
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
 *                   properties:
 *                     content:
 *                       $ref: '#/components/schemas/Content'
 *                     newVersion:
 *                       type: object
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Content or version not found
 *       500:
 *         description: Server error
 */

// Get all versions of a content
router.get(
  '/:contentId/versions',
  verifyJWT,
  hasPermission('view_content_versions'),
  [
    param('contentId').isUUID().withMessage('Invalid content ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validate,
  contentVersionController.getAllVersions
);

// Get a specific version of content
router.get(
  '/:contentId/versions/:versionNumber',
  verifyJWT,
  hasPermission('view_content_versions'),
  [
    param('contentId').isUUID().withMessage('Invalid content ID'),
    param('versionNumber').isInt({ min: 1 }).withMessage('Version number must be a positive integer')
  ],
  validate,
  contentVersionController.getVersion
);

// Publish a specific version
router.post(
  '/:contentId/versions/:versionNumber/publish',
  verifyJWT,
  hasPermission('publish_content'),
  [
    param('contentId').isUUID().withMessage('Invalid content ID'),
    param('versionNumber').isInt({ min: 1 }).withMessage('Version number must be a positive integer')
  ],
  validate,
  contentVersionController.publishVersion
);

// Restore to a previous version
router.post(
  '/:contentId/versions/:versionNumber/restore',
  verifyJWT,
  hasPermission('restore_content_versions'),
  [
    param('contentId').isUUID().withMessage('Invalid content ID'),
    param('versionNumber').isInt({ min: 1 }).withMessage('Version number must be a positive integer')
  ],
  validate,
  contentVersionController.restoreVersion
);

module.exports = router;