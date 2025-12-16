const { Role, Permission, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../../../models');

/**
 * Role Controller
 * Handles CRUD operations for roles
 */
const roleController = {
  /**
   * Get all roles with optional filtering
   */
  getAll: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      const { count, rows: roles } = await Role.findAndCountAll({
        include: [
          {
            model: Permission,
            as: 'permissions',
            attributes: ['id', 'name', 'slug', 'category'],
            through: { attributes: [] } // Don't include junction table fields
          }
        ],
        order: [['name', 'ASC']],
        limit: parseInt(limit),
        offset
      });
      
      return res.status(200).json({
        status: 'success',
        data: {
          roles,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting roles:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve roles',
        error: error.message
      });
    }
  },
  
  /**
   * Get a single role by ID
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const role = await Role.findByPk(id, {
        include: [
          {
            model: Permission,
            as: 'permissions',
            attributes: ['id', 'name', 'slug', 'category', 'description'],
            through: { attributes: [] }
          },
          {
            model: User,
            as: 'users',
            attributes: ['id', 'username', 'email'],
            limit: 10 // Limit number of users returned
          }
        ]
      });
      
      if (!role) {
        return res.status(404).json({
          status: 'error',
          message: 'Role not found'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: role
      });
    } catch (error) {
      console.error('Error getting role:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve role',
        error: error.message
      });
    }
  },
  
  /**
   * Create a new role
   */
  create: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { name, slug, description, permissions } = req.body;
      
      // Check if role with this slug already exists
      const existingRole = await Role.findOne({
        where: {
          [Op.or]: [
            { slug },
            { name }
          ]
        }
      });
      
      if (existingRole) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'A role with this name or slug already exists'
        });
      }
      
      // Create the role
      const role = await Role.create({
        name,
        slug,
        description,
        isSystemRole: false
      }, { transaction });
      
      // Add permissions if provided
      if (permissions && Array.isArray(permissions) && permissions.length > 0) {
        // Get the permission records
        const permissionRecords = await Permission.findAll({
          where: {
            id: {
              [Op.in]: permissions
            }
          }
        });
        
        // Associate permissions with role
        await role.setPermissions(permissionRecords, { transaction });
      }
      
      await transaction.commit();
      
      // Return the created role with its permissions
      const createdRole = await Role.findByPk(role.id, {
        include: [
          {
            model: Permission,
            as: 'permissions',
            attributes: ['id', 'name', 'slug', 'category'],
            through: { attributes: [] }
          }
        ]
      });
      
      return res.status(201).json({
        status: 'success',
        message: 'Role created successfully',
        data: createdRole
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating role:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create role',
        error: error.message
      });
    }
  },
  
  /**
   * Update an existing role
   */
  update: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { name, description, permissions } = req.body;
      
      // Find the role
      const role = await Role.findByPk(id);
      
      if (!role) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Role not found'
        });
      }
      
      // Check if role is a system role (cannot be modified)
      if (role.isSystemRole) {
        await transaction.rollback();
        return res.status(403).json({
          status: 'error',
          message: 'System roles cannot be modified'
        });
      }
      
      // Update the role (slug cannot be changed)
      await role.update({
        name: name || role.name,
        description: description !== undefined ? description : role.description
      }, { transaction });
      
      // Update permissions if provided
      if (permissions && Array.isArray(permissions)) {
        // Get the permission records
        const permissionRecords = await Permission.findAll({
          where: {
            id: {
              [Op.in]: permissions
            }
          }
        });
        
        // Replace all permissions with the new set
        await role.setPermissions(permissionRecords, { transaction });
      }
      
      await transaction.commit();
      
      // Return the updated role with its permissions
      const updatedRole = await Role.findByPk(id, {
        include: [
          {
            model: Permission,
            as: 'permissions',
            attributes: ['id', 'name', 'slug', 'category'],
            through: { attributes: [] }
          }
        ]
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Role updated successfully',
        data: updatedRole
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating role:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update role',
        error: error.message
      });
    }
  },
  
  /**
   * Delete a role
   */
  delete: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      
      // Find the role
      const role = await Role.findByPk(id, {
        include: [
          {
            model: User,
            as: 'users'
          }
        ]
      });
      
      if (!role) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Role not found'
        });
      }
      
      // Check if role is a system role (cannot be deleted)
      if (role.isSystemRole) {
        await transaction.rollback();
        return res.status(403).json({
          status: 'error',
          message: 'System roles cannot be deleted'
        });
      }
      
      // Check if role has users assigned
      if (role.users && role.users.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete role that has users assigned to it'
        });
      }
      
      // Remove all permission associations
      await role.setPermissions([], { transaction });
      
      // Delete the role
      await role.destroy({ transaction });
      
      await transaction.commit();
      
      return res.status(200).json({
        status: 'success',
        message: 'Role deleted successfully'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error deleting role:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete role',
        error: error.message
      });
    }
  }
};

module.exports = roleController;