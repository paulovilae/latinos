'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('system_status', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      status: {
        type: Sequelize.ENUM('running', 'stopped', 'error'),
        allowNull: false,
        defaultValue: 'stopped',
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      active_formulas: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      last_execution: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      next_execution: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Insert default system status record
    await queryInterface.bulkInsert('system_status', [{
      status: 'stopped',
      active_formulas: 0,
      updated_at: new Date()
    }]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('system_status');
  }
};