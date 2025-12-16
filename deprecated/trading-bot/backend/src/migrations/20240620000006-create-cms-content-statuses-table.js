'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cms_content_statuses', {
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
      color: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isDefault: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isPublished: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Insert default statuses
    const { v4: uuidv4 } = require('uuid');
    
    await queryInterface.bulkInsert('cms_content_statuses', [
      {
        id: uuidv4(),
        name: 'Draft',
        slug: 'draft',
        description: 'Content is in draft mode and not visible to the public',
        color: '#6c757d',
        isDefault: true,
        isPublished: false,
        displayOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Published',
        slug: 'published',
        description: 'Content is published and visible to the public',
        color: '#28a745',
        isDefault: false,
        isPublished: true,
        displayOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Archived',
        slug: 'archived',
        description: 'Content is archived and not visible to the public',
        color: '#dc3545',
        isDefault: false,
        isPublished: false,
        displayOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cms_content_statuses');
  }
};