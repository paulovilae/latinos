'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cms_content_fields', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      contentTypeId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cms_content_types',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      key: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      required: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      settings: {
        type: Sequelize.JSON,
        allowNull: true
      },
      displayOrder: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      searchable: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      validations: {
        type: Sequelize.JSON,
        allowNull: true
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

    // Add unique index for contentTypeId + key
    await queryInterface.addIndex('cms_content_fields', ['contentTypeId', 'key'], {
      unique: true,
      name: 'cms_content_fields_content_type_id_key_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cms_content_fields');
  }
};