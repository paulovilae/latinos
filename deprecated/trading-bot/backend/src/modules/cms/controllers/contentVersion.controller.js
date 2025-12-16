const { 
  Content, 
  ContentVersion, 
  ContentField,
  ContentFieldValue 
} = require('../models');
const { sequelize } = require('../../../models');

/**
 * Content Version Controller
 * Handles operations related to content versioning
 */
const contentVersionController = {
  /**
   * Get all versions of a content
   */
  getAllVersions: async (req, res) => {
    try {
      const { contentId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;
      
      // Verify content exists
      const content = await Content.findByPk(contentId);
      if (!content) {
        return res.status(404).json({
          status: 'error',
          message: 'Content not found'
        });
      }
      
      // Get versions
      const { count, rows: versions } = await ContentVersion.findAndCountAll({
        where: { contentId },
        include: [
          {
            association: 'createdBy',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }
        ],
        order: [['versionNumber', 'DESC']],
        limit: parseInt(limit),
        offset
      });
      
      return res.status(200).json({
        status: 'success',
        data: {
          content: {
            id: content.id,
            title: content.title,
            slug: content.slug,
            status: content.status
          },
          versions,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error getting content versions:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve content versions',
        error: error.message
      });
    }
  },
  
  /**
   * Get a specific version of content
   */
  getVersion: async (req, res) => {
    try {
      const { contentId, versionNumber } = req.params;
      
      // Get the specific version
      const version = await ContentVersion.findOne({
        where: { 
          contentId,
          versionNumber: parseInt(versionNumber)
        },
        include: [
          {
            association: 'content',
            include: [
              {
                association: 'contentType'
              }
            ]
          },
          {
            association: 'createdBy',
            attributes: ['id', 'username', 'firstName', 'lastName']
          }
        ]
      });
      
      if (!version) {
        return res.status(404).json({
          status: 'error',
          message: 'Content version not found'
        });
      }
      
      return res.status(200).json({
        status: 'success',
        data: version
      });
    } catch (error) {
      console.error('Error getting content version:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to retrieve content version',
        error: error.message
      });
    }
  },
  
  /**
   * Publish a specific version
   */
  publishVersion: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { contentId, versionNumber } = req.params;
      
      // Get the content and version
      const content = await Content.findByPk(contentId, { transaction });
      
      if (!content) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Content not found'
        });
      }
      
      const version = await ContentVersion.findOne({
        where: { 
          contentId,
          versionNumber: parseInt(versionNumber)
        },
        transaction
      });
      
      if (!version) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Content version not found'
        });
      }
      
      // Update the content status and publish date
      await content.update({
        status: 'published',
        publishedAt: new Date(),
        title: version.title,
        updatedById: req.user.id
      }, { transaction });
      
      // Create a new version to record the publish action
      const newVersionNumber = await ContentVersion.max('versionNumber', {
        where: { contentId }
      }) + 1;
      
      await ContentVersion.create({
        contentId,
        versionNumber: newVersionNumber,
        title: version.title,
        status: 'published',
        data: version.data,
        createdById: req.user.id,
        notes: `Published version ${versionNumber} by ${req.user.username}`
      }, { transaction });
      
      await transaction.commit();
      
      return res.status(200).json({
        status: 'success',
        message: `Version ${versionNumber} published successfully`,
        data: {
          contentId,
          versionNumber: newVersionNumber,
          publishedAt: content.publishedAt
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error publishing content version:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to publish content version',
        error: error.message
      });
    }
  },
  
  /**
   * Restore to a previous version
   */
  restoreVersion: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { contentId, versionNumber } = req.params;
      
      // Get the content and version
      const content = await Content.findByPk(contentId, {
        include: [
          {
            association: 'contentType',
            include: [
              {
                association: 'fields'
              }
            ]
          }
        ],
        transaction
      });
      
      if (!content) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Content not found'
        });
      }
      
      const version = await ContentVersion.findOne({
        where: { 
          contentId,
          versionNumber: parseInt(versionNumber)
        },
        transaction
      });
      
      if (!version) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Content version not found'
        });
      }
      
      // Update content with version data
      await content.update({
        title: version.title,
        updatedById: req.user.id
      }, { transaction });
      
      // Get existing field values
      const existingFieldValues = await ContentFieldValue.findAll({
        where: { contentId },
        transaction
      });
      
      // Create a map of existing field values for easy lookup
      const fieldValueMap = existingFieldValues.reduce((map, value) => {
        map[value.fieldId] = value;
        return map;
      }, {});
      
      // Process field values from version data
      if (version.data && typeof version.data === 'object') {
        await Promise.all(
          content.contentType.fields.map(async field => {
            const fieldKey = field.key;
            const fieldValue = version.data[fieldKey];
            
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
            if (fieldValueMap[field.id]) {
              await fieldValueMap[field.id].update(valueObj, { transaction });
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
      
      // Create a new version to record the restore action
      const newVersionNumber = await ContentVersion.max('versionNumber', {
        where: { contentId }
      }) + 1;
      
      await ContentVersion.create({
        contentId,
        versionNumber: newVersionNumber,
        title: version.title,
        status: content.status,
        data: version.data,
        createdById: req.user.id,
        notes: `Restored to version ${versionNumber} by ${req.user.username}`
      }, { transaction });
      
      await transaction.commit();
      
      return res.status(200).json({
        status: 'success',
        message: `Content restored to version ${versionNumber} successfully`,
        data: {
          contentId,
          versionNumber: newVersionNumber
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error restoring content version:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to restore content version',
        error: error.message
      });
    }
  }
};

module.exports = contentVersionController;