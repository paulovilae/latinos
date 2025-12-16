const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Role extends Model {
    static associate(models) {
      // Define associations
      Role.hasMany(models.User, {
        foreignKey: 'roleId',
        as: 'users'
      });

      Role.belongsToMany(models.Permission, {
        through: 'cms_role_permissions',
        foreignKey: 'roleId',
        otherKey: 'permissionId',
        as: 'permissions'
      });
    }
  }

  Role.init({
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
    isSystemRole: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'System roles cannot be deleted or modified by users'
    }
  }, {
    sequelize,
    modelName: 'Role',
    tableName: 'cms_roles',
    timestamps: true
  });

  return Role;
};