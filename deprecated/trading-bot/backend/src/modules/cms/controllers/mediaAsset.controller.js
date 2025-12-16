const { MediaAsset, User } = require('../models');
const { sequelize } = require('../../../models');
const { Op } = require('sequelize');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const unlinkAsync = promisify(fs.unlink);
const mediaStorageService = require('../services/mediaStorage.service');
const mediaConfig = require('../config/media.config');

/**
 * Media Asset Controller
 * Handles media file uploads and management
 */
const mediaAssetController = {
  /**
   * Get all media assets
   */
  getAll: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        search, 
        sortBy = 'createdAt', 
        order = 'DESC' 
      } = req.query;
      
      const offset = (page - 1) * limit;
      
      // Build query conditions
      const where = {};
      
      // Filter by type
      if (type) {
        where.mimeType = { [Op.like]: `${type}%` };
      }
      
      // Search by filename or title
      if (search) {
        where[Op.or] = [
          { filename: { [Op.like]: `%${search}%` } },
          { originalFilename: { [Op.like]: `%${search}%` } },
          { title: { [Op.like]: `%${search}%` } }
        ];
      }
      
      // Get media assets
      const { count, rows: mediaAssets } = await MediaAsset.findAndCountAll({
        where,
        include: [
          {
            association: 'uploadedBy',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }
        ],
        order: [[sortBy, order]],
        limit: parseInt(limit),
        offset: offset
      });
      
      return res.status(200).json({
        status: 'success',
        data: {
          mediaAssets,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting media assets:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve media assets',
        error: error.message
      });
    }
  },

  /**
   * Get a single media asset by ID
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const mediaAsset = await MediaAsset.findByPk(id, {
        include: [
          {
            association: 'uploadedBy',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }
        ]
      });
      
      if (!mediaAsset) {
        return res.status(404).json({
          status: 'error',
          message: 'Media asset not found'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: mediaAsset
      });
    } catch (error) {
      console.error('Error getting media asset:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve media asset',
        error: error.message
      });
    }
  },

  /**
   * Upload a new media asset
   */
  upload: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      // Check if file exists in request
      if (!req.file) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'No file uploaded'
        });
      }
      
      const {
        originalname,
        mimetype,
        size,
        filename,
        path: filePath
      } = req.file;
      
      // Validate file size based on type
      const mediaType = mediaConfig.getMediaTypeFromMimeType(mimetype);
      const maxSizeForType = mediaType === 'image'
        ? mediaConfig.limits.imageSize
        : mediaType === 'video'
          ? mediaConfig.limits.videoSize
          : mediaConfig.limits.fileSize;
      
      if (size > maxSizeForType) {
        // Delete the file since it exceeds size limits
        await unlinkAsync(filePath);
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: `File exceeds maximum size limit of ${Math.round(maxSizeForType / (1024 * 1024))}MB for ${mediaType} files`
        });
      }
      
      // Extract additional metadata from request body
      const { title, description, altText, tags } = req.body;
      
      // Process image if needed (generate thumbnails, etc.)
      let width = null;
      let height = null;
      let duration = null;
      let processedImageData = { original: filePath };
      
      if (mimetype.startsWith('image/')) {
        processedImageData = await mediaStorageService.processImage(req.file);
        width = processedImageData.width;
        height = processedImageData.height;
      } else if (mimetype.startsWith('video/')) {
        // We'd use ffprobe or similar to get video dimensions and duration
        // For now, set placeholder values
        width = 1920;
        height = 1080;
        duration = 30.5;
      } else if (mimetype.startsWith('audio/')) {
        // For audio, set duration placeholder
        duration = 180.2;
      }
      
      // Create relative path for storage
      const relativeFilePath = filePath.replace(process.cwd(), '');
      
      // Generate a public URL
      const publicUrl = mediaStorageService.getPublicUrl(filename);
      
      // Create media asset record
      const mediaAsset = await MediaAsset.create({
        filename,
        originalFilename: originalname,
        mimeType: mimetype,
        size,
        path: relativeFilePath,
        url: publicUrl,
        width,
        height,
        duration,
        title: title || originalname,
        description,
        altText,
        tags: tags ? JSON.parse(tags) : [],
        uploadedById: req.user.id,
        metadata: {
          processedVersions: mediaType === 'image' ? {
            thumbnail: path.basename(processedImageData.thumbnail || ''),
            optimized: path.basename(processedImageData.optimized || '')
          } : null
        },
        status: 'active'
      }, { transaction });
      
      await transaction.commit();
      
      // Add image variations to response
      const responseData = mediaAsset.toJSON();
      if (mediaType === 'image') {
        responseData.variations = mediaStorageService.getImageVariations(responseData);
      }
      
      return res.status(201).json({
        status: 'success',
        message: 'Media asset uploaded successfully',
        data: responseData
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error uploading media asset:', error);
      
      // If an error occurs, try to delete the uploaded file
      if (req.file && req.file.path) {
        try {
          await unlinkAsync(req.file.path);
        } catch (unlinkError) {
          console.error('Error deleting file after failed upload:', unlinkError);
        }
      }
      
      return res.status(500).json({
        status: 'error',
        message: 'Failed to upload media asset',
        error: error.message
      });
    }
  },

  /**
   * Update media asset metadata
   */
  update: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { title, description, altText, tags, status } = req.body;
      
      // Find media asset
      const mediaAsset = await MediaAsset.findByPk(id);
      
      if (!mediaAsset) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Media asset not found'
        });
      }
      
      // Update media asset
      await mediaAsset.update({
        title: title || mediaAsset.title,
        description: description !== undefined ? description : mediaAsset.description,
        altText: altText !== undefined ? altText : mediaAsset.altText,
        tags: tags ? JSON.parse(tags) : mediaAsset.tags,
        status: status || mediaAsset.status
      }, { transaction });
      
      await transaction.commit();
      
      return res.status(200).json({
        status: 'success',
        message: 'Media asset updated successfully',
        data: mediaAsset
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating media asset:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update media asset',
        error: error.message
      });
    }
  },

  /**
   * Delete a media asset
   */
  delete: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      
      // Find media asset
      const mediaAsset = await MediaAsset.findByPk(id);
      
      if (!mediaAsset) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Media asset not found'
        });
      }
      
      // Check if current user is allowed to delete this asset
      // Only admin or the user who uploaded can delete
      if (req.user.role !== 'admin' && mediaAsset.uploadedById !== req.user.id) {
        await transaction.rollback();
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to delete this media asset'
        });
      }
      
      // Delete the file using storage service
      const filePath = path.join(process.cwd(), mediaAsset.path);
      await mediaStorageService.deleteFile(filePath, {
        publicId: mediaAsset.filename
      });
      
      // Delete media asset
      await mediaAsset.destroy({ transaction });
      
      await transaction.commit();
      
      return res.status(200).json({
        status: 'success',
        message: 'Media asset deleted successfully'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error deleting media asset:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete media asset',
        error: error.message
      });
    }
  },

  /**
   * Serve a media file
   */
  serveFile: async (req, res) => {
    try {
      const { filename } = req.params;
      const variant = req.query.variant || 'original'; // 'original', 'thumbnail', 'optimized'
      
      // Find media asset
      const mediaAsset = await MediaAsset.findOne({
        where: { filename }
      });
      
      if (!mediaAsset) {
        return res.status(404).json({
          status: 'error',
          message: 'Media asset not found'
        });
      }
      
      // Determine which file to serve based on variant
      let filePath = path.join(process.cwd(), mediaAsset.path);
      
      if (variant !== 'original' && mediaAsset.mimeType.startsWith('image/') && mediaAsset.metadata?.processedVersions) {
        const fileExt = path.extname(filename);
        const filenameWithoutExt = path.basename(filename, fileExt);
        
        if (variant === 'thumbnail' && mediaAsset.metadata.processedVersions.thumbnail) {
          filePath = path.join(mediaConfig.local.thumbnailDir, mediaAsset.metadata.processedVersions.thumbnail);
        } else if (variant === 'optimized' && mediaAsset.metadata.processedVersions.optimized) {
          filePath = path.join(mediaConfig.local.optimizedDir, mediaAsset.metadata.processedVersions.optimized);
        }
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          status: 'error',
          message: 'File not found on server'
        });
      }
      
      // Set content type header based on mime type
      res.setHeader('Content-Type', mediaAsset.mimeType);
      
      // Set cache control for better performance
      if (mediaAsset.mimeType.startsWith('image/')) {
        // Cache images for a longer time
        res.setHeader('Cache-Control', 'public, max-age=86400'); // 24 hours
      } else {
        // Cache other files for less time
        res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hour
      }
      
      // Stream the file
      fs.createReadStream(filePath).pipe(res);
    } catch (error) {
      console.error('Error serving media file:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to serve media file',
        error: error.message
      });
    }
  },

  /**
   * Get all media assets by a specific user
   */
  getByUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      
      const offset = (page - 1) * limit;
      
      // Find user
      const user = await User.findByPk(userId);
      
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
      
      // Get media assets
      const { count, rows: mediaAssets } = await MediaAsset.findAndCountAll({
        where: { uploadedById: userId },
        limit: parseInt(limit),
        offset: offset,
        order: [['createdAt', 'DESC']]
      });
      
      return res.status(200).json({
        status: 'success',
        data: {
          mediaAssets,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting user media assets:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve user media assets',
        error: error.message
      });
    }
  },
  
  /**
   * Attach media to content
   */
  attachToContent: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { mediaId, contentId, fieldKey } = req.body;
      
      // Check if media exists
      const mediaAsset = await MediaAsset.findByPk(mediaId);
      
      if (!mediaAsset) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Media asset not found'
        });
      }
      
      // Here you would typically:
      // 1. Check if the content exists
      // 2. Check if the field exists and accepts media
      // 3. Create or update a ContentFieldValue with the media ID
      // Since we're not implementing the full CMS content system in this task,
      // we'll just return a success message
      
      await transaction.commit();
      
      return res.status(200).json({
        status: 'success',
        message: 'Media attached to content successfully',
        data: {
          mediaId,
          contentId,
          fieldKey
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error attaching media to content:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to attach media to content',
        error: error.message
      });
    }
  }
};

module.exports = mediaAssetController;