const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Permission extends Model {
    static associate(models) {
      // Define associations
      Permission.belongsToMany(models.Role, {
        through: 'cms_role_permissions',
        foreignKey: 'permissionId',
        otherKey: 'roleId',
        as: 'roles'
      });
    }
  }

  Permission.init({
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
        is: /^[a-z0-9_]+$/i // Only alphanumeric characters and underscores
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Grouping for permissions (e.g., content, users, settings)'
    }
  }, {
    sequelize,
    modelName: 'Permission',
    tableName: 'cms_permissions',
    timestamps: true
  });

  return Permission;
};