const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ContentStatus extends Model {
    static associate(models) {
      // Define associations - no direct associations needed
    }
  }

  ContentStatus.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        is: /^[a-z0-9-]+$/i // Only alphanumeric characters and hyphens
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    color: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Hex color code for UI display'
    },
    isDefault: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isPublished: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Whether content with this status is considered published'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'ContentStatus',
    tableName: 'cms_content_statuses',
    timestamps: true,
    paranoid: true, // Soft deletes
  });

  return ContentStatus;
};