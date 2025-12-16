const express = require('express');
const router = express.Router();
const mediaAssetController = require('../controllers/mediaAsset.controller');
const { verifyJWT, isAdmin } = require('../../../middlewares/auth.middleware');
const { validate } = require('../../../middlewares/validation.middleware');
const { body, param, query } = require('express-validator');
const mediaStorageService = require('../services/mediaStorage.service');
const mediaConfig = require('../config/media.config');

// Get the upload middleware from the storage service
const upload = mediaStorageService.getUploadMiddleware();

// Middleware to check if user has permission for an operation
const hasPermission = (requiredPermission) => {
  return (req, res, next) => {
    // For now, just check if user is admin or has the right role
    // Later, this would check specific permissions from a user's role
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Example permission check: 'media:upload', 'media:delete', etc.
    // This would be replaced with a real permission check system
    if (requiredPermission === 'media:upload' || requiredPermission === 'media:view') {
      return next();
    }
    
    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission to perform this action'
    });
  };
};

/**
 * @swagger
 * tags:
 *   name: Media
 *   description: Media asset management endpoints
 *
 * /cms/media:
 *   get:
 *     summary: Get all media assets
 *     description: Retrieve a list of media assets with optional filtering and pagination
 *     tags: [Media]
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
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by media type (e.g., image, video, document)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query for filename or metadata
 *     responses:
 *       200:
 *         description: List of media assets
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
 *                     $ref: '#/components/schemas/MediaAsset'
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
 *     summary: Upload a media asset
 *     description: Upload a new file as a media asset
 *     tags: [Media]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: The file to upload
 *               title:
 *                 type: string
 *                 description: Title for the media asset
 *               description:
 *                 type: string
 *                 description: Description of the media asset
 *               altText:
 *                 type: string
 *                 description: Alternative text for accessibility
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *     responses:
 *       201:
 *         description: Media asset uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/MediaAsset'
 *       400:
 *         description: Bad request - invalid file or data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Server error
 *
 * /cms/media/{id}:
 *   get:
 *     summary: Get media asset by ID
 *     description: Retrieve a specific media asset by its ID
 *     tags: [Media]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Media asset UUID
 *     responses:
 *       200:
 *         description: Media asset retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/MediaAsset'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Media asset not found
 *       500:
 *         description: Server error
 *
 *   put:
 *     summary: Update media asset
 *     description: Update metadata for an existing media asset
 *     tags: [Media]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Media asset UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title for the media asset
 *               description:
 *                 type: string
 *                 description: Description of the media asset
 *               altText:
 *                 type: string
 *                 description: Alternative text for accessibility
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *               status:
 *                 type: string
 *                 enum: [active, archived, processing]
 *                 description: Status of the media asset
 *     responses:
 *       200:
 *         description: Media asset updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/MediaAsset'
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Media asset not found
 *       500:
 *         description: Server error
 *
 *   delete:
 *     summary: Delete media asset
 *     description: Delete an existing media asset
 *     tags: [Media]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Media asset UUID
 *     responses:
 *       200:
 *         description: Media asset deleted successfully
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
 *                   example: Media asset deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Media asset not found
 *       500:
 *         description: Server error
 *
 * /cms/media/file/{filename}:
 *   get:
 *     summary: Serve media file
 *     description: Serve a media file with optional variant (original, thumbnail, optimized)
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Filename of the media asset
 *       - in: query
 *         name: variant
 *         schema:
 *           type: string
 *           enum: [original, thumbnail, optimized]
 *           default: original
 *         description: Media variant to serve
 *     responses:
 *       200:
 *         description: Media file
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Media file not found
 *       500:
 *         description: Server error
 *
 * /cms/media/attach:
 *   post:
 *     summary: Attach media to content
 *     description: Attach a media asset to a content entry
 *     tags: [Media]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mediaId
 *               - contentId
 *               - fieldKey
 *             properties:
 *               mediaId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the media asset
 *               contentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the content entry
 *               fieldKey:
 *                 type: string
 *                 description: Key of the field to attach the media to
 *     responses:
 *       200:
 *         description: Media attached successfully
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
 *       400:
 *         description: Bad request - validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Media or content not found
 *       500:
 *         description: Server error
 */

// Get all media assets
router.get(
  '/',
  verifyJWT,
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isString().withMessage('Invalid type'),
    query('search').optional().isString().withMessage('Invalid search query')
  ],
  validate,
  mediaAssetController.getAll
);

// Get media asset by ID
router.get(
  '/:id',
  verifyJWT,
  param('id').isUUID().withMessage('Invalid media asset ID'),
  validate,
  mediaAssetController.getById
);

// Upload media asset
router.post(
  '/',
  verifyJWT,
  upload.single('file'),
  [
    body('title').optional(),
    body('description').optional(),
    body('altText').optional(),
    body('tags').optional()
  ],
  validate,
  mediaAssetController.upload
);

// Update media asset metadata
router.put(
  '/:id',
  verifyJWT,
  param('id').isUUID().withMessage('Invalid media asset ID'),
  [
    body('title').optional(),
    body('description').optional(),
    body('altText').optional(),
    body('tags').optional(),
    body('status').optional().isIn(['active', 'archived', 'processing']).withMessage('Invalid status')
  ],
  validate,
  mediaAssetController.update
);

// Delete media asset
router.delete(
  '/:id',
  verifyJWT,
  param('id').isUUID().withMessage('Invalid media asset ID'),
  validate,
  mediaAssetController.delete
);

// Get user's media assets
router.get(
  '/user/:userId',
  verifyJWT,
  [
    param('userId').isUUID().withMessage('Invalid user ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
  ],
  validate,
  mediaAssetController.getByUser
);

// Attach media to content
router.post(
  '/attach',
  verifyJWT,
  hasPermission('media:attach'),
  [
    body('mediaId').isUUID().withMessage('Invalid media ID'),
    body('contentId').isUUID().withMessage('Invalid content ID'),
    body('fieldKey').isString().withMessage('Field key must be a string')
  ],
  validate,
  mediaAssetController.attachToContent
);

// Serve media file (with support for variants)
router.get(
  '/file/:filename',
  [
    param('filename').isString().withMessage('Invalid filename'),
    query('variant').optional().isIn(['original', 'thumbnail', 'optimized']).withMessage('Invalid variant')
  ],
  validate,
  mediaAssetController.serveFile
);

// Serve media thumbnails directory
router.use('/thumbnails', express.static(mediaConfig.local.thumbnailDir, {
  maxAge: '1d', // Cache for 1 day
  etag: true,
  lastModified: true
}));

// Serve media optimized directory
router.use('/optimized', express.static(mediaConfig.local.optimizedDir, {
  maxAge: '1d', // Cache for 1 day
  etag: true,
  lastModified: true
}));

module.exports = router;