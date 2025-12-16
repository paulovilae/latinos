# Technologies and Technical Setup

## Frontend Technologies

### Core Technologies
- **React 19**: Latest version of the React framework
- **TypeScript**: For type-safe code
- **Vite**: Build tool and development server

### Libraries and Dependencies
- **react-router-dom**: For client-side routing
- **react-icons**: Icon library
- **Context API**: For state management (theme, language)

### Development Tools
- **npm**: Package manager
- **ESLint**: Code linting
- **Prettier**: Code formatting

## Bot Microservice Technologies

### Core Technologies
- **Python**: Programming language
- **FastAPI**: Web framework for building APIs
- **Uvicorn**: ASGI server implementation

### Libraries and Dependencies
- **APScheduler**: Background task scheduler
- **pandas**: Data manipulation and analysis
- **numpy**: Numerical computing
- **plotly**: Interactive data visualization
- **tradingview_datafeed**: Market data retrieval
- **alpaca_trade_api**: Broker integration for executing trades
- **redis**: Caching solution
- **streamlit**: For data visualization dashboards

### Data Storage
- **Redis**: For caching market data
- **PostgreSQL**: For persistent data storage (configured but commented out in requirements)

## Backend Technologies

### Core Technologies
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web framework for building RESTful APIs
- **Sequelize ORM**: Object-relational mapper for database interactions

### Authentication System
- **JWT (jsonwebtoken)**: For token-based authentication
- **bcrypt**: For password hashing and security
- **express-rate-limit**: For rate limiting to prevent brute force attacks

### Database
- **PostgreSQL**: Relational database (configured but connection pending)

### Planned Additional Technologies
- **Redis**: For caching and session management
- **Socket.IO** or **WebSockets**: For real-time data streaming

## Unified Startup System

### Core Components
- **Orchestrator** (`orchestrator.js`): Central controller that coordinates the startup process, dependency management, and proper startup sequence
- **Configuration Manager** (`config-manager.js`): Manages centralized configuration for all services, supports environment variable overrides and custom config files
- **Service Manager** (`service-manager.js`): Handles service lifecycle operations (start, stop, restart) and process management
- **Health Checker** (`health-checker.js`): Verifies services are operational by polling health endpoints with configurable timeouts
- **Platform Adapter** (`platform-adapter.js`): Ensures cross-platform compatibility between Windows and Unix-based systems
- **Error Handler** (`error-handler.js`): Provides comprehensive error handling, detailed error messages, and recovery options
- **Dependency Checker** (`dependency-checker.js`): Verifies required software and packages before attempting to start services

### Platform Scripts
- **start-platform.bat/sh**: Cross-platform scripts for starting all services in the correct order
- **stop-platform.bat/sh**: Cross-platform scripts for gracefully shutting down all services
- **npm scripts**: `npm run start:platform`, `npm run stop:platform` for convenient startup/shutdown

### Configuration
- Centralized `platform-config.js` file with settings for all services
- Support for environment variable overrides:
  - `PLATFORM_MODE`: "development" or "production"
  - `PLATFORM_LOG_LEVEL`: Logging verbosity
  - `FRONTEND_PORT`, `BACKEND_PORT`, `BOT_PORT`: Service port overrides
  - `PLATFORM_CONFIG_PATH`: Path to custom configuration file
- Health check endpoints and timeouts configuration
- Service dependency mapping

## Development Environment

### Prerequisites
- Node.js and npm for frontend development
- Python 3.9+ for bot microservice
- Redis server for caching
- PostgreSQL for database (when implemented)

### Setup Steps
1. Clone repository
2. Install frontend dependencies: `npm install`
3. Install backend dependencies: `cd backend && npm install`
4. Install bot microservice dependencies: `pip install -r bot_microservice/requirements.txt`
5. Set up environment variables (.env.local for frontend, .env for backend)
6. Start the entire platform: `npm run start:platform` or use `start-platform.bat/sh`

## Deployment Considerations

### Frontend Deployment
- Build with `npm run build`
- Host on static hosting services (Netlify, Vercel, etc.)

### Backend Deployment
- Node.js hosting platforms (Heroku, AWS, DigitalOcean)
- Database hosting for PostgreSQL
- Environment variable configuration for secrets

### Bot Microservice Deployment
- Docker containerization available (Dockerfile provided)
- Can be deployed to any cloud provider supporting Docker
- Requires Redis and other dependencies

### Security Considerations
- API keys and credentials management
- CORS configuration
- Rate limiting for API endpoints
- Data encryption for sensitive information
- JWT token security (expiration, refresh mechanisms)