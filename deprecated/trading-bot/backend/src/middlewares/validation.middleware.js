const { body, validationResult } = require('express-validator');

/**
 * Function to validate request data using express-validator
 * @param {Array} validations Array of validation rules
 * @returns {Function} Middleware function
 */
/**
 * Middleware function to validate request data
 * Supports both express-validator and Joi validation schemas
 * @param {Array|Object} validations - Express-validator rules array or Joi schema object
 * @returns {Function} Middleware function
 */
const validate = (validations) => {
  return async (req, res, next) => {
    // Handle Joi validation schemas
    if (validations && typeof validations === 'object' && !Array.isArray(validations)) {
      try {
        // Check if we have params schema
        if (validations.params) {
          const { error } = validations.params.validate(req.params);
          if (error) {
            return res.status(400).json({
              status: 'error',
              message: 'Validation failed',
              errors: [{
                field: error.details[0].path.join('.'),
                message: error.details[0].message
              }]
            });
          }
        }
        
        // Check if we have body schema
        if (validations.body) {
          const { error } = validations.body.validate(req.body);
          if (error) {
            return res.status(400).json({
              status: 'error',
              message: 'Validation failed',
              errors: [{
                field: error.details[0].path.join('.'),
                message: error.details[0].message
              }]
            });
          }
        }
        
        // Check if we have query schema
        if (validations.query) {
          const { error } = validations.query.validate(req.query);
          if (error) {
            return res.status(400).json({
              status: 'error',
              message: 'Validation failed',
              errors: [{
                field: error.details[0].path.join('.'),
                message: error.details[0].message
              }]
            });
          }
        }

        return next();
      } catch (err) {
        console.error('Validation error:', err);
        return res.status(500).json({
          status: 'error',
          message: 'Validation error',
          errors: [{ field: 'unknown', message: err.message }]
        });
      }
    }
    
    // Handle express-validator validations (original behavior)
    try {
      // Execute validations
      await Promise.all(validations.map(validation => validation.run(req)));

      // Check for validation errors
      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      // Format errors and return response
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.param,
          message: err.msg
        }))
      });
    } catch (err) {
      console.error('Express validation error:', err);
      return res.status(500).json({
        status: 'error',
        message: 'Validation error',
        errors: [{ field: 'unknown', message: err.message }]
      });
    }
  };
};

/**
 * Validation rules for user registration
 */
const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .trim(),
    
  body('username')
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers and underscores')
    .trim(),
    
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
    
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .trim(),
    
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .trim()
];

/**
 * Validation rules for user login
 */
const loginValidation = [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .trim(),
    
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .trim(),
    
  body()
    .custom(body => {
      if (!body.email && !body.username) {
        throw new Error('Either email or username is required');
      }
      return true;
    }),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for refreshing token
 */
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required')
];

/**
 * Validation rules for password reset request
 */
const requestPasswordResetValidation = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail()
    .trim()
];

/**
 * Validation rules for password reset
 */
const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
    
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter'),
    
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  refreshTokenValidation,
  requestPasswordResetValidation,
  resetPasswordValidation
};