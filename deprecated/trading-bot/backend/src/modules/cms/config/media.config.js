/**
 * Media Configuration
 * Manages storage providers and media settings
 */
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const mkdirAsync = promisify(fs.mkdir);

// Base storage directory for local storage
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads/media');
const PUBLIC_URL_BASE = process.env.PUBLIC_URL_BASE || '/api/cms/media/file';

// Create directories if they don't exist
const ensureDirectoriesExist = async () => {
  const directories = [
    UPLOAD_DIR,
    path.join(UPLOAD_DIR, 'thumbnails'),
    path.join(UPLOAD_DIR, 'optimized')
  ];

  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      await mkdirAsync(dir, { recursive: true });
    }
  }
};

// Ensure directories exist when module is loaded
ensureDirectoriesExist().catch(err => {
  console.error('Error creating media directories:', err);
});

// Supported storage providers
const STORAGE_PROVIDERS = {
  LOCAL: 'local',
  CLOUDINARY: 'cloudinary'
};

// Default configuration
const config = {
  // Active storage provider
  storageProvider: process.env.MEDIA_STORAGE_PROVIDER || STORAGE_PROVIDERS.LOCAL,

  // File size limits (in bytes)
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024), // 10MB default
    imageSize: parseInt(process.env.MAX_IMAGE_SIZE || 5 * 1024 * 1024), // 5MB default
    videoSize: parseInt(process.env.MAX_VIDEO_SIZE || 50 * 1024 * 1024), // 50MB default
  },

  // Allowed file types
  allowedTypes: {
    image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
  },

  // Local storage configuration
  local: {
    uploadDir: UPLOAD_DIR,
    publicUrlBase: PUBLIC_URL_BASE,
    thumbnailDir: path.join(UPLOAD_DIR, 'thumbnails'),
    optimizedDir: path.join(UPLOAD_DIR, 'optimized'),
  },

  // Cloudinary configuration (if used)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER || 'cms-media',
  },

  // Image processing options
  imageProcessing: {
    thumbnail: {
      width: 200,
      height: 200,
      fit: 'cover',
    },
    optimized: {
      quality: 80,
      withoutEnlargement: true,
    },
    // Common image sizes for responsive images
    responsiveSizes: [
      { name: 'small', width: 320 },
      { name: 'medium', width: 640 },
      { name: 'large', width: 1024 },
      { name: 'xl', width: 1920 },
    ],
  },

  // Get all allowed MIME types as a flat array
  getAllowedMimeTypes() {
    return Object.values(this.allowedTypes).flat();
  },

  // Check if a MIME type is allowed
  isAllowedMimeType(mimeType) {
    return this.getAllowedMimeTypes().includes(mimeType);
  },

  // Get media type from MIME type
  getMediaTypeFromMimeType(mimeType) {
    for (const [type, mimeTypes] of Object.entries(this.allowedTypes)) {
      if (mimeTypes.includes(mimeType)) {
        return type;
      }
    }
    return null;
  },
};

module.exports = config;