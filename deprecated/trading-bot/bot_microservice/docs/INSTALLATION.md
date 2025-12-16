# Bot Microservice Installation Guide

This document outlines the necessary steps to set up the bot microservice for the AI Trading Bot Platform.

## Prerequisites

- Python 3.8 or higher
- pip (Python package installer)

## Dependencies Installation

### 1. Core Dependencies

Install the core dependencies required by the bot microservice:

```bash
pip install fastapi uvicorn pandas apscheduler
```

### 2. Redis Cache

Redis is used for caching market data to improve performance:

```bash
pip install redis
```

### 3. TradingView Data Feed

For real-time market data, we use the tvdatafeed package which needs to be installed directly from GitHub:

```bash
pip install git+https://github.com/rongardF/tvdatafeed.git
```

This package allows us to:
- Fetch historical and real-time data from TradingView
- Access multiple timeframes (1m, 5m, 15m, 1h, 1d, etc.)
- Get data for various markets (stocks, forex, crypto)

#### Usage Example

```python
from tvdatafeed import TvDatafeed, Interval

# Initialize with TradingView credentials (optional)
tv = TvDatafeed(username='your_username', password='your_password')

# Or initialize without credentials (limited functionality)
# tv = TvDatafeed()

# Get historical data
data = tv.get_hist(
    symbol='AAPL',       # Symbol
    exchange='NASDAQ',   # Exchange
    interval=Interval.in_1_hour,  # Timeframe
    n_bars=100           # Number of bars
)

# Print the data
print(data.head())
```

## Starting the Bot Microservice

Once all dependencies are installed, start the bot microservice with:

```bash
python main.py
```

This will launch the FastAPI server on port 5555, which can be accessed at http://localhost:5555.

## Potential Issues and Solutions

### Redis Connection Error

If you encounter Redis connection errors, make sure Redis server is installed and running, or modify the cache configuration in `data_retrival/redis_connection.py`.

### TradingView Authentication

If you experience issues with TradingView data, you might need to:
1. Provide valid TradingView credentials
2. Check your network connection
3. Verify that the symbols and exchanges you're requesting exist on TradingView

## Environment Variables

You can configure the following environment variables:

- `REDIS_HOST`: Redis server host (default: localhost)
- `REDIS_PORT`: Redis server port (default: 6379)
- `TV_USERNAME`: TradingView username (optional)
- `TV_PASSWORD`: TradingView password (optional)