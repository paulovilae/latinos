const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../models');

const Trade = sequelize.define(
  'Trade',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    side: {
      type: DataTypes.ENUM('buy', 'sell'),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    status: {
      type: DataTypes.ENUM('open', 'filled', 'cancelled', 'expired', 'rejected'),
      allowNull: false,
    },
    stop_loss: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    take_profit: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    is_successful: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    filled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'trades',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
  }
);

module.exports = Trade;