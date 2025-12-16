"""
Market Data Service - Real-time and historical market data
"""

import asyncio
from typing import Dict, Any, List, AsyncGenerator
from datetime import datetime, timedelta
import random
from loguru import logger


class MarketDataService:
    """Market data service for real-time and historical data"""
    
    def __init__(self):
        self.connected = False
        self.feed_task = None
        self.subscribers = {}
    
    def is_ready(self) -> bool:
        """Check if market data service is ready"""
        return self.connected
    
    def is_connected(self) -> bool:
        """Check if connected to market data feed"""
        return self.connected
    
    async def start_real_time_feed(self):
        """Start real-time market data feed"""
        logger.info("📈 Starting real-time market data feed...")
        self.connected = True
        self.feed_task = asyncio.create_task(self._simulate_market_feed())
    
    async def _simulate_market_feed(self):
        """Simulate real-time market data"""
        while self.connected:
            try:
                # Simulate market data updates
                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Market feed error: {e}")
                await asyncio.sleep(5)
    
    async def get_historical_data(self, symbol: str, timeframe: str, limit: int) -> Dict[str, Any]:
        """Get historical market data"""
        # Simulate historical data
        data = []
        base_price = 100.0
        
        for i in range(limit):
            timestamp = datetime.now() - timedelta(hours=i)
            price = base_price + random.uniform(-5, 5)
            data.append({
                "timestamp": timestamp.isoformat(),
                "open": price,
                "high": price + random.uniform(0, 2),
                "low": price - random.uniform(0, 2),
                "close": price + random.uniform(-1, 1),
                "volume": random.randint(1000, 10000)
            })
        
        return {
            "symbol": symbol,
            "timeframe": timeframe,
            "data": data[::-1]  # Reverse to get chronological order
        }
    
    async def get_latest_data(self, symbol: str) -> Dict[str, Any]:
        """Get latest market data for symbol"""
        return {
            "symbol": symbol,
            "price": 100.0 + random.uniform(-10, 10),
            "change": random.uniform(-5, 5),
            "volume": random.randint(10000, 100000),
            "timestamp": datetime.now().isoformat(),
            "technical_indicators": {
                "rsi": random.uniform(20, 80),
                "macd": random.uniform(-2, 2),
                "sma_20": 100.0 + random.uniform(-5, 5),
                "sma_50": 100.0 + random.uniform(-8, 8)
            }
        }
    
    async def stream_market_data(self, symbol: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Stream real-time market data for symbol"""
        while self.connected:
            try:
                data = await self.get_latest_data(symbol)
                yield data
                await asyncio.sleep(1)  # Update every second
            except Exception as e:
                logger.error(f"Market stream error for {symbol}: {e}")
                await asyncio.sleep(5)
    
    async def stop_real_time_feed(self):
        """Stop real-time market data feed"""
        logger.info("🛑 Stopping market data feed...")
        self.connected = False
        if self.feed_task:
            self.feed_task.cancel()