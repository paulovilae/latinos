const { Role, Permission } = require('../modules/cms/models');

/**
 * Middleware to check if user has the required permission
 * @param {string} requiredPermission - The permission slug required for the action
 * @returns {function} Express middleware function
 */
const hasPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      // Get user from request (set by verifyJWT middleware)
      const { user } = req;
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }
      
      // Admin role has all permissions (backwards compatibility)
      if (user.role === 'admin') {
        return next();
      }
      
      // Check if user has a roleId assigned
      if (!user.roleId) {
        return res.status(403).json({
          status: 'error',
          message: 'No role assigned to user'
        });
      }
      
      // Get user's role with permissions
      const role = await Role.findByPk(user.roleId, {
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['slug']
        }]
      });
      
      if (!role) {
        return res.status(403).json({
          status: 'error',
          message: 'Role not found'
        });
      }
      
      // Check if user's role has the required permission
      const hasRequiredPermission = role.permissions.some(
        permission => permission.slug === requiredPermission
      );
      
      if (hasRequiredPermission) {
        return next();
      }
      
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while checking permissions',
        error: error.message
      });
    }
  };
};

/**
 * Middleware to check if user has any of the required permissions
 * @param {string[]} requiredPermissions - Array of permission slugs, any of which grants access
 * @returns {function} Express middleware function
 */
const hasAnyPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // Get user from request (set by verifyJWT middleware)
      const { user } = req;
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }
      
      // Admin role has all permissions (backwards compatibility)
      if (user.role === 'admin') {
        return next();
      }
      
      // Check if user has a roleId assigned
      if (!user.roleId) {
        return res.status(403).json({
          status: 'error',
          message: 'No role assigned to user'
        });
      }
      
      // Get user's role with permissions
      const role = await Role.findByPk(user.roleId, {
        include: [{
          model: Permission,
          as: 'permissions',
          attributes: ['slug']
        }]
      });
      
      if (!role) {
        return res.status(403).json({
          status: 'error',
          message: 'Role not found'
        });
      }
      
      // Check if user's role has any of the required permissions
      const permissionSlugs = role.permissions.map(p => p.slug);
      const hasAnyRequiredPermission = requiredPermissions.some(
        permission => permissionSlugs.includes(permission)
      );
      
      if (hasAnyRequiredPermission) {
        return next();
      }
      
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    } catch (error) {
      console.error('Error checking permissions:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while checking permissions',
        error: error.message
      });
    }
  };
};

/**
 * Middleware to check if user can manage content (either they have permission or they created it)
 * @param {string} contentIdParam - Parameter name where content ID is stored (default: 'id')
 * @returns {function} Express middleware function
 */
const canManageContent = (contentIdParam = 'id') => {
  return async (req, res, next) => {
    try {
      const { user } = req;
      const contentId = req.params[contentIdParam];
      
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }
      
      // Admin role can manage all content (backwards compatibility)
      if (user.role === 'admin') {
        return next();
      }
      
      // Get the content to check if the user created it
      const { Content } = require('../modules/cms/models');
      const content = await Content.findByPk(contentId);
      
      if (!content) {
        return res.status(404).json({
          status: 'error',
          message: 'Content not found'
        });
      }
      
      // If user created the content, allow the action
      if (content.createdById === user.id) {
        // Check if they have permission to edit their own content
        return hasAnyPermission(['edit_own_content', 'edit_any_content'])(req, res, next);
      }
      
      // Otherwise, check if they have permission to edit any content
      return hasPermission('edit_any_content')(req, res, next);
    } catch (error) {
      console.error('Error checking content permissions:', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while checking permissions',
        error: error.message
      });
    }
  };
};

module.exports = {
  hasPermission,
  hasAnyPermission,
  canManageContent
};