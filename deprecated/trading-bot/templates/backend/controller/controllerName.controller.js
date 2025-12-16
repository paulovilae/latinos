/**
 * Controller for managing [resource name] resources
 * 
 * This controller handles all [resource name] operations including
 * creating, reading, updating, and deleting resources.
 */

const db = require('../models');
const ResourceModel = db.resourceModel; // Replace with actual model name
const { Op } = require('sequelize');

/**
 * Create a new resource
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.create = async (req, res) => {
  try {
    // Validate request
    if (!req.body.name) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty!"
      });
    }

    // Create resource object
    const resource = {
      name: req.body.name,
      description: req.body.description,
      // Add additional fields as needed
      userId: req.userId // Assuming user ID is attached by auth middleware
    };

    // Save to database
    const data = await ResourceModel.create(resource);
    
    res.status(201).json({
      success: true,
      data: data
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Some error occurred while creating the resource."
    });
  }
};

/**
 * Retrieve all resources with optional filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.findAll = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    // Filter conditions
    const filter = req.query.filter;
    const condition = filter
      ? { name: { [Op.like]: `%${filter}%` } }
      : null;

    // Query with pagination and filtering
    const { count, rows } = await ResourceModel.findAndCountAll({
      where: condition,
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: {
        data: rows,
        pagination: {
          total: count,
          page,
          limit,
          pages: totalPages
        }
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Some error occurred while retrieving resources."
    });
  }
};

/**
 * Find a single resource by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.findOne = async (req, res) => {
  try {
    const id = req.params.id;

    const data = await ResourceModel.findByPk(id);
    
    if (data) {
      res.json({
        success: true,
        data: data
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Resource with id=${id} not found.`
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Error retrieving resource with id=${req.params.id}`
    });
  }
};

/**
 * Update a resource by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.update = async (req, res) => {
  try {
    const id = req.params.id;

    // Check if user has permission to update this resource
    const resource = await ResourceModel.findByPk(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: `Resource with id=${id} not found.`
      });
    }

    // Optional: Check ownership if required
    // if (resource.userId !== req.userId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "You don't have permission to update this resource."
    //   });
    // }

    // Update resource
    const [updated] = await ResourceModel.update(req.body, {
      where: { id: id }
    });

    if (updated) {
      // Get updated data
      const updatedData = await ResourceModel.findByPk(id);
      res.json({
        success: true,
        data: updatedData,
        message: "Resource was updated successfully."
      });
    } else {
      res.json({
        success: false,
        message: `Cannot update resource with id=${id}. Maybe resource was not found or req.body is empty!`
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Error updating resource with id=${req.params.id}`
    });
  }
};

/**
 * Delete a resource by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.delete = async (req, res) => {
  try {
    const id = req.params.id;

    // Check if user has permission to delete this resource
    const resource = await ResourceModel.findByPk(id);
    if (!resource) {
      return res.status(404).json({
        success: false,
        message: `Resource with id=${id} not found.`
      });
    }

    // Optional: Check ownership if required
    // if (resource.userId !== req.userId) {
    //   return res.status(403).json({
    //     success: false,
    //     message: "You don't have permission to delete this resource."
    //   });
    // }

    // Delete resource
    const deleted = await ResourceModel.destroy({
      where: { id: id }
    });

    if (deleted) {
      res.json({
        success: true,
        message: "Resource was deleted successfully!"
      });
    } else {
      res.status(404).json({
        success: false,
        message: `Cannot delete resource with id=${id}. Maybe resource was not found!`
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: `Error deleting resource with id=${req.params.id}`
    });
  }
};