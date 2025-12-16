'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cms_content_field_values', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      contentId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cms_contents',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fieldId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'cms_content_fields',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      textValue: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      numberValue: {
        type: Sequelize.FLOAT,
        allowNull: true
      },
      booleanValue: {
        type: Sequelize.BOOLEAN,
        allowNull: true
      },
      dateValue: {
        type: Sequelize.DATE,
        allowNull: true
      },
      jsonValue: {
        type: Sequelize.JSON,
        allowNull: true
      },
      mediaId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'cms_media_assets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      referenceId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      referenceType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      parentId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'cms_content_field_values',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      position: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      updatedById: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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

    // Add index for contentId and fieldId
    await queryInterface.addIndex('cms_content_field_values', ['contentId', 'fieldId'], {
      name: 'cms_content_field_values_content_id_field_id_index'
    });

    // Add index for parentId
    await queryInterface.addIndex('cms_content_field_values', ['parentId'], {
      name: 'cms_content_field_values_parent_id_index'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cms_content_field_values');
  }
};