# Bot Microservice - Technical Documentation

This document provides detailed technical information about the Python-based bot microservice implementation.

## Architecture

The bot microservice follows a modular architecture with clear separation of concerns:

```
┌──────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                  │     │                   │     │                   │
│   API Layer      │────►│  Business Logic   │────►│   Data Layer      │
│  (FastAPI)       │◄────│  (Formula Calc)   │◄────│   (Data Retrival) │
│                  │     │                   │     │                   │
└──────────────────┘     └───────────────────┘     └───────────────────┘
        │                         │                         │
        │                         │                         │
        ▼                         ▼                         ▼
┌──────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│                  │     │                   │     │                   │
│  Authentication  │     │ Formula Scheduler │     │   Redis Cache     │
│                  │     │                   │     │                   │
└──────────────────┘     └───────────────────┘     └───────────────────┘
                                  │
                                  │
                                  ▼
                         ┌───────────────────┐
                         │                   │
                         │   Order Manager   │
                         │                   │
                         └───────────────────┘
```

### Core Components

1. **API Layer**
   - FastAPI framework for RESTful endpoints
   - Request validation and authentication
   - Response formatting and error handling

2. **Business Logic Layer**
   - Formula calculation and evaluation
   - Technical indicator implementation
   - Trading signal generation
   - Business rule enforcement

3. **Data Layer**
   - Market data retrieval from external sources
   - Data caching using Redis
   - Data transformation and normalization
   - Historical data management

4. **Scheduler**
   - Background task scheduling with APScheduler
   - Formula execution at specified intervals
   - Job management and prioritization
   - Failure handling and retries

5. **Order Manager**
   - Broker API integration for order execution
   - Order status tracking
   - Position management
   - Risk management controls

## Data Flow

1. **Market Data Retrieval**
   - External market data is fetched from providers
   - Data is normalized to a standard format
   - Data is cached in Redis for quick access
   - Cache expiration is managed based on data volatility

2. **Formula Execution**
   - Scheduler triggers formula execution at specified intervals
   - Market data is retrieved from cache or fetched if needed
   - Technical indicators are calculated
   - Trading signals are generated based on formula logic
   - Results are stored and returned to the caller

3. **Order Execution**
   - Trading signals trigger order creation
   - Orders are validated against risk parameters
   - Orders are submitted to the broker API
   - Order status is monitored and updated
   - Trade results are recorded

## Technical Implementation Details

### FastAPI Integration

The microservice uses FastAPI for its API layer:

```python
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Trading Bot Microservice",
    description="API for algorithmic trading bot",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restricted in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers from api module
from api.routes import formula_router, trade_router, system_router
app.include_router(formula_router, prefix="/api")
app.include_router(trade_router, prefix="/api")
app.include_router(system_router, prefix="/api")
```

### Scheduler Implementation

The formula scheduler uses APScheduler with configurable intervals:

```python
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

class FormulaScheduler:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.jobs = {}
        self.scheduler.start()
    
    def add_formula(self, formula_id, formula_config, interval_seconds):
        job = self.scheduler.add_job(
            self._execute_formula,
            IntervalTrigger(seconds=interval_seconds),
            args=[formula_id, formula_config],
            id=str(formula_id),
            replace_existing=True
        )
        self.jobs[formula_id] = job
        return job
```

### Redis Caching

Market data is cached using Redis to improve performance:

```python
import redis
import json
import os
from datetime import timedelta

class RedisCache:
    def __init__(self):
        self.redis_host = os.getenv('REDIS_HOST', 'localhost')
        self.redis_port = int(os.getenv('REDIS_PORT', 6379))
        self.redis_db = int(os.getenv('REDIS_DB', 0))
        
        self.client = redis.Redis(
            host=self.redis_host,
            port=self.redis_port,
            db=self.redis_db,
            decode_responses=True
        )
    
    def get(self, key):
        data = self.client.get(key)
        if data:
            return json.loads(data)
        return None
    
    def set(self, key, value, ttl_seconds=300):
        serialized = json.dumps(value)
        self.client.set(key, serialized, ex=ttl_seconds)
```

### Technical Indicators

Technical indicators are implemented in the `complex_func.py` module:

```python
import numpy as np
import pandas as pd

def calculate_rsi(data, period=14):
    """Calculate the Relative Strength Index (RSI)"""
    delta = data.diff()
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)
    
    avg_gain = gain.rolling(window=period).mean()
    avg_loss = loss.rolling(window=period).mean()
    
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    
    return rsi

def calculate_moving_average(data, period):
    """Calculate Simple Moving Average (SMA)"""
    return data.rolling(window=period).mean()

def calculate_macd(data, fast_period=12, slow_period=26, signal_period=9):
    """Calculate Moving Average Convergence Divergence (MACD)"""
    fast_ma = data.ewm(span=fast_period, min_periods=fast_period).mean()
    slow_ma = data.ewm(span=slow_period, min_periods=slow_period).mean()
    
    macd_line = fast_ma - slow_ma
    signal_line = macd_line.ewm(span=signal_period, min_periods=signal_period).mean()
    histogram = macd_line - signal_line
    
    return macd_line, signal_line, histogram
```

## Performance Considerations

### Caching Strategy

- **Market Data**: Cached with TTL based on interval (shorter intervals = shorter TTL)
- **Calculation Results**: Intermediate calculation results cached to avoid recalculation
- **Hot Path Optimization**: Frequently accessed data kept in Redis with higher priority

### Database Optimization

- Indexes on frequently queried fields
- Efficient query patterns
- Connection pooling

### Concurrent Processing

- Background job threading for non-blocking operations
- Task queue for order processing
- Rate limiting for external API calls

## Error Handling

### Retry Mechanism

External API calls implement an exponential backoff retry mechanism:

```python
import time
from functools import wraps

def retry_with_backoff(max_retries=3, base_delay=1):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            retries = 0
            while retries <= max_retries:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    retries += 1
                    if retries > max_retries:
                        raise e
                    
                    delay = base_delay * (2 ** (retries - 1))
                    time.sleep(delay)
            
            # Should never get here, but just in case
            raise Exception("Max retries exceeded")
        
        return wrapper
    return decorator
```

### Failure Logging

- Comprehensive logging of all operations
- Error level differentiation (warning, error, critical)
- Structured logs for easier analysis
- Log correlation with request IDs

### Circuit Breaker

- Circuit breaker pattern for external API calls
- Prevents cascading failures
- Graceful degradation when dependencies are unavailable

## Monitoring and Observability

- Health check endpoints for system status
- Performance metrics collection
- Prometheus integration for metrics
- Structured logging

## Configuration Management

- Environment variable based configuration
- Hierarchical configuration system
- Sensible defaults with override capability
- Configuration validation on startup

## Security Considerations

- API authentication and authorization
- Input validation and sanitization
- Rate limiting to prevent abuse
- Secure handling of credentials
- CORS configuration for web security

## Dependencies

- **FastAPI**: Web framework
- **Uvicorn**: ASGI server
- **APScheduler**: Background task scheduling
- **Pandas/NumPy**: Data manipulation and analysis
- **Redis**: Caching
- **Requests**: HTTP client for external APIs
- **SQLAlchemy**: Database ORM (when using persistent storage)