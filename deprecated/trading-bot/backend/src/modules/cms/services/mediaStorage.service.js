/**
 * Media Storage Service
 * Provides an abstraction layer for interacting with different storage providers
 */
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const crypto = require('crypto');
const mediaConfig = require('../config/media.config');

// Promisify file system operations
const unlinkAsync = promisify(fs.unlink);
const existsAsync = promisify(fs.exists);
const copyFileAsync = promisify(fs.copyFile);

// Configure Cloudinary if needed
if (mediaConfig.storageProvider === 'cloudinary') {
  cloudinary.config({
    cloud_name: mediaConfig.cloudinary.cloudName,
    api_key: mediaConfig.cloudinary.apiKey,
    api_secret: mediaConfig.cloudinary.apiSecret,
  });
}

/**
 * MediaStorageService class
 * Handles file storage operations for different providers
 */
class MediaStorageService {
  constructor() {
    this.config = mediaConfig;
    this.storageProvider = this.config.storageProvider;
    this.initializeStorage();
  }

  /**
   * Initialize storage based on provider
   */
  initializeStorage() {
    switch (this.storageProvider) {
      case 'cloudinary':
        this.storage = new CloudinaryStorage({
          cloudinary: cloudinary,
          params: {
            folder: this.config.cloudinary.folder,
            public_id: (req, file) => {
              const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
              const fileExt = path.extname(file.originalname);
              return `${path.basename(file.originalname, fileExt)}-${uniqueSuffix}`;
            },
            resource_type: 'auto',
          },
        });
        break;
      case 'local':
      default:
        this.storage = multer.diskStorage({
          destination: (req, file, cb) => {
            cb(null, this.config.local.uploadDir);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const fileExt = path.extname(file.originalname);
            cb(null, `${crypto.randomUUID()}${fileExt}`);
          },
        });
        break;
    }
  }

  /**
   * Create multer upload instance with configuration
   */
  getUploadMiddleware() {
    return multer({
      storage: this.storage,
      limits: {
        fileSize: this.config.limits.fileSize,
      },
      fileFilter: (req, file, cb) => {
        if (this.config.isAllowedMimeType(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type not allowed. Allowed types: ${this.config.getAllowedMimeTypes().join(', ')}`), false);
        }
      },
    });
  }

  /**
   * Process image after upload (create thumbnails, optimize)
   * @param {Object} file - Uploaded file object
   * @returns {Promise<Object>} - Object with paths to processed images
   */
  async processImage(file) {
    // Only process image files
    if (!file.mimetype.startsWith('image/')) {
      return { original: file.path };
    }

    try {
      // Get image information
      const imageInfo = await sharp(file.path).metadata();

      // Generate paths
      const fileExt = path.extname(file.filename);
      const filenameWithoutExt = path.basename(file.filename, fileExt);
      
      // Create thumbnail
      const thumbnailFilename = `${filenameWithoutExt}_thumb${fileExt}`;
      const thumbnailPath = path.join(this.config.local.thumbnailDir, thumbnailFilename);
      
      await sharp(file.path)
        .resize(
          this.config.imageProcessing.thumbnail.width,
          this.config.imageProcessing.thumbnail.height,
          { 
            fit: this.config.imageProcessing.thumbnail.fit,
            withoutEnlargement: true
          }
        )
        .toFile(thumbnailPath);
      
      // Create optimized version
      const optimizedFilename = `${filenameWithoutExt}_optimized${fileExt}`;
      const optimizedPath = path.join(this.config.local.optimizedDir, optimizedFilename);
      
      await sharp(file.path)
        .resize({
          width: Math.min(imageInfo.width, 1920), // Limit max width to 1920px
          withoutEnlargement: this.config.imageProcessing.optimized.withoutEnlargement
        })
        .jpeg({ quality: this.config.imageProcessing.optimized.quality })
        .toFile(optimizedPath);
      
      return {
        original: file.path,
        thumbnail: thumbnailPath,
        optimized: optimizedPath,
        width: imageInfo.width,
        height: imageInfo.height,
        format: imageInfo.format
      };
    } catch (error) {
      console.error('Error processing image:', error);
      return { original: file.path };
    }
  }

  /**
   * Delete a file from storage
   * @param {String} filePath - Path to the file
   * @param {Object} options - Additional options (e.g. public_id for Cloudinary)
   * @returns {Promise<Boolean>} - True if deletion succeeded
   */
  async deleteFile(filePath, options = {}) {
    if (this.storageProvider === 'cloudinary') {
      const publicId = options.publicId || filePath;
      try {
        await cloudinary.uploader.destroy(publicId);
        return true;
      } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        return false;
      }
    } else {
      // Local file system
      try {
        if (await existsAsync(filePath)) {
          await unlinkAsync(filePath);
          
          // If this is an image, try to delete thumbnail and optimized versions
          const fileExt = path.extname(filePath);
          const filename = path.basename(filePath);
          const filenameWithoutExt = path.basename(filePath, fileExt);
          
          const thumbnailPath = path.join(this.config.local.thumbnailDir, `${filenameWithoutExt}_thumb${fileExt}`);
          const optimizedPath = path.join(this.config.local.optimizedDir, `${filenameWithoutExt}_optimized${fileExt}`);
          
          if (await existsAsync(thumbnailPath)) {
            await unlinkAsync(thumbnailPath);
          }
          
          if (await existsAsync(optimizedPath)) {
            await unlinkAsync(optimizedPath);
          }
        }
        return true;
      } catch (error) {
        console.error('Error deleting file from local storage:', error);
        return false;
      }
    }
  }

  /**
   * Get public URL for a file
   * @param {String} filename - Filename or path
   * @returns {String} - Public URL
   */
  getPublicUrl(filename) {
    if (this.storageProvider === 'cloudinary') {
      return filename; // Cloudinary URLs are already public
    } else {
      // Local file system
      return `${this.config.local.publicUrlBase}/${filename}`;
    }
  }
  
  /**
   * Get variations of an image (thumbnail, optimized)
   * @param {Object} mediaAsset - Media asset record
   * @returns {Object} - Object with URLs for different variations
   */
  getImageVariations(mediaAsset) {
    if (!mediaAsset.mimeType.startsWith('image/')) {
      return { original: mediaAsset.url };
    }
    
    const fileExt = path.extname(mediaAsset.filename);
    const filenameWithoutExt = path.basename(mediaAsset.filename, fileExt);
    
    if (this.storageProvider === 'cloudinary') {
      // For Cloudinary, we'd return transformation URLs
      return {
        original: mediaAsset.url,
        thumbnail: `${mediaAsset.url.split('/upload/').join('/upload/c_thumb,w_200,h_200/')}`
      };
    } else {
      // For local storage
      const thumbnailFilename = `${filenameWithoutExt}_thumb${fileExt}`;
      const optimizedFilename = `${filenameWithoutExt}_optimized${fileExt}`;
      
      return {
        original: mediaAsset.url,
        thumbnail: `${this.config.local.publicUrlBase}/thumbnail/${thumbnailFilename}`,
        optimized: `${this.config.local.publicUrlBase}/optimized/${optimizedFilename}`
      };
    }
  }
}

// Export singleton instance
module.exports = new MediaStorageService();