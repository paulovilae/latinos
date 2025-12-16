const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class ContentField extends Model {
    static associate(models) {
      // Define associations
      ContentField.belongsTo(models.ContentType, {
        foreignKey: 'contentTypeId',
        as: 'contentType'
      });

      ContentField.hasMany(models.ContentFieldValue, {
        foreignKey: 'fieldId',
        as: 'values'
      });
    }
  }

  ContentField.init({
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
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    key: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^[a-z0-9_]+$/i // Only alphanumeric characters and underscores
      }
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['text', 'textarea', 'rich_text', 'number', 'boolean', 'date', 'datetime', 'select', 'media', 'reference']]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    settings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Field-specific settings like options for select fields, media types, etc.'
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    searchable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    validations: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Custom validation rules for this field'
    }
  }, {
    sequelize,
    modelName: 'ContentField',
    tableName: 'cms_content_fields',
    timestamps: true,
    paranoid: true, // Soft deletes
    indexes: [
      {
        unique: true,
        fields: ['contentTypeId', 'key']
      }
    ]
  });

  return ContentField;
};