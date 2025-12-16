/**
 * @swagger
 * components:
 *   schemas:
 *     ContentType:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated UUID of the content type
 *         name:
 *           type: string
 *           description: Content type name
 *         slug:
 *           type: string
 *           description: URL-friendly identifier for the content type
 *         description:
 *           type: string
 *           description: Optional description of the content type
 *         isListable:
 *           type: boolean
 *           description: Whether content of this type should be displayed in listings
 *         defaultStatus:
 *           type: string
 *           description: Default status for new content of this type
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174000"
 *         name: "Blog Post"
 *         slug: "blog-post"
 *         description: "Regular blog post content type"
 *         isListable: true
 *         defaultStatus: "draft"
 *         createdAt: "2025-06-19T15:45:45.000Z"
 *         updatedAt: "2025-06-19T15:45:45.000Z"
 *         
 *     ContentField:
 *       type: object
 *       required:
 *         - name
 *         - key
 *         - type
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated UUID of the content field
 *         contentTypeId:
 *           type: string
 *           format: uuid
 *           description: The content type this field belongs to
 *         name:
 *           type: string
 *           description: Human-readable field name
 *         key:
 *           type: string
 *           description: Unique identifier for the field within the content type
 *         type:
 *           type: string
 *           enum: [text, textarea, richtext, number, boolean, date, media, reference]
 *           description: The field's data type
 *         required:
 *           type: boolean
 *           description: Whether the field is required
 *         displayOrder:
 *           type: integer
 *           description: Order in which the field appears in forms
 *         settings:
 *           type: object
 *           description: Additional settings specific to this field type
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174001"
 *         contentTypeId: "123e4567-e89b-12d3-a456-426614174000"
 *         name: "Title"
 *         key: "title"
 *         type: "text"
 *         required: true
 *         displayOrder: 1
 *         
 *     Content:
 *       type: object
 *       required:
 *         - contentTypeId
 *         - title
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated UUID of the content
 *         contentTypeId:
 *           type: string
 *           format: uuid
 *           description: The content type this content belongs to
 *         title:
 *           type: string
 *           description: Content title
 *         slug:
 *           type: string
 *           description: URL-friendly identifier for the content
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           description: Current content status
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           description: When the content was published
 *         createdById:
 *           type: string
 *           format: uuid
 *           description: User who created the content
 *         updatedById:
 *           type: string
 *           format: uuid
 *           description: User who last updated the content
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174002"
 *         contentTypeId: "123e4567-e89b-12d3-a456-426614174000"
 *         title: "My First Blog Post"
 *         slug: "my-first-blog-post"
 *         status: "published"
 *         publishedAt: "2025-06-19T15:45:45.000Z"
 *         
 *     MediaAsset:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated UUID of the media asset
 *         filename:
 *           type: string
 *           description: System filename for the asset
 *         originalFilename:
 *           type: string
 *           description: Original filename from the upload
 *         mimeType:
 *           type: string
 *           description: Media MIME type
 *         size:
 *           type: integer
 *           description: File size in bytes
 *         path:
 *           type: string
 *           description: Storage path
 *         url:
 *           type: string
 *           description: Public URL to access the media
 *         metadata:
 *           type: object
 *           description: Additional metadata like dimensions for images
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174003"
 *         filename: "a1b2c3d4e5f6.jpg"
 *         originalFilename: "profile-photo.jpg"
 *         mimeType: "image/jpeg"
 *         size: 102400
 *         url: "https://example.com/media/a1b2c3d4e5f6.jpg"
 *         
 *     Role:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated UUID of the role
 *         name:
 *           type: string
 *           description: Role name
 *         slug:
 *           type: string
 *           description: URL-friendly identifier for the role
 *         description:
 *           type: string
 *           description: Role description
 *         isSystemRole:
 *           type: boolean
 *           description: Whether this is a system-defined role that cannot be deleted
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174004"
 *         name: "Editor"
 *         slug: "editor"
 *         description: "Can create and edit content"
 *         isSystemRole: true
 *         
 *     Permission:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated UUID of the permission
 *         name:
 *           type: string
 *           description: Permission name
 *         slug:
 *           type: string
 *           description: URL-friendly identifier for the permission
 *         description:
 *           type: string
 *           description: Permission description
 *         category:
 *           type: string
 *           description: Permission category for grouping
 *       example:
 *         id: "123e4567-e89b-12d3-a456-426614174005"
 *         name: "Create Content"
 *         slug: "create-content"
 *         description: "Can create new content entries"
 *         category: "content"
 */