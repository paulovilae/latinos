const { 
  Content, 
  ContentType, 
  ContentVersion, 
  ContentField, 
  ContentFieldValue 
} = require('../models');
const { sequelize } = require('../../../models');
const { Op } = require('sequelize');

/**
 * Content Controller
 * Handles CRUD operations for content entries
 */
const contentController = {
  /**
   * Get all content entries or filter by content type
   */
  getAll: async (req, res) => {
    try {
      const { contentTypeId, contentTypeSlug, status, page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      // Build query conditions
      const where = {};
      
      // Filter by content type
      if (contentTypeId) {
        where.contentTypeId = contentTypeId;
      } else if (contentTypeSlug) {
        const contentType = await ContentType.findOne({ where: { slug: contentTypeSlug } });
        if (contentType) {
          where.contentTypeId = contentType.id;
        } else {
          return res.status(404).json({
            status: 'error',
            message: `Content type with slug '${contentTypeSlug}' not found`
          });
        }
      }
      
      // Filter by status
      if (status) {
        where.status = status;
      }
      
      // Get content entries
      const { count, rows: contents } = await Content.findAndCountAll({
        where,
        include: [
          {
            association: 'contentType',
            attributes: ['id', 'name', 'slug']
          },
          {
            association: 'createdBy',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }
        ],
        order: [['updatedAt', 'DESC']],
        limit: parseInt(limit),
        offset: offset
      });
      
      return res.status(200).json({
        status: 'success',
        data: {
          contents,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting content entries:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve content entries',
        error: error.message
      });
    }
  },

  /**
   * Get a single content entry by ID
   */
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const content = await Content.findByPk(id, {
        include: [
          {
            association: 'contentType',
            include: [
              {
                association: 'fields',
                order: [['displayOrder', 'ASC']]
              }
            ]
          },
          {
            association: 'fieldValues',
            include: [
              {
                association: 'field'
              }
            ]
          },
          {
            association: 'createdBy',
            attributes: ['id', 'username', 'firstName', 'lastName']
          },
          {
            association: 'updatedBy',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }
        ]
      });
      
      if (!content) {
        return res.status(404).json({
          status: 'error',
          message: 'Content not found'
        });
      }
      
      // Transform field values into a more usable format
      const formattedContent = {
        ...content.toJSON(),
        fieldValues: content.fieldValues.reduce((acc, value) => {
          const fieldKey = value.field.key;
          let fieldValue;
          
          // Determine which value to use based on field type
          if (value.textValue !== null) fieldValue = value.textValue;
          else if (value.numberValue !== null) fieldValue = value.numberValue;
          else if (value.booleanValue !== null) fieldValue = value.booleanValue;
          else if (value.dateValue !== null) fieldValue = value.dateValue;
          else if (value.jsonValue !== null) fieldValue = value.jsonValue;
          else if (value.mediaId !== null) fieldValue = value.mediaId;
          else if (value.referenceId !== null) fieldValue = {
            id: value.referenceId,
            type: value.referenceType
          };
          
          acc[fieldKey] = fieldValue;
          return acc;
        }, {})
      };
      
      return res.status(200).json({
        status: 'success',
        data: formattedContent
      });
    } catch (error) {
      console.error('Error getting content entry:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve content entry',
        error: error.message
      });
    }
  },

  /**
   * Create a new content entry
   */
  create: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { contentTypeId, title, slug, status, fields } = req.body;
      
      // Validate content type
      const contentType = await ContentType.findByPk(contentTypeId, {
        include: [
          {
            association: 'fields',
            order: [['displayOrder', 'ASC']]
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
      
      // Check if slug is already in use for this content type
      const existingContent = await Content.findOne({
        where: {
          contentTypeId,
          slug
        }
      });
      
      if (existingContent) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'A content entry with this slug already exists for this content type'
        });
      }
      
      // Create content entry
      const content = await Content.create({
        contentTypeId,
        title,
        slug,
        status: status || contentType.defaultStatus,
        publishedAt: status === 'published' ? new Date() : null,
        createdById: req.user.id,
        updatedById: req.user.id
      }, { transaction });
      
      // Process field values
      if (fields && typeof fields === 'object') {
        const fieldEntries = await Promise.all(
          contentType.fields.map(async field => {
            const fieldKey = field.key;
            const fieldValue = fields[fieldKey];
            
            // Skip if no value provided for this field
            if (fieldValue === undefined) return null;
            
            // Prepare field value based on type
            const valueObj = {
              contentId: content.id,
              fieldId: field.id,
              updatedById: req.user.id
            };
            
            switch (field.type) {
              case 'text':
              case 'textarea':
              case 'rich_text':
                valueObj.textValue = String(fieldValue);
                break;
              case 'number':
                valueObj.numberValue = Number(fieldValue);
                break;
              case 'boolean':
                valueObj.booleanValue = Boolean(fieldValue);
                break;
              case 'date':
              case 'datetime':
                valueObj.dateValue = new Date(fieldValue);
                break;
              case 'select':
                valueObj.textValue = String(fieldValue);
                break;
              case 'media':
                valueObj.mediaId = fieldValue;
                break;
              case 'reference':
                if (fieldValue && typeof fieldValue === 'object') {
                  valueObj.referenceId = fieldValue.id;
                  valueObj.referenceType = fieldValue.type;
                } else {
                  valueObj.referenceId = fieldValue;
                }
                break;
              default:
                // For complex fields or custom types
                valueObj.jsonValue = fieldValue;
            }
            
            return valueObj;
          })
        );
        
        // Filter out null values and create field values
        const validFieldEntries = fieldEntries.filter(entry => entry !== null);
        if (validFieldEntries.length > 0) {
          await ContentFieldValue.bulkCreate(validFieldEntries, { transaction });
        }
      }
      
      // Create initial version
      await ContentVersion.create({
        contentId: content.id,
        versionNumber: 1,
        title,
        status: content.status,
        data: fields || {},
        createdById: req.user.id,
        notes: 'Initial version'
      }, { transaction });
      
      await transaction.commit();
      
      // Return the created content with its field values
      const createdContent = await Content.findByPk(content.id, {
        include: [
          {
            association: 'contentType',
            attributes: ['id', 'name', 'slug']
          },
          {
            association: 'fieldValues',
            include: [
              {
                association: 'field'
              }
            ]
          }
        ]
      });
      
      return res.status(201).json({
        status: 'success',
        message: 'Content created successfully',
        data: createdContent
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating content:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create content',
        error: error.message
      });
    }
  },

  /**
   * Update an existing content entry
   */
  update: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { title, slug, status, fields } = req.body;
      
      // Find content
      const content = await Content.findByPk(id, {
        include: [
          {
            association: 'contentType',
            include: [
              {
                association: 'fields'
              }
            ]
          },
          {
            association: 'fieldValues'
          }
        ]
      });
      
      if (!content) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Content not found'
        });
      }
      
      // Check if slug is being changed and if it conflicts
      if (slug && slug !== content.slug) {
        const existingContent = await Content.findOne({
          where: {
            contentTypeId: content.contentTypeId,
            slug,
            id: { [Op.ne]: id }
          }
        });
        
        if (existingContent) {
          await transaction.rollback();
          return res.status(400).json({
            status: 'error',
            message: 'A content entry with this slug already exists for this content type'
          });
        }
      }
      
      // Calculate version number
      const latestVersion = await ContentVersion.findOne({
        where: { contentId: id },
        order: [['versionNumber', 'DESC']]
      });
      
      const versionNumber = latestVersion ? latestVersion.versionNumber + 1 : 1;
      
      // Update publish date if status changed to published
      let publishedAt = content.publishedAt;
      if (status === 'published' && content.status !== 'published') {
        publishedAt = new Date();
      }
      
      // Update content
      await content.update({
        title: title || content.title,
        slug: slug || content.slug,
        status: status || content.status,
        publishedAt,
        updatedById: req.user.id
      }, { transaction });
      
      // Process field values if provided
      if (fields && typeof fields === 'object') {
        // Get current field values as a map for easy access
        const currentFieldValues = content.fieldValues.reduce((acc, value) => {
          acc[value.fieldId] = value;
          return acc;
        }, {});
        
        // Process each field
        await Promise.all(
          content.contentType.fields.map(async field => {
            const fieldKey = field.key;
            const fieldValue = fields[fieldKey];
            
            // Skip if no value provided for this field
            if (fieldValue === undefined) return;
            
            // Prepare field value based on type
            const valueObj = {
              updatedById: req.user.id
            };
            
            // Reset all value fields
            valueObj.textValue = null;
            valueObj.numberValue = null;
            valueObj.booleanValue = null;
            valueObj.dateValue = null;
            valueObj.jsonValue = null;
            valueObj.mediaId = null;
            valueObj.referenceId = null;
            valueObj.referenceType = null;
            
            // Set the appropriate value field based on type
            switch (field.type) {
              case 'text':
              case 'textarea':
              case 'rich_text':
                valueObj.textValue = String(fieldValue);
                break;
              case 'number':
                valueObj.numberValue = Number(fieldValue);
                break;
              case 'boolean':
                valueObj.booleanValue = Boolean(fieldValue);
                break;
              case 'date':
              case 'datetime':
                valueObj.dateValue = new Date(fieldValue);
                break;
              case 'select':
                valueObj.textValue = String(fieldValue);
                break;
              case 'media':
                valueObj.mediaId = fieldValue;
                break;
              case 'reference':
                if (fieldValue && typeof fieldValue === 'object') {
                  valueObj.referenceId = fieldValue.id;
                  valueObj.referenceType = fieldValue.type;
                } else {
                  valueObj.referenceId = fieldValue;
                }
                break;
              default:
                // For complex fields or custom types
                valueObj.jsonValue = fieldValue;
            }
            
            // Update or create field value
            if (currentFieldValues[field.id]) {
              await currentFieldValues[field.id].update(valueObj, { transaction });
            } else {
              await ContentFieldValue.create({
                contentId: content.id,
                fieldId: field.id,
                ...valueObj
              }, { transaction });
            }
          })
        );
      }
      
      // Create new version
      await ContentVersion.create({
        contentId: content.id,
        versionNumber,
        title: title || content.title,
        status: status || content.status,
        data: fields || {},
        createdById: req.user.id,
        notes: `Updated by ${req.user.username}`
      }, { transaction });
      
      await transaction.commit();
      
      // Return the updated content with its field values
      const updatedContent = await Content.findByPk(id, {
        include: [
          {
            association: 'contentType',
            attributes: ['id', 'name', 'slug']
          },
          {
            association: 'fieldValues',
            include: [
              {
                association: 'field'
              }
            ]
          }
        ]
      });
      
      return res.status(200).json({
        status: 'success',
        message: 'Content updated successfully',
        data: updatedContent
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating content:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update content',
        error: error.message
      });
    }
  },

  /**
   * Delete a content entry
   */
  delete: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      
      // Find content
      const content = await Content.findByPk(id);
      
      if (!content) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Content not found'
        });
      }
      
      // Delete field values
      await ContentFieldValue.destroy({
        where: { contentId: id },
        transaction
      });
      
      // Delete versions
      await ContentVersion.destroy({
        where: { contentId: id },
        transaction
      });
      
      // Delete content
      await content.destroy({ transaction });
      
      await transaction.commit();
      
      return res.status(200).json({
        status: 'success',
        message: 'Content deleted successfully'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error deleting content:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete content',
        error: error.message
      });
    }
  }
};

module.exports = contentController;