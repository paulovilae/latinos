# AI Trading Bot Platform - Backend Server

This is the comprehensive backend server for the AI Trading Bot Platform. It provides authentication, content management, and bot integration services using Express.js, PostgreSQL, and JWT.

## Core Modules

The backend consists of three main modules:

1. **Authentication System**: User registration, login, and token management
2. **CMS Backend**: Complete content management system with versioning and media handling
3. **Bot Integration**: API gateway to the Python trading bot microservice

## Features

### Authentication System
- User registration and login with secure password hashing
- JWT-based authentication with access and refresh tokens
- Token management (refresh, revocation, expiration)
- Role-based access control
- Rate limiting for security

### CMS Backend
- Content type management and configuration
- Content creation, editing, and versioning
- Media asset storage and management
- Role and permission management
- API endpoints for all CMS operations

### Bot Integration
- Formula configuration management
- Trading status and history retrieval
- Performance metrics calculation
- System control operations
- Caching and error handling

## Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Request handlers
│   │   └── auth.controller.js  # Authentication controllers
│   ├── middlewares/      # Express middlewares
│   │   ├── auth.middleware.js  # Token verification
│   │   ├── permission.middleware.js  # Permission checking
│   │   └── rate-limit.middleware.js  # Rate limiting
│   ├── migrations/       # Database migrations
│   ├── models/           # Sequelize models
│   │   ├── user.model.js  # User model
│   │   └── refreshToken.model.js  # Refresh token model
│   ├── modules/          # Feature modules
│   │   ├── bot/          # Bot microservice integration
│   │   │   ├── controllers/  # Bot API controllers
│   │   │   ├── models/       # Bot-related models
│   │   │   ├── routes/       # Bot API routes
│   │   │   ├── services/     # Bot service integrations
│   │   │   └── README.md     # Bot module documentation
│   │   └── cms/          # Content Management System
│   │       ├── config/       # CMS configuration
│   │       ├── controllers/  # CMS controllers
│   │       ├── models/       # CMS data models
│   │       ├── routes/       # CMS API routes
│   │       └── services/     # CMS services
│   ├── routes/           # API routes
│   │   ├── auth.routes.js  # Authentication routes
│   │   └── index.js        # Route aggregation
│   ├── utils/            # Utility functions
│   │   └── jwt.utils.js    # JWT token utilities
│   └── server.js         # Main application file
├── docs/               # Documentation
│   ├── AUTH-TESTING.md   # Authentication testing guide
│   └── media-storage.md  # Media storage documentation
├── logs/               # Application logs
│   ├── bot-error.log        # Bot-related error logs
│   ├── bot-microservice.log # Bot service logs
│   └── bot-performance.log  # Bot performance metrics
├── uploads/            # Media file uploads
├── .env                # Environment variables (not committed)
├── .sequelizerc        # Sequelize CLI configuration
└── package.json        # Project dependencies
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email/username and password
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/logout` - Logout and invalidate tokens
- `GET /api/auth/me` - Get current user profile (protected)

### CMS

- `GET /api/cms/content-types` - List all content types
- `POST /api/cms/content-types` - Create a new content type
- `GET /api/cms/content-types/:id` - Get a specific content type
- `PUT /api/cms/content-types/:id` - Update a content type
- `DELETE /api/cms/content-types/:id` - Delete a content type

- `GET /api/cms/content` - List content with pagination and filtering
- `POST /api/cms/content` - Create new content
- `GET /api/cms/content/:id` - Get specific content
- `PUT /api/cms/content/:id` - Update content
- `DELETE /api/cms/content/:id` - Delete content

- `GET /api/cms/content/:id/versions` - Get content version history
- `GET /api/cms/content/:id/versions/:versionNumber` - Get specific version
- `POST /api/cms/content/:id/versions/:versionNumber/restore` - Restore version

- `GET /api/cms/media` - List media assets
- `POST /api/cms/media` - Upload media
- `GET /api/cms/media/:id` - Get media details
- `DELETE /api/cms/media/:id` - Delete media

- `GET /api/cms/roles` - List all roles
- `POST /api/cms/roles` - Create a new role
- `GET /api/cms/permissions` - List all permissions

### Bot Integration

- `GET /api/bot/formulas` - List all formula configurations
- `POST /api/bot/formulas` - Create a new formula
- `GET /api/bot/formulas/:id` - Get a specific formula
- `PUT /api/bot/formulas/:id` - Update a formula
- `DELETE /api/bot/formulas/:id` - Delete a formula

- `GET /api/bot/trades` - Get trade history with filtering
- `GET /api/bot/trades/current` - Get currently active trades
- `GET /api/bot/trades/performance` - Get performance metrics

- `POST /api/bot/system/start` - Start the trading system
- `POST /api/bot/system/stop` - Stop the trading system
- `GET /api/bot/system/status` - Get system status

## Setup and Installation

1. Install dependencies:
   ```
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env` (if available)
   - Update database credentials, JWT secrets, and other configuration

3. Run database migrations:
   ```
   npm run db:migrate
   ```

4. Start the server:
   ```
   npm run dev
   ```

## Authentication Flow

1. **Registration**:
   - Client submits user registration data
   - Server validates data and creates user account
   - Server returns JWT access token and refresh token
   - Tokens are also set as HTTP-only cookies

2. **Login**:
   - Client submits email/username and password
   - Server verifies credentials and generates tokens
   - Tokens are returned and set as cookies

3. **Accessing Protected Routes**:
   - Client includes access token in Authorization header or uses cookie
   - Server validates token and grants access

4. **Token Refresh**:
   - When access token expires, client uses refresh token
   - Server verifies refresh token and issues new access token
   - Original refresh token remains valid until expiration

5. **Logout**:
   - Client sends logout request
   - Server invalidates refresh token
   - Cookies are cleared

## CMS Architecture

The Content Management System uses a sophisticated database schema:

1. **ContentType**: Defines the structure for different types of content
2. **Content**: Represents individual content entries
3. **ContentField**: Defines fields for content types
4. **ContentFieldValue**: Stores values for content fields
5. **ContentVersion**: Tracks history of content changes
6. **MediaAsset**: Manages uploaded media files
7. **Role**: Defines user roles for access control
8. **Permission**: Defines granular permissions

## Bot Integration Architecture

The Bot Integration module acts as an API gateway between the frontend and the Python bot microservice:

1. **API Controllers**: Handle HTTP requests and responses
2. **Services**: Communicate with the bot microservice and manage caching
3. **Models**: Store formula configurations, trades, and system status
4. **Error Handling**: Provide standardized error responses and retry logic

## Security Features

- Password hashing with bcrypt
- JWT with short-lived access tokens and longer-lived refresh tokens
- HTTP-only, secure cookies for token storage
- Rate limiting to prevent brute force attacks
- Input validation to prevent injection attacks
- Token verification middleware for protected routes
- Role-based access control for CMS operations

## Error Handling

The backend implements standardized error handling:

- Detailed error messages with appropriate HTTP status codes
- Consistent error response format
- Validation error details for form submissions
- Rate limit exceeded notifications
- Service unavailable handling for microservice integration

## Performance Optimization

- Redis caching for frequently accessed data
- Connection pooling for database operations
- Query optimization with proper indexes
- Middleware-based compression
- Efficient data transformation

## Documentation

- API documentation available at `/api-docs` when server is running
- Additional documentation in the `/docs` directory
- Module-specific documentation in respective README.md files

## Testing

Run tests for specific modules:

- Authentication: `npm run test:auth`
- CMS: `npm run test:cms`
- Bot Integration: `npm run test:bot`
- All tests: `npm run test:all`