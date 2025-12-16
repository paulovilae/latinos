const { verifyToken } = require('../utils/jwt.utils');
const { User } = require('../models');

/**
 * Middleware to verify JWT access token
 * Extracts token from Authorization header or cookies
 */
const verifyJWT = async (req, res, next) => {
  try {
    // Get token from header or cookies
    let token;
    
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // If no token in header, check cookies
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    
    // If no token found, return error
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access denied. No token provided.'
      });
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Check if token type is access token
    if (decoded.type !== 'access') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token type'
      });
    }
    
    // Get user from database
    const user = await User.findByPk(decoded.sub);
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }
    
    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        status: 'error',
        message: 'Account is not active'
      });
    }
    
    // Attach user to request object
    req.user = user;
    
    // Continue
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid token: ' + error.message
    });
  }
};

/**
 * Middleware to check if user has admin role
 * Must be used after verifyJWT middleware
 */
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({
    status: 'error',
    message: 'Access denied. Admin role required.'
  });
};

/**
 * Optional JWT verification
 * Attaches user to request if token is valid, but doesn't require it
 */
const optionalJWT = async (req, res, next) => {
  try {
    // Get token from header or cookies
    let token;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }
    
    // If no token, just continue
    if (!token) {
      return next();
    }
    
    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await User.findByPk(decoded.sub);
    
    if (user && user.status === 'active') {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Even if token is invalid, just continue without user
    next();
  }
};

module.exports = {
  verifyJWT,
  authenticateJWT: verifyJWT, // Add alias for compatibility
  isAdmin,
  optionalJWT
};