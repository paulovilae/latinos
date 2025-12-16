const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { RefreshToken, User } = require('../models');
const config = require('../config/config');

/**
 * Generate access token for user
 * @param {object} user User object
 * @returns {string} JWT token
 */
const generateAccessToken = (user) => {
  const payload = {
    sub: user.id,
    email: user.email,
    username: user.username,
    role: user.role,
    type: 'access'
  };

  return jwt.sign(
    payload,
    config.jwt.secret,
    { expiresIn: config.jwt.accessExpiration }
  );
};

/**
 * Generate refresh token for user
 * @param {object} user User object
 * @param {string} userAgent User agent
 * @param {string} ipAddress IP address
 * @returns {object} Refresh token object and token string
 */
const generateRefreshToken = async (user, userAgent, ipAddress) => {
  // Create a unique token string
  const tokenString = uuidv4();

  // Calculate expiration date
  const expiresIn = config.jwt.refreshExpiration;
  const expiresInMs = ms(expiresIn);
  const expiresAt = new Date(Date.now() + expiresInMs);

  // Create refresh token in database
  const refreshToken = await RefreshToken.create({
    token: tokenString,
    userId: user.id,
    expiresAt,
    userAgent,
    ipAddress
  });

  return {
    token: tokenString,
    expiresAt,
    refreshToken
  };
};

/**
 * Verify JWT token
 * @param {string} token JWT token
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

/**
 * Generate tokens for user (both access and refresh)
 * @param {object} user User object
 * @param {string} userAgent User agent
 * @param {string} ipAddress IP address
 * @returns {object} Access and refresh tokens
 */
const generateTokens = async (user, userAgent, ipAddress) => {
  const accessToken = generateAccessToken(user);
  const refreshTokenData = await generateRefreshToken(user, userAgent, ipAddress);

  return {
    accessToken,
    refreshToken: refreshTokenData.token,
    expiresAt: refreshTokenData.expiresAt
  };
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken Refresh token
 * @returns {object} New access token and refresh token info
 * @throws {Error} If refresh token is invalid or expired
 */
const refreshAccessToken = async (refreshToken) => {
  // Find the refresh token in the database
  const foundToken = await RefreshToken.findOne({
    where: { token: refreshToken, isRevoked: false },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'email', 'username', 'role']
    }]
  });

  // Check if token exists and is valid
  if (!foundToken) {
    throw new Error('Invalid refresh token');
  }

  // Check if token is expired
  if (foundToken.isExpired()) {
    // Revoke the token
    await foundToken.update({ isRevoked: true });
    throw new Error('Refresh token expired');
  }

  // Generate new access token
  const user = foundToken.user;
  const accessToken = generateAccessToken(user);

  return {
    accessToken,
    refreshToken: foundToken.token,
    expiresAt: foundToken.expiresAt
  };
};

/**
 * Revoke refresh token
 * @param {string} refreshToken Refresh token
 * @returns {boolean} True if revoked successfully
 */
const revokeRefreshToken = async (refreshToken) => {
  const result = await RefreshToken.update(
    { isRevoked: true },
    { where: { token: refreshToken } }
  );
  
  return result[0] > 0;
};

/**
 * Helper function to parse ms from string like '7d', '24h', etc.
 * @param {string} str Time string
 * @returns {number} Milliseconds
 */
function ms(str) {
  const match = /^(\d+)([smhdw])$/.exec(str);
  if (!match) return 0;

  const num = parseInt(match[1], 10);
  const type = match[2];

  switch (type) {
    case 's': return num * 1000; // seconds
    case 'm': return num * 60 * 1000; // minutes
    case 'h': return num * 60 * 60 * 1000; // hours
    case 'd': return num * 24 * 60 * 60 * 1000; // days
    case 'w': return num * 7 * 24 * 60 * 60 * 1000; // weeks
    default: return 0;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  generateTokens,
  refreshAccessToken,
  revokeRefreshToken
};