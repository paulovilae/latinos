const { ContentType, ContentField } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../../../models');

/**
 * Content Type Controller
 * Handles CRUD operations for content types
 */
const contentTypeController = {
  /**
   * Get all content types
   */
  getAll: async (req, res) => {
    try {
      const contentTypes = await ContentType.findAll({
        order: [['name', 'ASC']]
      });
      
      return res.status(200).json({
        status: 'success',
        data: contentTypes
      });
    } catch (error) {
      console.error('Error getting content types:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve content types',
        error: error.message
      });
    }
  },

  /**
   * Get a single content type by ID
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const contentType = await ContentType.findByPk(id, {
        include: [
          {
            association: 'fields',
            order: [['displayOrder', 'ASC']]
          }
        ]
      });
      
      if (!contentType) {
        return res.status(404).json({
          status: 'error',
          message: 'Content type not found'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: contentType
      });
    } catch (error) {
      console.error('Error getting content type:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve content type',
        error: error.message
      });
    }
  },

  /**
   * Create a new content type
   */
  create: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { name, slug, description, isListable, defaultStatus, fields } = req.body;
      
      // Check if content type with same slug already exists
      const existingType = await ContentType.findOne({
        where: { 
          [Op.or]: [
            { slug },
            { name }
          ]
        }
      });
      
      if (existingType) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: existingType.slug === slug 
            ? 'A content type with this slug already exists' 
            : 'A content type with this name already exists'
        });
      }
      
      // Create content type
      const contentType = await ContentType.create({
        name,
        slug,
        description,
        isListable,
        defaultStatus
      }, { transaction });
      
      // Create fields if provided
      if (fields && Array.isArray(fields) && fields.length > 0) {
        const contentTypeFields = fields.map(field => ({
          ...field,
          contentTypeId: contentType.id
        }));
        
        await ContentField.bulkCreate(contentTypeFields, { transaction });
      }
      
      await transaction.commit();
      
      // Fetch the created content type with its fields
      const createdContentType = await ContentType.findByPk(contentType.id, {
        include: [
          {
            association: 'fields',
            order: [['displayOrder', 'ASC']]
          }
        ]
      });
      
      return res.status(201).json({
        status: 'success',
        message: 'Content type created successfully',
        data: createdContentType
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating content type:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create content type',
        error: error.message
      });
    }
  },

  /**
   * Update an existing content type
   */
  update: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { name, description, isListable, defaultStatus } = req.body;
      
      // Find content type
      const contentType = await ContentType.findByPk(id);
      
      if (!contentType) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Content type not found'
        });
      }
      
      // Check if name is being changed and if it conflicts
      if (name && name !== contentType.name) {
        const existingType = await ContentType.findOne({
          where: { name }
        });
        
        if (existingType) {
          await transaction.rollback();
          return res.status(400).json({
            status: 'error',
            message: 'A content type with this name already exists'
          });
        }
      }
      
      // Update content type
      await contentType.update({
        name: name || contentType.name,
        description: description !== undefined ? description : contentType.description,
        isListable: isListable !== undefined ? isListable : contentType.isListable,
        defaultStatus: defaultStatus || contentType.defaultStatus
      }, { transaction });
      
      await transaction.commit();
      
      // Fetch updated content type
      const updatedContentType = await ContentType.findByPk(id, {
        include: [
          {
            association: 'fields',
            order: [['displayOrder', 'ASC']]
          }
        ]
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Content type updated successfully',
        data: updatedContentType
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating content type:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update content type',
        error: error.message
      });
    }
  },

  /**
   * Delete a content type
   */
  delete: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      
      // Find content type
      const contentType = await ContentType.findByPk(id, {
        include: [
          {
            association: 'contents'
          }
        ]
      });
      
      if (!contentType) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Content type not found'
        });
      }
      
      // Check if content type has content
      if (contentType.contents && contentType.contents.length > 0) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'Cannot delete content type that has content. Delete all content first.'
        });
      }
      
      // Delete content fields
      await ContentField.destroy({
        where: { contentTypeId: id },
        transaction
      });
      
      // Delete content type
      await contentType.destroy({ transaction });
      
      await transaction.commit();
      
      return res.status(200).json({
        status: 'success',
        message: 'Content type deleted successfully'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error deleting content type:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete content type',
        error: error.message
      });
    }
  }
};

module.exports = contentTypeController;