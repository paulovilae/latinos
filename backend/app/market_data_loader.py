from datetime import datetime, timezone
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import select
from .models import MarketData
from .market import _fetch_from_yahoo, _synthetic_series, MarketDataError

def sync_market_data(db: Session, symbol: str, interval: str = "1d", range_: str = "1y", use_synthetic: bool = False):
    """
    Fetches market data for a symbol and stores it in the database.
    """
    symbol = symbol.upper()
    
    if use_synthetic:
        # Generate synthetic data
        points = _synthetic_series(symbol, length=365) # Approx 1y
        currency = "USD"
    else:
        try:
            currency, points = _fetch_from_yahoo(symbol, interval, range_)
        except MarketDataError:
            print(f"Failed to fetch data for {symbol}, falling back to synthetic.")
            currency = "USD"
            points = _synthetic_series(symbol, length=365)

    # Upsert logic (simplistic: delete for range then insert, or merge)
    # For now, let's just add new points that don't exist.
    # Identifying duplicates by (symbol, interval, timestamp) is ideal.
    # But for a simple sync, let's just wipe and replace for the period if needed, 
    # or just insert missing.
    
    # Efficient approach: Fetch existing timestamps
    stmt = select(MarketData.timestamp).where(
        MarketData.symbol == symbol,
        MarketData.interval == interval
    )
    existing_timestamps = set(db.scalars(stmt).all())
    
    new_records = []
    for p in points:
        ts = p["timestamp"]
        # Ensure ts is timezone aware (UTC)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
            
        if ts not in existing_timestamps:
            record = MarketData(
                symbol=symbol,
                interval=interval,
                timestamp=ts,
                open=p.get("open", p["close"]),
                high=p.get("high", p["close"]),
                low=p.get("low", p["close"]),
                close=p["close"],
                volume=p.get("volume", 0)
            )
            new_records.append(record)
    
    if new_records:
        db.add_all(new_records)
        db.commit()
    
    return len(new_records)
