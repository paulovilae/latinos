# Backend Server - User Guide

This guide provides information on how to use and extend the backend server for the AI Trading Bot Platform.

## Getting Started

### Prerequisites

Before using the backend server, ensure you have:

1. Node.js v16+ installed
2. PostgreSQL database server
3. Redis server (optional, for caching)
4. Access to the bot microservice (if using bot integration features)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Configure environment variables:
   ```
   # Create a .env file with the following variables
   NODE_ENV=development
   PORT=5000
   API_URL=http://localhost:5000
   
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=trading_platform
   DB_USER=postgres
   DB_PASSWORD=your_password
   
   # JWT
   JWT_ACCESS_SECRET=your_access_secret
   JWT_REFRESH_SECRET=your_refresh_secret
   JWT_ACCESS_EXPIRATION=15m
   JWT_REFRESH_EXPIRATION=7d
   
   # Redis (optional)
   USE_REDIS=false
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   
   # Bot Microservice
   BOT_MICROSERVICE_URL=http://localhost:8000
   
   # Media Storage
   MEDIA_STORAGE_PROVIDER=local
   ```

4. Run database migrations:
   ```bash
   npm run db:migrate
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

## Authentication

### Registering a User

To register a new user, send a POST request to `/api/auth/register`:

```bash
curl -X POST "http://localhost:5000/api/auth/register" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "username": "exampleuser",
       "password": "SecurePassword123!",
       "firstName": "John",
       "lastName": "Doe"
     }'
```

### Logging In

To log in and receive authentication tokens, send a POST request to `/api/auth/login`:

```bash
curl -X POST "http://localhost:5000/api/auth/login" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "password": "SecurePassword123!"
     }'
```

The response will include:
- `accessToken`: Short-lived token for API access
- `refreshToken`: Longer-lived token for refreshing the access token
- `user`: User information

### Using Authentication Tokens

Include the access token in the `Authorization` header for protected routes:

```bash
curl -X GET "http://localhost:5000/api/auth/me" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Refreshing Tokens

When the access token expires, use the refresh token to get a new one:

```bash
curl -X POST "http://localhost:5000/api/auth/refresh-token" \
     -H "Content-Type: application/json" \
     -d '{
       "refreshToken": "YOUR_REFRESH_TOKEN"
     }'
```

### Logging Out

To log out and invalidate tokens:

```bash
curl -X POST "http://localhost:5000/api/auth/logout" \
     -H "Content-Type: application/json" \
     -d '{
       "refreshToken": "YOUR_REFRESH_TOKEN"
     }'
```

## Content Management System (CMS)

### Content Types

Content types define the structure for different kinds of content in your system.

#### Creating a Content Type

```bash
curl -X POST "http://localhost:5000/api/cms/content-types" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Blog Post",
       "slug": "blog-post",
       "description": "Blog posts for the website",
       "isListable": true,
       "defaultStatus": "draft",
       "fields": [
         {
           "name": "Title",
           "key": "title",
           "type": "text",
           "required": true,
           "displayOrder": 1
         },
         {
           "name": "Content",
           "key": "content",
           "type": "richtext",
           "required": true,
           "displayOrder": 2
         },
         {
           "name": "Featured Image",
           "key": "featuredImage",
           "type": "media",
           "required": false,
           "displayOrder": 3
         },
         {
           "name": "Published",
           "key": "isPublished",
           "type": "boolean",
           "required": false,
           "displayOrder": 4
         }
       ]
     }'
```

#### Listing Content Types

```bash
curl -X GET "http://localhost:5000/api/cms/content-types" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Content Management

#### Creating Content

```bash
curl -X POST "http://localhost:5000/api/cms/content" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "contentTypeId": "content_type_uuid",
       "title": "My First Blog Post",
       "slug": "my-first-blog-post",
       "status": "draft",
       "fields": {
         "title": "My First Blog Post",
         "content": "<p>This is the content of my first blog post.</p>",
         "isPublished": false
       }
     }'
```

#### Updating Content

```bash
curl -X PUT "http://localhost:5000/api/cms/content/content_uuid" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Updated Blog Post Title",
       "fields": {
         "title": "Updated Blog Post Title",
         "content": "<p>This is the updated content.</p>",
         "isPublished": true
       },
       "status": "published"
     }'
```

#### Listing Content

```bash
curl -X GET "http://localhost:5000/api/cms/content?contentTypeSlug=blog-post&page=1&limit=10" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Version History

To view version history for a content item:

```bash
curl -X GET "http://localhost:5000/api/cms/content/content_uuid/versions" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

To restore a previous version:

```bash
curl -X POST "http://localhost:5000/api/cms/content/content_uuid/versions/1/restore" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Media Management

#### Uploading Media

Use a multipart form request:

```bash
curl -X POST "http://localhost:5000/api/cms/media" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -F "file=@/path/to/image.jpg" \
     -F "alt=Image description"
```

#### Listing Media

```bash
curl -X GET "http://localhost:5000/api/cms/media?page=1&limit=20" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Deleting Media

```bash
curl -X DELETE "http://localhost:5000/api/cms/media/media_uuid" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Bot Integration

### Formula Management

#### Creating a Trading Formula

```bash
curl -X POST "http://localhost:5000/api/bot/formulas" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "RSI Strategy",
       "symbol": "AAPL",
       "exchange": "NASDAQ",
       "interval": "1h",
       "parameters": {
         "rsi_period": 14,
         "oversold_threshold": 30,
         "overbought_threshold": 70
       },
       "is_active": true
     }'
```

#### Listing Formulas

```bash
curl -X GET "http://localhost:5000/api/bot/formulas" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Updating a Formula

```bash
curl -X PUT "http://localhost:5000/api/bot/formulas/formula_uuid" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "parameters": {
         "rsi_period": 10,
         "oversold_threshold": 25,
         "overbought_threshold": 75
       },
       "is_active": false
     }'
```

### Trade Management

#### Viewing Trade History

```bash
curl -X GET "http://localhost:5000/api/bot/trades?symbol=AAPL&page=1&limit=20" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Viewing Current Trades

```bash
curl -X GET "http://localhost:5000/api/bot/trades/current" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Viewing Performance Metrics

```bash
curl -X GET "http://localhost:5000/api/bot/trades/performance" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### System Control

#### Starting the Trading System

```bash
curl -X POST "http://localhost:5000/api/bot/system/start" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Stopping the Trading System

```bash
curl -X POST "http://localhost:5000/api/bot/system/stop" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Checking System Status

```bash
curl -X GET "http://localhost:5000/api/bot/system/status" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Role-Based Access Control

### User Roles

The system includes several built-in roles:

- **Admin**: Full access to all features
- **Editor**: Can create and edit content, but not manage users or system settings
- **Author**: Can create content, but only edit their own
- **Subscriber**: Basic access with read-only permissions

### Managing Roles

#### Listing Roles

```bash
curl -X GET "http://localhost:5000/api/cms/roles" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### Creating a Role

```bash
curl -X POST "http://localhost:5000/api/cms/roles" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Marketing",
       "slug": "marketing",
       "description": "Marketing team members",
       "permissions": ["content:read", "content:create", "content:update", "media:read", "media:create"]
     }'
```

#### Assigning Role to User

```bash
curl -X PUT "http://localhost:5000/api/users/user_uuid" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "roleId": "role_uuid"
     }'
```

## Extending the Backend

### Adding a New Route

1. Create a new controller file in `src/controllers` or the appropriate module directory
2. Implement the necessary controller methods
3. Create a route file in `src/routes` or the appropriate module directory
4. Register the route in the main routes index file

Example controller:

```javascript
// src/controllers/example.controller.js
const exampleController = {
  getAll: async (req, res) => {
    try {
      // Implementation
      res.json({
        success: true,
        data: []
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },
  
  getById: async (req, res) => {
    try {
      const { id } = req.params;
      // Implementation
      res.json({
        success: true,
        data: { id }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};

module.exports = exampleController;
```

Example route:

```javascript
// src/routes/example.routes.js
const express = require('express');
const router = express.Router();
const exampleController = require('../controllers/example.controller');
const { authenticateJWT } = require('../middlewares/auth.middleware');

router.get('/', authenticateJWT, exampleController.getAll);
router.get('/:id', authenticateJWT, exampleController.getById);

module.exports = router;
```

Register in main routes:

```javascript
// src/routes/index.js
const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const exampleRoutes = require('./example.routes');

router.use('/auth', authRoutes);
router.use('/examples', exampleRoutes);

module.exports = router;
```

### Adding a New Model

1. Create a new model file in `src/models` or the appropriate module directory
2. Create a migration file for the database schema
3. Run the migration to update the database

Example model:

```javascript
// src/models/example.model.js
module.exports = (sequelize, DataTypes) => {
  const Example = sequelize.define('Example', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'pending'),
      defaultValue: 'pending'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'examples'
  });

  Example.associate = (models) => {
    // Define associations here
  };

  return Example;
};
```

Example migration:

```javascript
// src/migrations/YYYYMMDDHHMMSS-create-examples-table.js
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('examples', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'pending'),
        defaultValue: 'pending'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('examples');
  }
};
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Ensure database exists

2. **JWT Token Issues**
   - Check JWT secret keys in `.env`
   - Verify token expiration settings
   - Ensure client is sending the token correctly

3. **Permission Denied**
   - Verify user has the correct role assigned
   - Check that the role has the necessary permissions
   - Confirm middleware is checking permissions correctly

4. **Bot Microservice Connection**
   - Ensure bot microservice is running
   - Check the URL configuration
   - Verify network connectivity between services

### Logs

The backend generates several log files that can help with troubleshooting:

- `logs/access.log`: HTTP request logs
- `logs/error.log`: General error logs
- `logs/bot-microservice.log`: Bot integration logs
- `logs/bot-error.log`: Bot-specific error logs

### Health Check

You can verify the backend server health using:

```bash
curl -X GET "http://localhost:5000/health"
```

## API Documentation

When the server is running, you can access interactive API documentation at:

```
http://localhost:5000/api-docs
```

This provides a complete reference of all available endpoints, request parameters, and response formats.

## Additional Resources

- See [TECHNICAL.md](TECHNICAL.md) for detailed technical documentation
- See [AUTH-TESTING.md](AUTH-TESTING.md) for authentication testing guidelines
- See [media-storage.md](media-storage.md) for media storage details