const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class MediaAsset extends Model {
    static associate(models) {
      // Define associations
      MediaAsset.belongsTo(models.User, {
        foreignKey: 'uploadedById',
        as: 'uploadedBy'
      });

      MediaAsset.hasMany(models.ContentFieldValue, {
        foreignKey: 'mediaId',
        as: 'fieldValues'
      });
    }
  }

  MediaAsset.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    originalFilename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'File size in bytes'
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Path relative to media storage root'
    },
    url: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Public URL if available'
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Width in pixels for images'
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Height in pixels for images'
    },
    duration: {
      type: DataTypes.FLOAT,
      allowNull: true,
      comment: 'Duration in seconds for audio/video'
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    altText: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Accessibility text for images'
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional metadata like EXIF data for images'
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of tags for categorization'
    },
    uploadedById: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'archived', 'processing']]
      }
    }
  }, {
    sequelize,
    modelName: 'MediaAsset',
    tableName: 'cms_media_assets',
    timestamps: true,
    paranoid: true, // Soft deletes
  });

  return MediaAsset;
};