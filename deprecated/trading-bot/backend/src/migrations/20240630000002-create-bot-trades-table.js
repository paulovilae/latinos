'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('trades', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      symbol: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      side: {
        type: Sequelize.ENUM('buy', 'sell'),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.FLOAT,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      status: {
        type: Sequelize.ENUM('open', 'filled', 'cancelled', 'expired', 'rejected'),
        allowNull: false,
      },
      stop_loss: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      take_profit: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      is_successful: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      filled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('trades');
  }
};