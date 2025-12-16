'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add roleId column to Users table
    await queryInterface.addColumn('Users', 'roleId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'cms_roles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    
    // Create index on roleId
    await queryInterface.addIndex('Users', ['roleId']);

    // Get admin role ID
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id FROM cms_roles WHERE slug = 'administrator'"
    );
    
    if (roles.length > 0) {
      const adminRoleId = roles[0].id;
      
      // Update existing users with 'admin' role to have the administrator role ID
      await queryInterface.sequelize.query(
        `UPDATE "Users" SET "roleId" = '${adminRoleId}' WHERE role = 'admin'`
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the roleId column
    await queryInterface.removeColumn('Users', 'roleId');
  }
};