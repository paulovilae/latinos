'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cms_permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      category: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Grouping for permissions (e.g., content, users, settings)'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Add default permissions
    const permissionsData = [
      // Content permissions
      { name: 'Create Content', slug: 'create_content', category: 'content', description: 'Can create new content entries' },
      { name: 'Edit Any Content', slug: 'edit_any_content', category: 'content', description: 'Can edit any content entries' },
      { name: 'Edit Own Content', slug: 'edit_own_content', category: 'content', description: 'Can edit own content entries' },
      { name: 'Delete Any Content', slug: 'delete_any_content', category: 'content', description: 'Can delete any content entries' },
      { name: 'Delete Own Content', slug: 'delete_own_content', category: 'content', description: 'Can delete own content entries' },
      { name: 'Publish Content', slug: 'publish_content', category: 'content', description: 'Can publish content entries' },
      { name: 'View Content Versions', slug: 'view_content_versions', category: 'content', description: 'Can view all versions of content' },
      { name: 'Restore Content Versions', slug: 'restore_content_versions', category: 'content', description: 'Can restore previous versions of content' },
      
      // Content Type permissions
      { name: 'Manage Content Types', slug: 'manage_content_types', category: 'content_types', description: 'Can create, edit and delete content types' },
      
      // Media permissions
      { name: 'Upload Media', slug: 'upload_media', category: 'media', description: 'Can upload media files' },
      { name: 'Delete Media', slug: 'delete_media', category: 'media', description: 'Can delete media files' },
      
      // User permissions
      { name: 'View Users', slug: 'view_users', category: 'users', description: 'Can view user list' },
      { name: 'Create Users', slug: 'create_users', category: 'users', description: 'Can create new users' },
      { name: 'Edit Users', slug: 'edit_users', category: 'users', description: 'Can edit existing users' },
      { name: 'Delete Users', slug: 'delete_users', category: 'users', description: 'Can delete users' },
      
      // Role permissions
      { name: 'View Roles', slug: 'view_roles', category: 'roles', description: 'Can view role list' },
      { name: 'Manage Roles', slug: 'manage_roles', category: 'roles', description: 'Can create, edit and delete roles' },
      { name: 'Assign Roles', slug: 'assign_roles', category: 'roles', description: 'Can assign roles to users' },
      
      // System permissions
      { name: 'Manage Settings', slug: 'manage_settings', category: 'system', description: 'Can manage system settings' },
      { name: 'View Audit Log', slug: 'view_audit_log', category: 'system', description: 'Can view audit log' }
    ];

    await queryInterface.bulkInsert('cms_permissions', permissionsData.map(permission => ({
      id: Sequelize.literal('UUID()'),
      name: permission.name,
      slug: permission.slug,
      description: permission.description,
      category: permission.category,
      createdAt: new Date(),
      updatedAt: new Date()
    })));
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cms_permissions');
  }
};