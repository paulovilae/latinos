const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../models');

const SystemStatus = sequelize.define(
  'SystemStatus',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM('running', 'stopped', 'error'),
      allowNull: false,
      defaultValue: 'stopped',
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    active_formulas: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    last_execution: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    next_execution: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'system_status',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at',
  }
);

module.exports = SystemStatus;