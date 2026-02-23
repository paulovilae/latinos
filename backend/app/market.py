from __future__ import annotations

import json
import logging
import yfinance as yf
from datetime import datetime, timezone
from typing import List, Tuple
import pandas as pd
import random

# Cache for market data (30 seconds TTL)
from cachetools import TTLCache
_market_cache = TTLCache(maxsize=50, ttl=30)

MARKET_UNIVERSE = [
    {"symbol": "AAPL", "name": "Apple Inc.", "sector": "Technology"},
    {"symbol": "MSFT", "name": "Microsoft Corp.", "sector": "Technology"},
    {"symbol": "NVDA", "name": "NVIDIA Corp.", "sector": "Semiconductors"},
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Discretionary"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "sector": "Communication Services"},
    {"symbol": "TSLA", "name": "Tesla Inc.", "sector": "Consumer Discretionary"},
    {"symbol": "META", "name": "Meta Platforms Inc.", "sector": "Communication Services"},
]

class MarketDataError(Exception):
    pass

def fetch_market_series(symbol: str, interval: str, range_: str) -> Tuple[str | None, List[dict]]:
    """Attempt Yahoo! Finance via yfinance library first, fall back to synthetic data."""
    cache_key = f"{symbol}:{interval}:{range_}"
    
    if cache_key in _market_cache:
        return _market_cache[cache_key]
    
    try:
        currency, points = _fetch_from_yahoo(symbol, interval, range_)
        result = (currency, points)
    except MarketDataError as e:
        print(f"Market fetch failed: {e}. Using synthetic data.")
        result = ("USD", _synthetic_series(symbol, length=365))
    
    _market_cache[cache_key] = result
    return result

def _fetch_from_yahoo(symbol: str, interval: str, range_: str) -> Tuple[str | None, List[dict]]:
    """
    Fetches real market data using yfinance library.
    """
    try:
        print(f"DEBUG: Downloading {symbol} from yfinance (period={range_}, interval={interval})...")
        ticker = yf.Ticker(symbol)
        
        # Determine period based on range_ string (e.g. "1y", "1mo")
        # yfinance supports: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max
        history = ticker.history(period=range_, interval=interval)
        
        if history.empty:
            raise MarketDataError(f"No data found for {symbol}")
            
        currency = ticker.info.get("currency", "USD")
        
        # Convert to list of dicts
        points = []
        for index, row in history.iterrows():
            # index is DatetimeIndex usually
            ts = index.to_pydatetime()
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
            
            points.append({
                "timestamp": ts,
                "open": float(row["Open"]),
                "high": float(row["High"]),
                "low": float(row["Low"]),
                "close": float(row["Close"]),
                "volume": int(row["Volume"])
            })
            
        print(f"DEBUG: Successfully fetched {len(points)} points from yfinance")
        return currency, points
        
    except Exception as e:
        print(f"DEBUG: yfinance Error: {e}")
        raise MarketDataError(str(e)) from e

def _synthetic_series(symbol: str, length: int = 365) -> List[dict]:
    """Generates synthetic price data with OHLCV structure."""
    base_price = 150.0
    prices = []
    current = base_price
    
    # Start from now backwards
    now = datetime.now(timezone.utc)
    
    for i in range(length):
        # Go backwards from today
        ts = now - pd.Timedelta(days=(length - i))
        
        change = random.uniform(-0.02, 0.02)
        current = current * (1 + change)
        
        high_change = random.uniform(0, 0.01)
        low_change = random.uniform(0, 0.01)
        
        prices.append({
            "timestamp": ts,
            "open": round(current * (1 - random.uniform(0, 0.005)), 2),
            "high": round(current * (1 + high_change), 2),
            "low": round(current * (1 - low_change), 2),
            "close": round(current, 2),
            "volume": int(random.uniform(1000000, 5000000))
        })
    
    return prices
