const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // Define associations here
      User.hasMany(models.RefreshToken, {
        foreignKey: 'userId',
        as: 'refreshTokens'
      });
      
      // RBAC association - conditionally check if Role model is available
      // This will be handled in the CMS module association setup
    }

    // Instance method to check if password matches
    async validatePassword(password) {
      return bcrypt.compare(password, this.password);
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 30]
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'user',
      validate: {
        isIn: [['user', 'admin']]
      }
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'inactive', 'suspended']]
      }
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'cms_roles',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'User',
    timestamps: true,
    hooks: {
      // Hash password before saving to database
      beforeSave: async (user) => {
        if (user.changed('password')) {
          const saltRounds = parseInt(process.env.PASSWORD_SALT_ROUNDS, 10) || 10;
          user.password = await bcrypt.hash(user.password, saltRounds);
        }
      }
    }
  });

  return User;
};