const express = require('express');
const router = express.Router();

const {
  register,
  login,
  refreshToken,
  logout,
  getCurrentUser
} = require('../controllers/auth.controller');

const {
  validate,
  registerValidation,
  loginValidation,
  refreshTokenValidation
} = require('../middlewares/validation.middleware');

const {
  authLimiter,
  createAccountLimiter
} = require('../middlewares/rate-limit.middleware');

const {
  verifyJWT
} = require('../middlewares/auth.middleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - username
 *         - password
 *       properties:
 *         id:
 *           type: integer
 *           description: Auto-generated ID of the user
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         username:
 *           type: string
 *           description: User's unique username
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         role:
 *           type: string
 *           description: User's role (user, editor, admin)
 *           enum: [user, editor, admin]
 *         isVerified:
 *           type: boolean
 *           description: Whether the user's email is verified
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the user's last login
 *       example:
 *         id: 1
 *         email: user@example.com
 *         username: johndoe
 *         firstName: John
 *         lastName: Doe
 *         role: user
 *         isVerified: true
 *         lastLogin: 2023-01-01T00:00:00.000Z
 *
 *     LoginCredentials:
 *       type: object
 *       required:
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         username:
 *           type: string
 *           description: User's username (alternative to email)
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *       example:
 *         email: user@example.com
 *         password: securePassword123
 *
 *     RegistrationInput:
 *       type: object
 *       required:
 *         - email
 *         - username
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         username:
 *           type: string
 *           description: User's desired username
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *       example:
 *         email: user@example.com
 *         username: johndoe
 *         password: securePassword123
 *         firstName: John
 *         lastName: Doe
 *
 *     RefreshTokenInput:
 *       type: object
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Refresh token to generate a new access token
 *       example:
 *         refreshToken: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: Unauthorized
 *
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account and receive authentication tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistrationInput'
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Validation error or email/username already exists
 *       429:
 *         description: Too many registration attempts
 *       500:
 *         description: Server error
 */
router.post(
  '/register',
  createAccountLimiter,
  validate(registerValidation),
  register
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to user account
 *     description: Login with email/username and password to receive authentication tokens
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                         expiresAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Bad request - Validation error
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account is not active
 *       429:
 *         description: Too many login attempts
 *       500:
 *         description: Server error
 */
router.post(
  '/login',
  authLimiter,
  validate(loginValidation),
  login
);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenInput'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Refresh token is required
 *       401:
 *         description: Invalid or expired refresh token
 *       500:
 *         description: Server error
 */
router.post(
  '/refresh-token',
  validate(refreshTokenValidation),
  refreshToken
);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Revoke the refresh token and clear cookies
 *     tags: [Authentication]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Refresh token to revoke (optional if sent in cookie)
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Logged out successfully
 *       500:
 *         description: Server error
 */
router.post('/logout', logout);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Server error
 */
router.get('/me', verifyJWT, getCurrentUser);

module.exports = router;