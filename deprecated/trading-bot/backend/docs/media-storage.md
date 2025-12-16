# Media Storage and Management

This document provides an overview of the media storage and management system implemented for the CMS backend.

## Features

- **Flexible Storage Providers**: Support for local filesystem storage with extensibility for cloud providers (Cloudinary)
- **Image Processing**: Automatic thumbnail and optimized image generation 
- **Secure File Handling**: File type validation, size limits, and permission-based access
- **Media Management API**: Complete REST API for media operations
- **Metadata Management**: Store and retrieve media metadata
- **Content Integration**: Attach media to CMS content

## Architecture

### Storage Providers

The system supports multiple storage providers through an abstraction layer:

1. **Local File System**: Default provider that stores files in the local filesystem
2. **Cloudinary**: Cloud-based storage provider (implementation ready)

The storage provider can be configured in the media config file or through environment variables.

### Directory Structure

For local storage, the system uses the following directory structure:

```
uploads/
  ├── media/            # Original uploaded files
  ├── thumbnails/       # Thumbnail versions of images
  └── optimized/        # Optimized versions of images
```

### Image Processing

When an image is uploaded, the system automatically:

1. Creates a thumbnail version (200x200 pixels)
2. Creates an optimized version (maintains aspect ratio, optimized quality)
3. Extracts and stores metadata (dimensions, format)

## API Endpoints

| Method | Endpoint | Description | Authentication |
|--------|----------|-------------|----------------|
| GET | `/api/cms/media` | List all media assets with pagination and filtering | Required |
| GET | `/api/cms/media/:id` | Get a single media asset by ID | Required |
| POST | `/api/cms/media` | Upload a new media file | Required |
| PUT | `/api/cms/media/:id` | Update media metadata | Required |
| DELETE | `/api/cms/media/:id` | Delete a media asset | Required |
| GET | `/api/cms/media/user/:userId` | Get all media uploaded by a specific user | Required |
| POST | `/api/cms/media/attach` | Attach media to content | Required |
| GET | `/api/cms/media/file/:filename` | Serve a media file (public) | None |

## Testing

A comprehensive testing script is provided to test all media functionality:

1. Navigate to the backend directory: `cd backend`
2. Make the test script executable: `chmod +x test-media.sh`
3. Run the test script: `./test-media.sh`

The test script performs the following operations:

1. Authentication (login)
2. Upload a test file
3. List media assets
4. Retrieve specific media
5. Update media metadata
6. Get user-specific media
7. Delete media (optional)

## Security Considerations

- File types are validated before upload
- File size limits are enforced
- Access control is implemented for all operations
- Only administrators or the owner can delete media
- Secure file paths and naming conventions

## Configuration

The media storage system can be configured through the `media.config.js` file or environment variables:

| Config | Environment Variable | Default | Description |
|--------|---------------------|---------|-------------|
| Storage Provider | `MEDIA_STORAGE_PROVIDER` | `local` | Storage provider (`local` or `cloudinary`) |
| Max File Size | `MAX_FILE_SIZE` | 10MB | Maximum file size for uploads |
| Max Image Size | `MAX_IMAGE_SIZE` | 5MB | Maximum size for image uploads |
| Max Video Size | `MAX_VIDEO_SIZE` | 50MB | Maximum size for video uploads |
| Upload Directory | `UPLOAD_DIR` | `uploads/media` | Directory for file storage |
| Public URL Base | `PUBLIC_URL_BASE` | `/api/cms/media/file` | Base URL for public access |
| Cloudinary Settings | Various `CLOUDINARY_*` | - | Cloudinary API settings |

## Implementation Details

The media storage system consists of these main components:

1. **Media Config** (`modules/cms/config/media.config.js`): Configuration settings
2. **Media Storage Service** (`modules/cms/services/mediaStorage.service.js`): Storage abstraction
3. **Media Asset Controller** (`modules/cms/controllers/mediaAsset.controller.js`): API endpoints
4. **Media Asset Routes** (`modules/cms/routes/mediaAsset.routes.js`): Route definitions
5. **Media Asset Model** (`modules/cms/models/mediaAsset.model.js`): Database model

## Future Enhancements

- Add more cloud storage providers (AWS S3, Google Cloud Storage)
- Implement video transcoding and processing
- Add media organization features (folders, collections)
- Implement advanced search with image recognition
- Add batch operations for media management