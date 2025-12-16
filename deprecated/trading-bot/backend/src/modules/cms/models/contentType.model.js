const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ContentType extends Model {
    static associate(models) {
      // Define associations
      ContentType.hasMany(models.Content, {
        foreignKey: 'contentTypeId',
        as: 'contents'
      });

      ContentType.hasMany(models.ContentField, {
        foreignKey: 'contentTypeId',
        as: 'fields'
      });
    }
  }

  ContentType.init({
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
    isListable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Whether content of this type should be listed in public endpoints'
    },
    defaultStatus: {
      type: DataTypes.STRING,
      defaultValue: 'draft',
      comment: 'Default status for new content of this type'
    }
  }, {
    sequelize,
    modelName: 'ContentType',
    tableName: 'cms_content_types',
    timestamps: true,
    paranoid: true, // Soft deletes
  });

  return ContentType;
};