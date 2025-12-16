const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RolePermission extends Model {
    static associate(models) {
      // Define associations
      RolePermission.belongsTo(models.Role, {
        foreignKey: 'roleId'
      });
      
      RolePermission.belongsTo(models.Permission, {
        foreignKey: 'permissionId'
      });
    }
  }

  RolePermission.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cms_roles',
        key: 'id'
      }
    },
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'cms_permissions',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'RolePermission',
    tableName: 'cms_role_permissions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['roleId', 'permissionId']
      }
    ]
  });

  return RolePermission;
};