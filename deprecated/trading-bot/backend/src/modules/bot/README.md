# Bot Microservice Integration Module

This module provides the backend integration layer between the frontend application and the Python-based trading bot microservice. It implements a comprehensive set of RESTful APIs for managing trading formulas, monitoring trading activity, and controlling the bot system.

## Architecture

The bot module follows a layered architecture:

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────────┐
│                 │     │                  │     │                   │
│    Frontend     │────►│ Backend (Node.js)│────►│  Bot Microservice │
│  (React + TS)   │◄────│    Bot Module    │◄────│    (Python)       │
│                 │     │                  │     │                   │
└─────────────────┘     └──────────────────┘     └───────────────────┘
```

### Key Components

- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic and integration with the microservice
- **Models**: Define database entities for storing formula configurations and trades
- **Routes**: Define API endpoints
- **Middlewares**: Handle validation, authentication, and error handling
- **Monitoring**: Track API performance and errors

## API Endpoints

### Formula Endpoints

#### `GET /api/bot/formulas`
Get all formula configurations

**Request:**
```
GET /api/bot/formulas
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "RSI Strategy",
      "symbol": "AAPL",
      "exchange": "NASDAQ",
      "interval": "1h",
      "parameters": {
        "rsi_period": 14,
        "oversold_threshold": 30,
        "overbought_threshold": 70
      },
      "is_active": true,
      "created_at": "2025-06-01T10:00:00Z",
      "updated_at": null
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Moving Average Crossover",
      "symbol": "MSFT",
      "exchange": "NASDAQ",
      "interval": "1d",
      "parameters": {
        "short_period": 20,
        "long_period": 50
      },
      "is_active": true,
      "created_at": "2025-06-02T14:30:00Z",
      "updated_at": "2025-06-03T09:15:00Z"
    }
  ]
}
```

#### `GET /api/bot/formulas/:id`
Get a specific formula by ID

**Request:**
```
GET /api/bot/formulas/550e8400-e29b-41d4-a716-446655440000
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "RSI Strategy",
    "symbol": "AAPL",
    "exchange": "NASDAQ",
    "interval": "1h",
    "parameters": {
      "rsi_period": 14,
      "oversold_threshold": 30,
      "overbought_threshold": 70
    },
    "is_active": true,
    "created_at": "2025-06-01T10:00:00Z",
    "updated_at": null
  }
}
```

#### `POST /api/bot/formulas`
Create a new formula configuration

**Request:**
```
POST /api/bot/formulas
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "MACD Strategy",
  "symbol": "TSLA",
  "exchange": "NASDAQ",
  "interval": "15m",
  "parameters": {
    "fast_period": 12,
    "slow_period": 26,
    "signal_period": 9
  },
  "is_active": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "MACD Strategy",
    "symbol": "TSLA",
    "exchange": "NASDAQ",
    "interval": "15m",
    "parameters": {
      "fast_period": 12,
      "slow_period": 26,
      "signal_period": 9
    },
    "is_active": true,
    "created_at": "2025-06-19T15:45:00Z",
    "updated_at": null
  }
}
```

#### `PUT /api/bot/formulas/:id`
Update an existing formula

**Request:**
```
PUT /api/bot/formulas/550e8400-e29b-41d4-a716-446655440002
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "parameters": {
    "fast_period": 10,
    "slow_period": 20,
    "signal_period": 9
  },
  "is_active": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "MACD Strategy",
    "symbol": "TSLA",
    "exchange": "NASDAQ",
    "interval": "15m",
    "parameters": {
      "fast_period": 10,
      "slow_period": 20,
      "signal_period": 9
    },
    "is_active": false,
    "created_at": "2025-06-19T15:45:00Z",
    "updated_at": "2025-06-19T16:00:00Z"
  }
}
```

#### `DELETE /api/bot/formulas/:id`
Delete a formula

**Request:**
```
DELETE /api/bot/formulas/550e8400-e29b-41d4-a716-446655440002
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Formula deleted successfully"
}
```

### Trading Status Endpoints

#### `GET /api/bot/trades`
Get history of executed trades

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `symbol`: Filter by symbol
- `status`: Filter by status
- `dateFrom`: Filter by date range start (ISO format)
- `dateTo`: Filter by date range end (ISO format)

**Request:**
```
GET /api/bot/trades?page=1&limit=10&symbol=AAPL
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440010",
        "symbol": "AAPL",
        "side": "buy",
        "quantity": 10,
        "price": 175.50,
        "status": "filled",
        "stop_loss": 170.00,
        "take_profit": 185.00,
        "is_successful": true,
        "created_at": "2025-06-15T10:30:00Z",
        "filled_at": "2025-06-15T10:30:05Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440011",
        "symbol": "AAPL",
        "side": "sell",
        "quantity": 10,
        "price": 182.75,
        "status": "filled",
        "stop_loss": null,
        "take_profit": null,
        "is_successful": true,
        "created_at": "2025-06-17T14:15:00Z",
        "filled_at": "2025-06-17T14:15:03Z"
      }
    ],
    "pagination": {
      "total": 45,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

#### `GET /api/bot/trades/current`
Get currently active trades

**Request:**
```
GET /api/bot/trades/current
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440020",
      "symbol": "MSFT",
      "side": "buy",
      "quantity": 5,
      "price": 350.25,
      "status": "open",
      "stop_loss": 340.00,
      "take_profit": 370.00,
      "is_successful": null,
      "created_at": "2025-06-19T09:45:00Z",
      "filled_at": null
    }
  ]
}
```

#### `GET /api/bot/trades/performance`
Get performance metrics

**Request:**
```
GET /api/bot/trades/performance
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_trades": 145,
    "successful_trades": 98,
    "failed_trades": 47,
    "success_rate": 67.59,
    "total_profit": 12540.75,
    "average_profit_per_trade": 86.49,
    "largest_profit": 1250.00,
    "largest_loss": 750.00,
    "profit_history": [
      {
        "date": "2025-05-01",
        "profit": 1540.50
      },
      {
        "date": "2025-06-01",
        "profit": 2100.25
      }
    ],
    "symbols_performance": [
      {
        "symbol": "AAPL",
        "trades_count": 45,
        "success_rate": 73.33,
        "total_profit": 4250.75
      },
      {
        "symbol": "MSFT",
        "trades_count": 38,
        "success_rate": 65.79,
        "total_profit": 3120.50
      }
    ]
  }
}
```

### System Control Endpoints

#### `POST /api/bot/system/start`
Start the trading system

**Request:**
```
POST /api/bot/system/start
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "running",
    "start_time": "2025-06-19T16:30:00Z",
    "active_formulas": 3,
    "last_execution": null,
    "next_execution": "2025-06-19T16:35:00Z",
    "error_message": null,
    "updated_at": "2025-06-19T16:30:00Z"
  },
  "message": "Trading system started successfully"
}
```

#### `POST /api/bot/system/stop`
Stop the trading system

**Request:**
```
POST /api/bot/system/stop
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "stopped",
    "start_time": "2025-06-19T16:30:00Z",
    "active_formulas": 0,
    "last_execution": "2025-06-19T16:45:00Z",
    "next_execution": null,
    "error_message": null,
    "updated_at": "2025-06-19T16:50:00Z"
  },
  "message": "Trading system stopped successfully"
}
```

#### `GET /api/bot/system/status`
Get system status

**Request:**
```
GET /api/bot/system/status
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "status": "running",
    "start_time": "2025-06-19T16:30:00Z",
    "active_formulas": 3,
    "last_execution": "2025-06-19T16:45:00Z",
    "next_execution": "2025-06-19T17:00:00Z",
    "error_message": null,
    "updated_at": "2025-06-19T16:45:00Z"
  }
}
```

## Data Models

### Formula Model

```javascript
{
  id: UUID,               // Primary key
  name: String,           // Required, formula name
  symbol: String,         // Required, trading symbol
  exchange: String,       // Exchange (default: 'AMEX')
  interval: Enum,         // '1m', '5m', '15m', '1h', '1d'
  parameters: JSON,       // Formula-specific parameters
  is_active: Boolean,     // Whether formula is active
  created_at: DateTime,   // Creation timestamp
  updated_at: DateTime    // Last update timestamp
}
```

### Trade Model

```javascript
{
  id: UUID,               // Primary key
  symbol: String,         // Trading symbol
  side: Enum,             // 'buy' or 'sell'
  quantity: Float,        // Trade quantity
  price: Float,           // Trade price
  status: Enum,           // 'open', 'filled', 'cancelled', 'expired', 'rejected'
  stop_loss: Float,       // Optional stop loss price
  take_profit: Float,     // Optional take profit price
  is_successful: Boolean, // Trade success status
  created_at: DateTime,   // Creation timestamp
  filled_at: DateTime     // When trade was filled
}
```

### SystemStatus Model

```javascript
{
  id: Integer,            // Primary key
  status: Enum,           // 'running', 'stopped', 'error'
  start_time: DateTime,   // When system was started
  active_formulas: Integer, // Number of active formulas
  last_execution: DateTime, // Last formula execution time
  next_execution: DateTime, // Next scheduled execution
  error_message: Text,    // Error message if status is 'error'
  updated_at: DateTime    // Last update timestamp
}
```

## Error Handling

The bot module implements a standardized error handling approach:

### Error Response Format

```json
{
  "success": false,
  "error": "Error message describing the problem"
}
```

### Common Error Codes

| HTTP Status | Error Type               | Description                                       |
|-------------|--------------------------|---------------------------------------------------|
| 400         | Bad Request              | Invalid input parameters or validation failed     |
| 401         | Unauthorized             | Missing or invalid authentication token           |
| 403         | Forbidden                | Valid token but insufficient permissions          |
| 404         | Not Found                | Requested resource not found                      |
| 409         | Conflict                 | Resource conflict (e.g., duplicate formula name)  |
| 429         | Too Many Requests        | Rate limit exceeded                               |
| 500         | Internal Server Error    | Unexpected server error                           |
| 503         | Service Unavailable      | Bot microservice unavailable                      |

### Error Examples

**Formula Not Found:**
```json
{
  "success": false,
  "error": "Formula not found"
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": "Missing required field: name"
}
```

**Microservice Unavailable:**
```json
{
  "success": false,
  "error": "Failed to connect to trading bot microservice"
}
```

## Caching Strategy

The module implements a flexible caching system with support for both Redis and in-memory caching:

### Cache Configuration

| Resource          | Cache Key Pattern         | TTL (seconds) | Description                      |
|-------------------|---------------------------|---------------|----------------------------------|
| All Formulas      | `bot:formulas`            | 30            | List of all formula configs      |
| Single Formula    | `bot:formula:{id}`        | 30            | Individual formula by ID         |
| All Trades        | `bot:trades`              | 30            | Trade history                    |
| Current Trades    | `bot:trades:current`      | 15            | Currently active trades          |
| Performance       | `bot:performance`         | 60            | Performance metrics              |
| System Status     | `bot:system:status`       | 10            | Current system status            |

### Caching Implementation

The caching system automatically falls back to in-memory caching when Redis is unavailable:

- Redis is used when `USE_REDIS=true` in environment variables
- Node-cache is used as fallback
- Cache invalidation occurs automatically on resource updates

### Cache Configuration Options

Environment variables for Redis configuration:

```
USE_REDIS=true
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

## Performance Monitoring

The module includes comprehensive monitoring capabilities:

- API performance tracking (response times, request counts)
- Error logging with context
- Winston-based logging to both console and log files

### Log Files

- `logs/bot-microservice.log` - General service logs
- `logs/bot-performance.log` - API performance metrics
- `logs/bot-error.log` - Detailed error logs

## Configuration Options

The bot module can be configured using the following environment variables:

### Bot Microservice Connection

```
BOT_MICROSERVICE_URL=http://localhost:8000  # URL of the Python bot microservice
BOT_MICROSERVICE_MAX_RETRIES=3              # Maximum retry attempts for failed requests
BOT_MICROSERVICE_RETRY_DELAY=1000           # Base delay (ms) between retries
```

### Caching Configuration

```
USE_REDIS=true                # Whether to use Redis for caching
REDIS_HOST=localhost          # Redis server hostname
REDIS_PORT=6379               # Redis server port
REDIS_PASSWORD=               # Redis password (if required)
REDIS_DB=0                    # Redis database number
MEMORY_CACHE_TTL=60           # Default TTL for in-memory cache
```

### Logging Configuration

```
LOG_LEVEL=info                # Logging level (debug, info, warn, error)
LOG_TO_CONSOLE=true           # Whether to log to console
LOG_TO_FILE=true              # Whether to log to files
LOG_DIR=logs                  # Directory for log files
```

## Testing

A comprehensive test script (`test-bot.js`) is included to verify the functionality of the bot module APIs. Run the tests using:

```bash
./test-bot.sh
```

## Dependencies

- `axios`: For HTTP requests to the microservice
- `ioredis`: For Redis caching
- `node-cache`: For in-memory caching fallback
- `winston`: For logging
- `joi`: For request validation