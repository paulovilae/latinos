'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cms_role_permissions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      roleId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cms_roles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permissionId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cms_permissions',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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

    // Add a unique index to prevent duplicate role-permission assignments
    await queryInterface.addIndex('cms_role_permissions', ['roleId', 'permissionId'], {
      unique: true,
      name: 'cms_role_permissions_role_id_permission_id_unique'
    });

    // Get role IDs
    const [roles] = await queryInterface.sequelize.query(
      'SELECT id, slug FROM cms_roles'
    );

    // Get permission IDs
    const [permissions] = await queryInterface.sequelize.query(
      'SELECT id, slug FROM cms_permissions'
    );

    // Create a mapping for easy lookup
    const roleMap = roles.reduce((map, role) => {
      map[role.slug] = role.id;
      return map;
    }, {});

    const permissionMap = permissions.reduce((map, permission) => {
      map[permission.slug] = permission.id;
      return map;
    }, {});

    // Assign permissions to default roles
    const rolePermissions = [];
    const now = new Date();

    // Administrator role gets all permissions
    permissions.forEach(permission => {
      if (roleMap.administrator) {
        rolePermissions.push({
          id: Sequelize.literal('UUID()'),
          roleId: roleMap.administrator,
          permissionId: permission.id,
          createdAt: now,
          updatedAt: now
        });
      }
    });

    // Editor role permissions
    const editorPermissions = [
      'create_content', 'edit_any_content', 'edit_own_content', 
      'delete_own_content', 'publish_content', 'view_content_versions',
      'restore_content_versions', 'upload_media', 'delete_media'
    ];

    editorPermissions.forEach(permSlug => {
      if (roleMap.editor && permissionMap[permSlug]) {
        rolePermissions.push({
          id: Sequelize.literal('UUID()'),
          roleId: roleMap.editor,
          permissionId: permissionMap[permSlug],
          createdAt: now,
          updatedAt: now
        });
      }
    });

    // Contributor role permissions
    const contributorPermissions = [
      'create_content', 'edit_own_content', 'delete_own_content', 
      'view_content_versions', 'upload_media'
    ];

    contributorPermissions.forEach(permSlug => {
      if (roleMap.contributor && permissionMap[permSlug]) {
        rolePermissions.push({
          id: Sequelize.literal('UUID()'),
          roleId: roleMap.contributor,
          permissionId: permissionMap[permSlug],
          createdAt: now,
          updatedAt: now
        });
      }
    });

    // Bulk insert the role-permission assignments
    if (rolePermissions.length > 0) {
      await queryInterface.bulkInsert('cms_role_permissions', rolePermissions);
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cms_role_permissions');
  }
};