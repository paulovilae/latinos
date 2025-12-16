# Bot Microservice - User Guide

This guide provides information on how to configure, use, and monitor the trading bot microservice.

## Getting Started

### Prerequisites

Before using the trading bot microservice, ensure you have:

1. Python 3.9 or higher installed
2. Redis server (for caching market data)
3. Access to market data sources
4. Broker API credentials (if executing real trades)

### Installation

1. Clone the repository
2. Install required packages:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   ```
   # Create a .env file with the following variables
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=
   REDIS_DB=0
   
   # Trading configuration
   BROKER_API_KEY=your_api_key
   BROKER_API_SECRET=your_api_secret
   PAPER_TRADING=true  # Set to false for live trading
   
   # API configuration
   API_HOST=0.0.0.0
   API_PORT=8000
   ```

4. Start the microservice:
   ```bash
   python main.py
   ```

## Configuration

### Formula Configuration

Trading formulas define the strategies used by the bot. A formula configuration includes:

- **Symbol**: The trading symbol (e.g., "AAPL", "BTC/USD")
- **Exchange**: Trading exchange (e.g., "NASDAQ", "Binance")
- **Interval**: Timeframe for analysis (e.g., "1m", "5m", "1h", "1d")
- **Parameters**: Strategy-specific parameters

Example formula configuration:

```json
{
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
}
```

### System Settings

System settings control the overall behavior of the trading bot:

- **Execution Mode**: Paper trading vs. live trading
- **Risk Management**: Maximum position size, stop-loss settings
- **Notification Settings**: Alert configurations
- **Execution Schedule**: When formulas should run

## Using the API

The bot microservice exposes a RESTful API for integration:

### Formula Management

#### Creating a Formula

```bash
curl -X POST "http://localhost:8000/api/formulas" \
     -H "Content-Type: application/json" \
     -d '{
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
     }'
```

#### Listing Formulas

```bash
curl -X GET "http://localhost:8000/api/formulas"
```

#### Updating a Formula

```bash
curl -X PUT "http://localhost:8000/api/formulas/formula_id" \
     -H "Content-Type: application/json" \
     -d '{
       "parameters": {
         "fast_period": 10,
         "slow_period": 20,
         "signal_period": 9
       },
       "is_active": false
     }'
```

### Trade Management

#### Viewing Trade History

```bash
curl -X GET "http://localhost:8000/api/trades?page=1&limit=10&symbol=AAPL"
```

#### Viewing Current Trades

```bash
curl -X GET "http://localhost:8000/api/trades/current"
```

#### Viewing Performance Metrics

```bash
curl -X GET "http://localhost:8000/api/trades/performance"
```

### System Control

#### Starting the Trading System

```bash
curl -X POST "http://localhost:8000/api/system/start"
```

#### Stopping the Trading System

```bash
curl -X POST "http://localhost:8000/api/system/stop"
```

#### Checking System Status

```bash
curl -X GET "http://localhost:8000/api/system/status"
```

## Monitoring and Logs

### Log Files

The microservice generates several log files:

- `bot-microservice.log`: General service logs
- `bot-performance.log`: Performance metrics
- `bot-error.log`: Error logs

### Log Format

Log entries follow this format:

```
[TIMESTAMP] [LEVEL] [COMPONENT] - Message
```

Example:
```
[2025-06-19 10:15:30] [INFO] [FormulaManager] - Formula 'RSI Strategy' executed successfully
```

### Health Checks

You can verify the microservice health using:

```bash
curl -X GET "http://localhost:8000/health"
```

## Available Trading Strategies

The system supports several built-in trading strategies:

### RSI Strategy

Relative Strength Index (RSI) strategy that generates signals based on overbought/oversold conditions:

- **Parameters**:
  - `rsi_period`: Period for RSI calculation (default: 14)
  - `oversold_threshold`: Threshold for oversold condition (default: 30)
  - `overbought_threshold`: Threshold for overbought condition (default: 70)

### Moving Average Crossover

Generates signals when a short-term moving average crosses a long-term moving average:

- **Parameters**:
  - `short_period`: Short-term MA period (default: 20)
  - `long_period`: Long-term MA period (default: 50)

### MACD Strategy

Moving Average Convergence Divergence strategy that generates signals based on MACD line, signal line, and histogram:

- **Parameters**:
  - `fast_period`: Fast EMA period (default: 12)
  - `slow_period`: Slow EMA period (default: 26)
  - `signal_period`: Signal line period (default: 9)

## Extending the System

### Adding Custom Strategies

To add a custom trading strategy:

1. Add your strategy implementation to `formula_calc/calculate_formulas.py`
2. Register the strategy in `formula_manage/formula_manager.py`
3. Update the API validation schema in `api/models.py`

Example custom strategy implementation:

```python
def calculate_custom_strategy(symbol, interval, parameters, market_data):
    """
    Custom trading strategy implementation
    
    Args:
        symbol (str): Trading symbol
        interval (str): Timeframe interval
        parameters (dict): Strategy parameters
        market_data (pd.DataFrame): Historical price data
        
    Returns:
        dict: Strategy result with signal and metadata
    """
    # Implement your strategy logic here
    # ...
    
    return {
        'symbol': symbol,
        'interval': interval,
        'signal': 'buy',  # or 'sell' or 'hold'
        'confidence': 0.85,
        'metadata': {
            # Additional information about the signal
        }
    }
```

### Integrating New Data Sources

To add a new market data source:

1. Implement a connector in `data_retrival/`
2. Update the data retrieval service to use your connector
3. Add appropriate caching and error handling

## Troubleshooting

### Common Issues

1. **Redis Connection Error**
   - Verify Redis is running
   - Check Redis host and port configuration
   - Ensure proper authentication if required

2. **API Timeout**
   - Check external API status
   - Verify network connectivity
   - Review rate limiting constraints

3. **Formula Execution Failure**
   - Inspect error logs for details
   - Verify formula parameters
   - Check data availability for the specified timeframe

4. **Order Execution Issues**
   - Verify broker API credentials
   - Check account balance and trading permissions
   - Review error response from broker API

### Getting Help

For additional support:

1. Review the technical documentation in `docs/TECHNICAL.md`
2. Check the installation guide in `docs/INSTALLATION.md`
3. Contact the system administrator or development team