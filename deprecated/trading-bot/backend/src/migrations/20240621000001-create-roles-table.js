'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cms_roles', {
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
      isSystemRole: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'System roles cannot be deleted or modified by users'
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

    // Add the default roles (admin, editor, contributor)
    await queryInterface.bulkInsert('cms_roles', [
      {
        id: Sequelize.literal('UUID()'),
        name: 'Administrator',
        slug: 'administrator',
        description: 'Full access to all system features',
        isSystemRole: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('UUID()'),
        name: 'Editor',
        slug: 'editor',
        description: 'Can create, edit, and publish content, but cannot manage users or system settings',
        isSystemRole: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: Sequelize.literal('UUID()'),
        name: 'Contributor',
        slug: 'contributor',
        description: 'Can create and edit their own content, but cannot publish',
        isSystemRole: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cms_roles');
  }
};