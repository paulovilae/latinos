const { Permission } = require('../models');
const { Op } = require('sequelize');

/**
 * Permission Controller
 * Handles CRUD operations for permissions
 */
const permissionController = {
  /**
   * Get all permissions with optional filtering
   */
  getAll: async (req, res) => {
    try {
      const { category, page = 1, limit = 50 } = req.query;
      const offset = (page - 1) * limit;
      
      // Build query conditions
      const where = {};
      
      // Filter by category if provided
      if (category) {
        where.category = category;
      }
      
      const { count, rows: permissions } = await Permission.findAndCountAll({
        where,
        order: [
          ['category', 'ASC'],
          ['name', 'ASC']
        ],
        limit: parseInt(limit),
        offset
      });
      
      return res.status(200).json({
        status: 'success',
        data: {
          permissions,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting permissions:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve permissions',
        error: error.message
      });
    }
  },
  
  /**
   * Get a single permission by ID
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const permission = await Permission.findByPk(id, {
        include: [
          {
            association: 'roles',
            attributes: ['id', 'name', 'slug'],
            through: { attributes: [] }
          }
        ]
      });
      
      if (!permission) {
        return res.status(404).json({
          status: 'error',
          message: 'Permission not found'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: permission
      });
    } catch (error) {
      console.error('Error getting permission:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve permission',
        error: error.message
      });
    }
  },
  
  /**
   * Get all permission categories
   */
  getCategories: async (req, res) => {
    try {
      // Get distinct categories from permissions
      const categories = await Permission.findAll({
        attributes: [
          [Permission.sequelize.fn('DISTINCT', Permission.sequelize.col('category')), 'category']
        ],
        order: [['category', 'ASC']]
      });
      
      // Extract category values
      const categoryList = categories.map(c => c.getDataValue('category'));
      
      return res.status(200).json({
        status: 'success',
        data: categoryList
      });
    } catch (error) {
      console.error('Error getting permission categories:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve permission categories',
        error: error.message
      });
    }
  },
  
  /**
   * Get permissions grouped by category
   */
  getGroupedByCategory: async (req, res) => {
    try {
      // Get all permissions
      const permissions = await Permission.findAll({
        order: [
          ['category', 'ASC'],
          ['name', 'ASC']
        ]
      });
      
      // Group permissions by category
      const grouped = permissions.reduce((acc, permission) => {
        const category = permission.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(permission);
        return acc;
      }, {});
      
      return res.status(200).json({
        status: 'success',
        data: grouped
      });
    } catch (error) {
      console.error('Error getting grouped permissions:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve grouped permissions',
        error: error.message
      });
    }
  }
};

module.exports = permissionController;