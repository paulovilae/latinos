# AI Trading Bot Microservice

This microservice powers the trading algorithm execution and market data processing for the AI Trading Bot Platform. Built with Python and FastAPI, it handles trading formula calculations, market data retrieval, and order execution.

## Key Features

- **Formula Management**: Schedule and execute trading formulas based on market conditions
- **Market Data Processing**: Retrieve and cache market data from external sources
- **Trading Execution**: Place orders with brokers based on formula signals
- **API Interface**: RESTful API for integration with the main application
- **Background Processing**: Scheduled tasks for recurring formula evaluation

## Directory Structure

```
bot_microservice/
├── api/                 # FastAPI endpoints and database integration
│   ├── __init__.py
│   ├── database.py      # Database connection management
│   ├── models.py        # Data models
│   └── routes.py        # API route definitions
├── data_retrival/       # Market data retrieval and caching
│   ├── redis_connection.py  # Redis cache connection
│   └── retrive_data.py      # Data source integration
├── formula_calc/        # Trading formula calculations
│   ├── calculate_formulas.py  # Formula evaluation logic
│   └── complex_func.py        # Technical indicators implementation
├── formula_manage/      # Formula scheduling and management
│   ├── formula_manager.py  # Formula registration and management
│   ├── scheduler.py        # Background task scheduling
│   └── utils.py            # Utility functions
├── order_manager/       # Trade order execution
│   └── orders.py           # Broker integration for order placement
├── docs/                # Documentation
│   └── INSTALLATION.md     # Installation instructions
├── Dockerfile           # Container definition
├── environment_config.py  # Environment configuration
├── main.py              # Application entry point
├── requirements.txt     # Python dependencies
└── mock_server.py       # Test server for development
```

## Core Modules

- **calculate_formulas.py**: Evaluates trading strategies for symbols and determines trade execution
- **complex_func.py**: Contains technical indicator calculations (RSI, Moving Averages, etc.)
- **orders.py**: Handles order placement with brokers for trade execution
- **formula_manager.py**: Manages formula scheduling and execution
- **retrive_data.py**: Retrieves market data from external sources

## API Endpoints

- `/api/formulas`: CRUD operations for trading formula configurations
- `/api/trades`: Access to trade history and current active trades
- `/api/performance`: Trading performance metrics and analytics
- `/api/system/start`, `/api/system/stop`: System control operations
- `/api/system/status`: System monitoring and health checks

## Getting Started

See the [Installation Guide](docs/INSTALLATION.md) for detailed setup instructions.

## Integration

This microservice is designed to be integrated with the main backend application. For details on the integration, see the [Bot Integration Module](../backend/src/modules/bot/README.md) documentation.
