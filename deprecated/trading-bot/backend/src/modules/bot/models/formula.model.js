const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../models');

const Formula = sequelize.define(
  'Formula',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    exchange: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'AMEX',
    },
    interval: {
      type: DataTypes.ENUM('1m', '5m', '15m', '1h', '1d'),
      allowNull: false,
    },
    parameters: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'formulas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
);

module.exports = Formula;