const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ContentFieldValue extends Model {
    static associate(models) {
      // Define associations
      ContentFieldValue.belongsTo(models.Content, {
        foreignKey: 'contentId',
        as: 'content'
      });

      ContentFieldValue.belongsTo(models.ContentField, {
        foreignKey: 'fieldId',
        as: 'field'
      });

      ContentFieldValue.belongsTo(models.User, {
        foreignKey: 'updatedById',
        as: 'updatedBy'
      });

      // Self-referential for handling complex values (like arrays)
      ContentFieldValue.belongsTo(ContentFieldValue, {
        foreignKey: 'parentId',
        as: 'parent'
      });

      ContentFieldValue.hasMany(ContentFieldValue, {
        foreignKey: 'parentId',
        as: 'children'
      });
    }
  }

  ContentFieldValue.init({
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
    fieldId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cms_content_fields',
        key: 'id'
      }
    },
    textValue: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    numberValue: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    booleanValue: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    dateValue: {
      type: DataTypes.DATE,
      allowNull: true
    },
    jsonValue: {
      type: DataTypes.JSON,
      allowNull: true
    },
    mediaId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'cms_media_assets',
        key: 'id'
      }
    },
    referenceId: {
      type: DataTypes.UUID,
      allowNull: true,
      comment: 'For reference fields, this points to another content entry'
    },
    referenceType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'For reference fields, indicates the type of content being referenced'
    },
    parentId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'cms_content_field_values',
        key: 'id'
      },
      comment: 'For array/complex fields, refers to parent field value'
    },
    position: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'For array fields, indicates position in the array'
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
    modelName: 'ContentFieldValue',
    tableName: 'cms_content_field_values',
    timestamps: true,
    indexes: [
      {
        fields: ['contentId', 'fieldId']
      },
      {
        fields: ['parentId']
      }
    ]
  });

  return ContentFieldValue;
};