const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ContentVersion extends Model {
    static associate(models) {
      // Define associations
      ContentVersion.belongsTo(models.Content, {
        foreignKey: 'contentId',
        as: 'content'
      });

      ContentVersion.belongsTo(models.User, {
        foreignKey: 'createdById',
        as: 'createdBy'
      });
    }
  }

  ContentVersion.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    contentId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cms_contents',
        key: 'id'
      }
    },
    versionNumber: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'draft',
      validate: {
        isIn: [['draft', 'published', 'archived']]
      }
    },
    data: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Snapshot of all field values at this version'
    },
    createdById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Optional notes about this version'
    }
  }, {
    sequelize,
    modelName: 'ContentVersion',
    tableName: 'cms_content_versions',
    timestamps: true,
    updatedAt: false, // Only need createdAt for versions
    indexes: [
      {
        unique: true,
        fields: ['contentId', 'versionNumber']
      }
    ]
  });

  return ContentVersion;
};