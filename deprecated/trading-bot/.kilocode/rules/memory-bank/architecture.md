# System Architecture

## Overall Architecture

The AI Trading Bot Platform follows a three-tier architecture:

1. **Frontend Application**: React-based UI for user interaction
2. **Backend Services**: Node.js/Express.js APIs for authentication, data processing, and CMS (fully implemented)
3. **Bot Microservice**: Python-based service for trading algorithm execution

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│                 │     │                  │     │                   │
│    Frontend     │────►│     Backend      │────►│  Bot Microservice │
│  (React + TS)   │◄────│ (Node.js/Express)│◄────│    (Python)       │
│                 │     │                  │     │                   │
└─────────────────┘     └──────────────────┘     └───────────────────┘
```

## Frontend Architecture

### Source Code Paths
- `/components`: UI components including pages and shared elements
- `/contexts`: React contexts for state management (theme, language)
- `/hooks`: Custom React hooks including authentication
- `/services`: API service clients
- `/locales`: Internationalization files

### Key Components
- Dashboard pages (Overview, Technical Analysis, Performance, Configuration)
- Marketing pages (Home, Products, Testimonials, News, Contact)
- Authentication pages (Login, Register)
- Shared UI components (Card, Button, Input, etc.)

### Design Patterns
- Component composition
- Context-based state management
- Custom hooks for reusable logic
- Responsive design with mobile-first approach
- Internationalization using language context
- Theme switching with dark/light mode support
- Editable content with WYSIWYG editor

### WYSIWYG Editor Architecture

#### Source Code Paths
- `/components/editor`: Editor-specific UI components
- `/contexts/EditorContext.tsx`: Editor state management
- `/services/cmsEditorService.ts`: Service for editor-CMS integration

#### Key Components
- **EditorProvider**: Context provider for editor state management
  - Handles edit mode toggling, permissions, and content state
  - Integrates with authentication system for edit permissions
- **EditablePage**: Container component for editable content
  - Manages content loading, saving, and publishing
  - Provides editing context to child components
  - Handles version history and previewing
- **EditableField**: Individual editable field component
  - Renders different editors based on field type
  - Manages field value updates
  - Toggles between view and edit modes
- **RichTextEditor**: Rich text editing component
  - React-Quill integration for WYSIWYG editing
  - Media insertion capabilities
  - Custom toolbar configuration
- **MediaSelector**: Media library browser and uploader
  - Image selection from media library
  - File upload functionality
  - Pagination and search
- **VersionHistoryPanel**: Version management component
  - Displays version history
  - Allows previewing previous versions
  - Shows version comparison
  - Supports version restoration

#### Design Patterns
- **Context Provider Pattern**: EditorContext provides editor state to all components
- **Compound Components**: EditablePage works with EditableField to create cohesive editing experience
- **Adapter Pattern**: cmsEditorService adapts between frontend editor models and backend CMS models
- **Factory Pattern**: Dynamic field rendering based on content type
- **Observer Pattern**: Field changes update central state

## Bot Microservice Architecture

### Source Code Paths
- `/bot_microservice/formula_manage`: Formula scheduling and management
- `/bot_microservice/formula_calc`: Trading formula calculations
- `/bot_microservice/data_retrival`: Market data retrieval and caching
- `/bot_microservice/order_manager`: Trade order execution
- `/bot_microservice/api`: RESTful API endpoints for integration

### Key Components
- FastAPI application for API endpoints
  - Formula Configuration API (create, read, update, delete trading formulas)
  - Trading Status API (trade history, current trades, performance metrics)
  - System Control API (start/stop trading system, status monitoring)
- Formula Manager for scheduling and executing trading strategies
- Data cache with Redis for market data
- TradingView data feed integration
- Background scheduler for recurring formula evaluation
- Database integration for persistent storage of configurations and trades

### API Endpoints
- `/api/formulas`: CRUD operations for trading formula configurations
- `/api/trades`: Access to trade history and current active trades
- `/api/performance`: Trading performance metrics and analytics
- `/api/system/start`, `/api/system/stop`: System control operations
- `/api/system/status`: System monitoring and health checks

### Design Patterns
- Scheduler pattern for periodic tasks
- Caching for performance optimization
- Service-oriented architecture
- Dependency injection
- Repository pattern for data access
- Observer pattern for system monitoring

## Backend Architecture

### Source Code Paths
- `/backend/src/controllers`: API controllers including authentication
- `/backend/src/models`: Database models (User, RefreshToken)
- `/backend/src/middlewares`: Request processing middlewares
- `/backend/src/utils`: Utility functions for JWT and other services
- `/backend/src/migrations`: Database schema migrations
- `/backend/src/modules/cms`: CMS-specific modules (models, controllers, routes)
- `/backend/src/modules/bot`: Bot integration module (controllers, models, services)

### Implemented Components
- **Authentication System**:
  - User registration and login endpoints
  - JWT token generation and verification
  - Refresh token management
  - Password hashing with bcrypt
  - Rate limiting for security
- **Database Models**:
  - User model with secure password storage
  - RefreshToken model with user relationship
- **CMS Backend System**:
  - Content type management
  - Content creation and versioning
  - Role-based access control
  - Media storage and processing
  - API endpoints for all CMS operations
- **Bot Integration Module**:
  - Comprehensive service layer with error handling, caching, and retry mechanisms
  - Controllers and routes for formula management, trading status, and system control
  - Data models for formulas, trades, and system status
  - Monitoring and performance tracking

### Bot Integration Architecture

#### Source Code Paths
- `/backend/src/modules/bot/controllers`: API controllers for bot operations
- `/backend/src/modules/bot/models`: Database models for trading entities
- `/backend/src/modules/bot/routes`: Route definitions for bot API endpoints
- `/backend/src/modules/bot/services`: Service layer for bot microservice communication
- `/backend/src/modules/bot/middlewares`: Validation and error handling middleware

#### Database Models
- **Formula Model**: Trading formula configurations
  - Symbol, exchange, interval, parameters, active status
- **Trade Model**: Trade execution records
  - Symbol, side, quantity, price, status, stop-loss, take-profit
- **SystemStatus Model**: Trading system state
  - Running status, active formulas, execution timestamps, error messages

#### API Endpoints
- `/api/bot/formulas`: CRUD operations for formula configurations
- `/api/bot/trades`: Trade history with filtering and pagination
- `/api/bot/trades/current`: Currently active trades
- `/api/bot/trades/performance`: Performance metrics and analytics
- `/api/bot/system/start`, `/api/bot/system/stop`: System control
- `/api/bot/system/status`: System monitoring

#### Service Architecture
- **botMicroservice.service.js**: Communication with Python bot microservice
  - HTTP client with retry logic
  - Error handling and logging
  - Request/response transformation
- **monitoring.service.js**: System monitoring and metrics
  - Performance tracking
  - Error aggregation
  - Logging and alerting

#### Caching Strategy
- Redis-based caching for high-performance data access
- In-memory fallback cache
- Configurable TTL for different resource types
- Automatic cache invalidation on data changes

### CMS Backend Architecture

#### Database Schema
The CMS backend uses a sophisticated database schema with the following key models:

1. **ContentType**: Defines the structure for different types of content
   - Properties: id, name, slug, description, isListable, defaultStatus
   - Relations: has many Content, has many ContentField

2. **Content**: Represents individual content entries
   - Properties: id, contentTypeId, title, slug, status, publishedAt, createdById, updatedById
   - Relations: belongs to ContentType, has many ContentVersion, has many ContentFieldValue

3. **ContentField**: Defines fields for content types
   - Properties: id, contentTypeId, name, key, type, required, displayOrder, settings
   - Relations: belongs to ContentType, has many ContentFieldValue

4. **ContentFieldValue**: Stores values for content fields
   - Properties: id, contentId, fieldId, textValue, numberValue, booleanValue, dateValue, jsonValue, mediaId, referenceId, referenceType
   - Relations: belongs to Content, belongs to ContentField

5. **ContentVersion**: Tracks history of content changes
   - Properties: id, contentId, versionNumber, title, status, data, createdById, notes
   - Relations: belongs to Content, belongs to User (createdBy)

6. **MediaAsset**: Manages uploaded media files
   - Properties: id, filename, originalFilename, mimeType, size, path, url, metadata, uploadedById
   - Relations: belongs to User (uploadedBy)

7. **Role**: Defines user roles for access control
   - Properties: id, name, slug, description, isSystemRole
   - Relations: has many User, belongs to many Permission

8. **Permission**: Defines granular permissions
   - Properties: id, name, slug, description, category
   - Relations: belongs to many Role

#### Media Storage System
The CMS includes a flexible media storage system with:

- Support for multiple storage providers (local filesystem and Cloudinary)
- Automatic image processing (thumbnails and optimized versions)
- Secure file handling with validation and access control
- Comprehensive media API endpoints

#### API Structure
The CMS API follows RESTful principles with these endpoint categories:

1. **Content Type Endpoints** (`/api/cms/content-types`):
   - GET, POST, PUT, DELETE operations for content type management
   - Field management for content types

2. **Content Endpoints** (`/api/cms/content`):
   - CRUD operations for content entries
   - Filtering, pagination, and sorting
   - Version management

3. **Media Endpoints** (`/api/cms/media`):
   - File upload and management
   - Image processing
   - Media attachment to content

4. **Role & Permission Endpoints** (`/api/cms/roles`, `/api/cms/permissions`):
   - Role management
   - Permission assignment
   - Access control configuration

#### Integration with Authentication
The CMS integrates seamlessly with the authentication system:

- All CMS endpoints require JWT authentication
- User identity is tracked for content creation and updates
- Role-based access control leverages the user's assigned role
- Permissions middleware controls access to CMS operations

#### Security Features
- Comprehensive input validation
- SQL injection protection via Sequelize ORM
- Role-based access control
- Permission-based authorization
- Content ownership verification
- Media file validation and scanning

### Design Patterns
- RESTful API design
- JWT authentication
- MVC architecture
- Data validation middleware
- Repository pattern for data access
- Transaction-based data operations
- Content versioning
- Service abstraction for media storage

## Data Flow

1. **User Authentication Flow**:
   - User registers/logs in through frontend
   - Backend validates credentials and issues JWT
   - Backend stores refresh token in database
   - Frontend stores access token for authenticated requests
   - Token refresh mechanism extends user sessions

2. **CMS Content Management Flow**:
   - User creates/edits content through frontend CMS interface
   - Authentication middleware validates user token
   - Permission middleware checks user's access rights
   - Editor components manage the editing experience:
     - EditablePage loads content from CMS backend
     - EditableField components render appropriate editors
     - Editor toolbar provides save, publish, and version options
   - Rich text editing with media integration is handled by RichTextEditor
   - Version management allows comparing and restoring previous versions
   - Backend processes content and stores in database
   - Content versioning system tracks changes
   - Frontend receives updated content data

3. **Media Management Flow**:
   - User uploads media through frontend
   - Files are validated and processed by backend
   - Images are optimized and thumbnails generated
   - Media metadata is stored in database
   - Media is served through public or authenticated endpoints

4. **Bot Configuration Flow**:
   - User configures trading bot parameters via dashboard
   - Frontend sends configuration to backend via botService
   - Backend validates data and stores in database
   - Backend forwards configuration to bot microservice
   - Bot microservice applies new configuration to formula manager
   - System status is updated and returned to frontend
   - Dashboard displays confirmation of configuration changes

5. **Trading Execution Flow**:
   - Bot microservice retrieves market data from external sources
   - Trading formulas evaluate market conditions
   - Formula manager makes trading decisions based on formula outputs
   - Orders are executed through broker APIs
   - Trade results are stored in database
   - Performance metrics are calculated and updated
   - Backend API provides trade results to frontend
   - Dashboard components display real-time trading activity

6. **Performance Monitoring Flow**:
   - Performance data is collected from trading activities
   - Bot microservice calculates key performance indicators
   - Backend aggregates and enhances performance metrics
   - Frontend retrieves metrics via botService API client
   - Dashboard components visualize performance data
   - Users can filter and analyze trading performance

7. **System Control Flow**:
   - User initiates system control actions (start/stop) from dashboard
   - Frontend sends commands via botService
   - Backend validates user permissions
   - Backend forwards commands to bot microservice
   - Bot microservice updates scheduler and formula execution
   - System status changes are stored and propagated to frontend
   - Dashboard displays real-time system status

## Critical Implementation Paths

1. **Backend Development**:
   - ✅ Authentication system
   - ✅ CMS backend system
   - ✅ API gateway to bot microservice
   - ✅ Database models and migrations
   - ✅ Performance metrics service

2. **Integration**:
   - ✅ Connect frontend to new backend APIs
   - ✅ Connect backend to bot microservice
   - ✅ Implement real data in dashboard components