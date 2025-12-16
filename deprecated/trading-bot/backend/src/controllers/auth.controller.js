const { User, RefreshToken } = require('../models');
const { generateTokens, refreshAccessToken, revokeRefreshToken } = require('../utils/jwt.utils');

/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    // Check if email already exists
    const existingEmail = await User.findOne({ where: { email: req.body.email } });
    if (existingEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already in use'
      });
    }

    // Check if username already exists
    const existingUsername = await User.findOne({ where: { username: req.body.username } });
    if (existingUsername) {
      return res.status(400).json({
        status: 'error',
        message: 'Username already taken'
      });
    }

    // Create new user
    const user = await User.create({
      email: req.body.email,
      username: req.body.username,
      password: req.body.password, // Password will be hashed by model hook
      firstName: req.body.firstName,
      lastName: req.body.lastName
    });

    // Generate tokens
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip;
    const tokens = await generateTokens(user, userAgent, ipAddress);

    // Set cookies for tokens
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh-token',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data and tokens
    return res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt
        }
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to register user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Login user
 * @route POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    // Check if user exists by email or username
    const query = {};
    if (req.body.email) {
      query.email = req.body.email;
    } else if (req.body.username) {
      query.username = req.body.username;
    }

    const user = await User.findOne({ where: query });
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.status !== 'active') {
      return res.status(403).json({
        status: 'error',
        message: 'Account is not active'
      });
    }

    // Validate password
    const isPasswordValid = await user.validatePassword(req.body.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await user.update({ lastLogin: new Date() });

    // Generate tokens
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip;
    const tokens = await generateTokens(user, userAgent, ipAddress);

    // Set cookies for tokens
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh-token',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Return user data and tokens
    return res.status(200).json({
      status: 'success',
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          expiresAt: tokens.expiresAt
        }
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to login',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 */
const refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookies or request body
    const refreshTokenStr = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshTokenStr) {
      return res.status(400).json({
        status: 'error',
        message: 'Refresh token is required'
      });
    }

    // Refresh access token
    const tokens = await refreshAccessToken(refreshTokenStr);

    // Set new access token cookie
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    // Return new access token
    return res.status(200).json({
      status: 'success',
      message: 'Token refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
        expiresAt: tokens.expiresAt
      }
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Clear cookies on error
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    return res.status(401).json({
      status: 'error',
      message: error.message || 'Failed to refresh token'
    });
  }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // Get refresh token from cookies or request body
    const refreshTokenStr = req.cookies.refreshToken || req.body.refreshToken;
    
    if (refreshTokenStr) {
      // Revoke refresh token
      await revokeRefreshToken(refreshTokenStr);
    }

    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to logout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    
    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser
};