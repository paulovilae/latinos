const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Content extends Model {
    static associate(models) {
      // Define associations
      Content.belongsTo(models.ContentType, {
        foreignKey: 'contentTypeId',
        as: 'contentType'
      });

      Content.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdBy'
      });

      Content.belongsTo(models.User, {
        foreignKey: 'updatedById',
        as: 'updatedBy'
      });

      Content.hasMany(models.ContentVersion, {
        foreignKey: 'contentId',
        as: 'versions'
      });

      Content.hasMany(models.ContentFieldValue, {
        foreignKey: 'contentId',
        as: 'fieldValues'
      });
    }
  }

  Content.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    contentTypeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cms_content_types',
        key: 'id'
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^[a-z0-9-]+$/i // Only alphanumeric characters and hyphens
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'published', 'archived']]
      }
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    updatedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Content',
    tableName: 'cms_contents',
    timestamps: true,
    paranoid: true, // Soft deletes
    indexes: [
      {
        unique: true,
        fields: ['contentTypeId', 'slug']
      }
    ]
  });

  return Content;
};