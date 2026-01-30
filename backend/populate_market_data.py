"""
Populates market_data table with historical data from Yahoo Finance.
Also creates a sample signal stack.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

from app.db import SessionLocal
from app.models import MarketData, Signal, Bot

def populate_market_data(symbol: str = "AAPL", interval: str = "1d", period: str = "1y"):
    """Fetches historical data from Yahoo Finance and inserts into DB."""
    db = SessionLocal()
    
    print(f"Fetching {period} of {symbol} data ({interval})...")
    
    # Fetch data using yfinance
    ticker = yf.Ticker(symbol)
    df = ticker.history(period=period, interval=interval)
    
    if df.empty:
        print("No data returned from Yahoo Finance!")
        return
    
    print(f"Got {len(df)} candles. Inserting into database...")
    
    # Check for existing data to avoid duplicates
    existing = db.query(MarketData).filter(
        MarketData.symbol == symbol.upper(),
        MarketData.interval == interval
    ).first()
    
    if existing:
        print(f"Data already exists for {symbol}/{interval}. Clearing old data...")
        db.query(MarketData).filter(
            MarketData.symbol == symbol.upper(),
            MarketData.interval == interval
        ).delete()
        db.commit()
    
    # Insert new data
    records = []
    for timestamp, row in df.iterrows():
        record = MarketData(
            symbol=symbol.upper(),
            interval=interval,
            timestamp=timestamp.to_pydatetime(),
            open=float(row["Open"]),
            high=float(row["High"]),
            low=float(row["Low"]),
            close=float(row["Close"]),
            volume=float(row["Volume"])
        )
        records.append(record)
    
    db.add_all(records)
    db.commit()
    print(f"Inserted {len(records)} candles for {symbol}.")
    db.close()

def create_sample_stack():
    """Creates a sample signal stack using existing signals."""
    db = SessionLocal()
    
    # Find the "Standard Library" bot
    library_bot = db.query(Bot).filter(Bot.name == "Standard Library").first()
    if not library_bot:
        print("Standard Library bot not found! Run create_standard_signals.py first.")
        return
    
    # Get all signals for this bot
    signals = db.query(Signal).filter(Signal.bot_id == library_bot.id).all()
    
    if not signals:
        print("No signals found in Standard Library!")
        return
    
    # Print available signals
    print("\nAvailable signals:")
    for sig in signals:
        name = sig.payload.get("name", f"Signal #{sig.id}")
        print(f"  - ID {sig.id}: {name}")
    
    # Create a sample stack by picking the first 3 signals
    # (RSI Oversold, RSI Overbought, Golden Cross)
    sample_stack = signals[:3]
    
    print(f"\nSample stack created with {len(sample_stack)} signals:")
    for sig in sample_stack:
        print(f"  → {sig.payload.get('name', sig.id)}")
    
    print("\nNote: Stacks are built dynamically in the UI. You can add signals by clicking them in the Signal Studio.")
    db.close()

if __name__ == "__main__":
    # 1. Populate market data
    populate_market_data("AAPL", "1d", "1y")
    populate_market_data("BTC-USD", "1d", "1y")
    
    # 2. Show sample stack
    create_sample_stack()
    
    print("\n✅ Done! You can now run backtests in the Signal Studio.")
