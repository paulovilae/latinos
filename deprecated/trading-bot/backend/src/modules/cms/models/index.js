'use strict';

// This file exports all CMS models so they can be easily imported elsewhere
const { sequelize } = require('../../../models');

// Import core models
const db = require('../../../models');

// Import and initialize CMS models
const ContentType = require('./contentType.model')(sequelize);
const Content = require('./content.model')(sequelize);
const ContentVersion = require('./contentVersion.model')(sequelize);
const ContentField = require('./contentField.model')(sequelize);
const ContentFieldValue = require('./contentFieldValue.model')(sequelize);
const ContentStatus = require('./contentStatus.model')(sequelize);
const MediaAsset = require('./mediaAsset.model')(sequelize);

// Import and initialize RBAC models
const Role = require('./role.model')(sequelize);
const Permission = require('./permission.model')(sequelize);
const RolePermission = require('./rolePermission.model')(sequelize);

// Create a combined models object for associations
const cmsModels = {
  ContentType,
  Content,
  ContentVersion,
  ContentField,
  ContentFieldValue,
  ContentStatus,
  MediaAsset,
  Role,
  Permission,
  RolePermission,
  // Reference existing models but don't reinitialize them
  User: db.User,
  RefreshToken: db.RefreshToken
};

// Set up associations for CMS models only
[
  ContentType,
  Content,
  ContentVersion,
  ContentField,
  ContentFieldValue,
  ContentStatus,
  MediaAsset,
  Role,
  Permission,
  RolePermission
].forEach(model => {
  if (model && model.associate) {
    model.associate(cmsModels);
  }
});

// Export all CMS models
module.exports = {
  ContentType,
  Content,
  ContentVersion,
  ContentField,
  ContentFieldValue,
  ContentStatus,
  MediaAsset,
  Role,
  Permission,
  RolePermission
};