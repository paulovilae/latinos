# Backend Technical Documentation

This document provides detailed technical information about the Node.js/Express backend implementation for the AI Trading Bot Platform.

## Architecture Overview

The backend follows a modular architecture with clear separation of concerns:

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│                 │     │                  │     │                   │
│  API Layer      │────►│  Service Layer   │────►│  Data Access Layer│
│  (Controllers)  │◄────│  (Business Logic)│◄────│  (Models)         │
│                 │     │                  │     │                   │
└─────────────────┘     └──────────────────┘     └───────────────────┘
        │                         │                         │
        │                         │                         │
        ▼                         ▼                         ▼
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│                 │     │                  │     │                   │
│  Middleware     │     │  Utility Services│     │  Database         │
│  (Auth, Rate)   │     │  (JWT, Storage)  │     │  (PostgreSQL)     │
│                 │     │                  │     │                   │
└─────────────────┘     └──────────────────┘     └───────────────────┘
```

### Core Architectural Principles

1. **Modularity**: Features are organized into self-contained modules
2. **Layered Design**: Clear separation between controllers, services, and data access
3. **Middleware-Based Processing**: HTTP request pipeline with specialized middleware
4. **ORM Abstraction**: Sequelize ORM for database operations
5. **Service Abstraction**: Business logic encapsulated in service modules
6. **API Gateway Pattern**: For bot microservice integration

## Implementation Details

### Express Application Setup

The main server setup in `server.js`:

```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const routes = require('./routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Error handling middleware
app.use(errorHandler);

module.exports = app;
```

### Database Connection

Database connection management with Sequelize:

```javascript
// src/config/database.js
const { Sequelize } = require('sequelize');
const config = require('./config');

const sequelize = new Sequelize(
  config.database.name,
  config.database.username,
  config.database.password,
  {
    host: config.database.host,
    dialect: 'postgres',
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: config.environment === 'development' ? console.log : false
  }
);

module.exports = sequelize;
```

### Authentication Implementation

#### JWT Token Generation and Verification

```javascript
// src/utils/jwt.utils.js
const jwt = require('jsonwebtoken');

const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION }
  );
};

const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (error) {
    return null;
  }
};

const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
```

#### Authentication Middleware

```javascript
// src/middlewares/auth.middleware.js
const { verifyAccessToken } = require('../utils/jwt.utils');
const { User } = require('../models');

const authenticateJWT = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. No token provided.'
    });
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);
  
  if (!decoded) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token.'
    });
  }
  
  try {
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found.'
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal server error.'
    });
  }
};

module.exports = {
  authenticateJWT
};
```

### CMS Implementation

#### Content Type Model

```javascript
// src/modules/cms/models/contentType.model.js
module.exports = (sequelize, DataTypes) => {
  const ContentType = sequelize.define('ContentType', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT
    },
    isListable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    defaultStatus: {
      type: DataTypes.STRING,
      defaultValue: 'draft'
    }
  }, {
    timestamps: true,
    tableName: 'cms_content_types'
  });

  ContentType.associate = (models) => {
    ContentType.hasMany(models.Content, {
      foreignKey: 'contentTypeId',
      as: 'contents'
    });
    
    ContentType.hasMany(models.ContentField, {
      foreignKey: 'contentTypeId',
      as: 'fields'
    });
  };

  return ContentType;
};
```

#### Media Storage Service

```javascript
// src/modules/cms/services/mediaStorage.service.js
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;
const mediaConfig = require('../config/media.config');

class MediaStorageService {
  constructor() {
    this.provider = mediaConfig.provider;
    
    if (this.provider === 'cloudinary') {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
      });
    }
  }
  
  async saveFile(file, options = {}) {
    if (this.provider === 'local') {
      return this.saveToLocalStorage(file, options);
    } else if (this.provider === 'cloudinary') {
      return this.saveToCloudinary(file, options);
    }
    
    throw new Error(`Unsupported storage provider: ${this.provider}`);
  }
  
  async saveToLocalStorage(file, options) {
    const { filename, buffer, mimetype } = file;
    const ext = path.extname(filename);
    const uniqueFilename = `${uuidv4()}${ext}`;
    const relativePath = `uploads/${uniqueFilename}`;
    const fullPath = path.join(process.cwd(), relativePath);
    
    // Ensure directory exists
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Process image if it's an image file
    if (mimetype.startsWith('image/')) {
      const imageBuffer = await this.processImage(buffer, options);
      await fs.promises.writeFile(fullPath, imageBuffer);
    } else {
      await fs.promises.writeFile(fullPath, buffer);
    }
    
    return {
      filename: uniqueFilename,
      originalFilename: filename,
      path: relativePath,
      url: `${process.env.API_URL}/${relativePath}`,
      size: buffer.length,
      mimetype
    };
  }
  
  async saveToCloudinary(file, options) {
    const { filename, buffer, mimetype } = file;
    
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'media',
          resource_type: 'auto',
          ...options
        },
        (error, result) => {
          if (error) return reject(error);
          
          resolve({
            filename: result.public_id,
            originalFilename: filename,
            path: result.public_id,
            url: result.secure_url,
            size: result.bytes,
            mimetype,
            metadata: {
              width: result.width,
              height: result.height,
              format: result.format
            }
          });
        }
      );
      
      uploadStream.end(buffer);
    });
  }
  
  async processImage(buffer, options) {
    const { width, height, quality = 80 } = options;
    let imageProcessor = sharp(buffer);
    
    if (width || height) {
      imageProcessor = imageProcessor.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    return imageProcessor.jpeg({ quality }).toBuffer();
  }
  
  async deleteFile(fileData) {
    if (this.provider === 'local') {
      const fullPath = path.join(process.cwd(), fileData.path);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } else if (this.provider === 'cloudinary') {
      await cloudinary.uploader.destroy(fileData.filename);
    }
  }
}

module.exports = new MediaStorageService();
```

### Bot Integration Implementation

#### Bot Microservice Service

```javascript
// src/modules/bot/services/botMicroservice.service.js
const axios = require('axios');
const config = require('../../../config/config');
const Redis = require('ioredis');
const NodeCache = require('node-cache');

class BotMicroserviceService {
  constructor() {
    this.baseUrl = process.env.BOT_MICROSERVICE_URL || 'http://localhost:8000';
    this.maxRetries = parseInt(process.env.BOT_MICROSERVICE_MAX_RETRIES || '3', 10);
    this.retryDelay = parseInt(process.env.BOT_MICROSERVICE_RETRY_DELAY || '1000', 10);
    
    // Initialize cache
    this.useRedis = process.env.USE_REDIS === 'true';
    
    if (this.useRedis) {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.REDIS_DB || '0', 10)
      });
    } else {
      this.memoryCache = new NodeCache({
        stdTTL: parseInt(process.env.MEMORY_CACHE_TTL || '60', 10),
        checkperiod: 120
      });
    }
    
    // Configure axios instance
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
  
  async request(method, endpoint, data = null, options = {}) {
    const { skipCache = false, cacheTTL = 30 } = options;
    const cacheKey = `bot:${method}:${endpoint}:${JSON.stringify(data || {})}`;
    
    // Check cache if it's a GET request and cache shouldn't be skipped
    if (method === 'get' && !skipCache) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) return cached;
    }
    
    // Make the request with retries
    let retries = 0;
    let lastError;
    
    while (retries <= this.maxRetries) {
      try {
        const response = await this.client({
          method,
          url: endpoint,
          data: method !== 'get' ? data : undefined,
          params: method === 'get' ? data : undefined
        });
        
        // Cache successful GET responses
        if (method === 'get') {
          this.setInCache(cacheKey, response.data, cacheTTL);
        }
        
        return response.data;
      } catch (error) {
        lastError = error;
        retries++;
        
        if (retries <= this.maxRetries) {
          const delay = this.retryDelay * Math.pow(2, retries - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`Failed to ${method} ${endpoint} after ${this.maxRetries} retries: ${lastError.message}`);
  }
  
  async getFromCache(key) {
    try {
      if (this.useRedis) {
        const cached = await this.redis.get(key);
        return cached ? JSON.parse(cached) : null;
      } else {
        return this.memoryCache.get(key);
      }
    } catch (error) {
      console.error('Cache retrieval error:', error);
      return null;
    }
  }
  
  async setInCache(key, value, ttl) {
    try {
      if (this.useRedis) {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
      } else {
        this.memoryCache.set(key, value, ttl);
      }
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }
  
  // Formula endpoints
  async getFormulas(params) {
    return this.request('get', '/api/formulas', params);
  }
  
  async getFormula(id) {
    return this.request('get', `/api/formulas/${id}`);
  }
  
  async createFormula(data) {
    return this.request('post', '/api/formulas', data);
  }
  
  async updateFormula(id, data) {
    return this.request('put', `/api/formulas/${id}`, data);
  }
  
  async deleteFormula(id) {
    return this.request('delete', `/api/formulas/${id}`);
  }
  
  // Trade endpoints
  async getTrades(params) {
    return this.request('get', '/api/trades', params);
  }
  
  async getCurrentTrades() {
    return this.request('get', '/api/trades/current');
  }
  
  async getPerformance() {
    return this.request('get', '/api/trades/performance');
  }
  
  // System endpoints
  async startSystem() {
    return this.request('post', '/api/system/start');
  }
  
  async stopSystem() {
    return this.request('post', '/api/system/stop');
  }
  
  async getSystemStatus() {
    return this.request('get', '/api/system/status', null, { cacheTTL: 10 });
  }
}

module.exports = new BotMicroserviceService();
```

## Database Schema

### Authentication Tables

#### Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  username VARCHAR(255) UNIQUE,
  password VARCHAR(255) NOT NULL,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  roleId UUID,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (roleId) REFERENCES roles(id)
);
```

#### Refresh Tokens Table

```sql
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR(255) NOT NULL,
  userId UUID NOT NULL,
  expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

### CMS Tables

The CMS module uses a sophisticated data model with the following key tables:

#### Content Types Table

```sql
CREATE TABLE cms_content_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  isListable BOOLEAN DEFAULT true,
  defaultStatus VARCHAR(50) DEFAULT 'draft',
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Content Table

```sql
CREATE TABLE cms_contents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contentTypeId UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  publishedAt TIMESTAMP WITH TIME ZONE,
  createdById UUID,
  updatedById UUID,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contentTypeId) REFERENCES cms_content_types(id) ON DELETE CASCADE,
  FOREIGN KEY (createdById) REFERENCES users(id),
  FOREIGN KEY (updatedById) REFERENCES users(id),
  UNIQUE(contentTypeId, slug)
);
```

#### Content Fields Table

```sql
CREATE TABLE cms_content_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contentTypeId UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  key VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  required BOOLEAN DEFAULT false,
  displayOrder INTEGER DEFAULT 0,
  settings JSONB,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contentTypeId) REFERENCES cms_content_types(id) ON DELETE CASCADE,
  UNIQUE(contentTypeId, key)
);
```

#### Content Field Values Table

```sql
CREATE TABLE cms_content_field_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contentId UUID NOT NULL,
  fieldId UUID NOT NULL,
  textValue TEXT,
  numberValue DECIMAL,
  booleanValue BOOLEAN,
  dateValue TIMESTAMP WITH TIME ZONE,
  jsonValue JSONB,
  mediaId UUID,
  referenceId UUID,
  referenceType VARCHAR(50),
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contentId) REFERENCES cms_contents(id) ON DELETE CASCADE,
  FOREIGN KEY (fieldId) REFERENCES cms_content_fields(id) ON DELETE CASCADE,
  FOREIGN KEY (mediaId) REFERENCES cms_media_assets(id) ON DELETE SET NULL
);
```

#### Content Versions Table

```sql
CREATE TABLE cms_content_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contentId UUID NOT NULL,
  versionNumber INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  createdById UUID,
  notes TEXT,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contentId) REFERENCES cms_contents(id) ON DELETE CASCADE,
  FOREIGN KEY (createdById) REFERENCES users(id),
  UNIQUE(contentId, versionNumber)
);
```

#### Media Assets Table

```sql
CREATE TABLE cms_media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename VARCHAR(255) NOT NULL,
  originalFilename VARCHAR(255) NOT NULL,
  mimeType VARCHAR(100) NOT NULL,
  size INTEGER NOT NULL,
  path VARCHAR(255) NOT NULL,
  url VARCHAR(1024) NOT NULL,
  metadata JSONB,
  uploadedById UUID,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploadedById) REFERENCES users(id)
);
```

### Bot Integration Tables

#### Formula Table

```sql
CREATE TABLE bot_formulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(50) NOT NULL,
  exchange VARCHAR(50) DEFAULT 'AMEX',
  interval VARCHAR(10) NOT NULL,
  parameters JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### Trade Table

```sql
CREATE TABLE bot_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol VARCHAR(50) NOT NULL,
  side VARCHAR(10) NOT NULL,
  quantity DECIMAL NOT NULL,
  price DECIMAL NOT NULL,
  status VARCHAR(20) NOT NULL,
  stop_loss DECIMAL,
  take_profit DECIMAL,
  is_successful BOOLEAN,
  createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  filledAt TIMESTAMP WITH TIME ZONE
);
```

#### System Status Table

```sql
CREATE TABLE bot_system_status (
  id SERIAL PRIMARY KEY,
  status VARCHAR(20) NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE,
  active_formulas INTEGER DEFAULT 0,
  last_execution TIMESTAMP WITH TIME ZONE,
  next_execution TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

## Security Implementation

### Password Hashing

```javascript
// src/models/user.model.js
const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // ... other fields
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      set(value) {
        // Hash password before saving
        const hashedPassword = bcrypt.hashSync(value, 10);
        this.setDataValue('password', hashedPassword);
      }
    }
  });
  
  // Instance method to compare passwords
  User.prototype.comparePassword = function(password) {
    return bcrypt.compareSync(password, this.password);
  };
  
  return User;
};
```

### Rate Limiting

```javascript
// src/middlewares/rate-limit.middleware.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const Redis = require('ioredis');

// Create Redis client if Redis is available
let redisClient;
if (process.env.USE_REDIS === 'true') {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10)
  });
}

// Default rate limit settings
const defaultSettings = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.'
  }
};

// Create limiter with either Redis or memory store
const createLimiter = (settings = {}) => {
  const options = { ...defaultSettings, ...settings };
  
  if (redisClient) {
    options.store = new RedisStore({
      sendCommand: (...args) => redisClient.call(...args)
    });
  }
  
  return rateLimit(options);
};

// Auth-specific rate limiter (more strict)
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per 15 minutes
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.'
  }
});

module.exports = {
  defaultLimiter: createLimiter(),
  authLimiter
};
```

### Permission Middleware

```javascript
// src/middlewares/permission.middleware.js
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const { user } = req;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }
      
      // Load user with role and permissions
      const userWithPermissions = await User.findByPk(user.id, {
        include: [{
          model: Role,
          include: [{
            model: Permission,
            through: RolePermission
          }]
        }]
      });
      
      if (!userWithPermissions || !userWithPermissions.Role) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }
      
      // Check if user has the required permission
      const hasPermission = userWithPermissions.Role.Permissions.some(
        permission => permission.slug === requiredPermission
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions'
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  };
};

module.exports = {
  checkPermission
};
```

## Performance Optimizations

### Query Optimization

- Proper indexing for frequently queried fields
- Selective loading of relations with Sequelize `include`
- Pagination for large result sets
- Field selection to reduce data transfer

### Caching Strategies

- Redis-based caching for API responses
- In-memory fallback cache
- Cache invalidation on data mutations
- Varied TTL based on data volatility

### Connection Pooling

- Database connection pooling via Sequelize configuration
- Keep-alive settings for external HTTP connections
- Connection reuse for Redis client

## Error Handling

### Centralized Error Handler

```javascript
// src/middlewares/error.middleware.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  // Handle unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'Conflict error',
      details: err.errors.map(e => ({
        field: e.path,
        message: e.message
      }))
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
  
  // Handle general HTTP errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }
  
  // Default to 500 for unhandled errors
  return res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
};

module.exports = errorHandler;
```

## Testing Setup

### Unit Test Configuration

The backend uses Jest for unit testing:

```javascript
// Jest configuration
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/test/'
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  testMatch: ['**/?(*.)+(spec|test).js'],
  verbose: true
};
```

### Integration Test Example

```javascript
// src/controllers/auth.controller.test.js
const request = require('supertest');
const app = require('../server');
const { User, RefreshToken } = require('../models');
const { generateAccessToken } = require('../utils/jwt.utils');

describe('Auth Controller', () => {
  beforeEach(async () => {
    await User.destroy({ where: {} });
    await RefreshToken.destroy({ where: {} });
  });
  
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user).toHaveProperty('email', 'test@example.com');
      expect(response.body.data.user).not.toHaveProperty('password');
    });
    
    it('should return error for duplicate email', async () => {
      // First create a user
      await User.create({
        email: 'test@example.com',
        username: 'existinguser',
        password: 'Password123!'
      });
      
      // Try to register with the same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'Password123!'
        });
      
      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already exists');
    });
  });
  
  // Additional test cases for login, refresh token, etc.
});
```

## Deployment Considerations

### Environment Variables

The application relies on environment variables for configuration:

```
# Server
NODE_ENV=development
PORT=5000
API_URL=http://localhost:5000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=trading_platform
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_ACCESS_SECRET=access_secret_key
JWT_REFRESH_SECRET=refresh_secret_key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Redis
USE_REDIS=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Bot Microservice
BOT_MICROSERVICE_URL=http://localhost:8000
BOT_MICROSERVICE_MAX_RETRIES=3
BOT_MICROSERVICE_RETRY_DELAY=1000

# Media Storage
MEDIA_STORAGE_PROVIDER=local
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Production Hardening

For production deployment, additional security measures are implemented:

1. Helmet.js for secure HTTP headers
2. CORS restrictions to trusted origins
3. Rate limiting across all endpoints
4. Input validation and sanitization
5. Error message sanitization (no stack traces in production)
6. HTTPS enforcement
7. Secure cookie settings (HTTP-only, Secure, SameSite)