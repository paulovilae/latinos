import sys
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Fix path
sys.path.append(os.getcwd())

from app.db import SessionLocal
from app.market_data_loader import sync_market_data
from app.models import MarketData

def test_market():
    db = SessionLocal()
    print("Testing sync_market_data for AAPL...")
    try:
        count = sync_market_data(db, "AAPL", "1d", "1y", use_synthetic=False)
        print(f"Synced {count} records.")
    except Exception as e:
        print(f"Error syncing: {e}")
        import traceback
        traceback.print_exc()

    print("Querying DB...")
    query = db.query(MarketData).filter(MarketData.symbol == "AAPL").all()
    print(f"Found {len(query)} records in DB.")
    if query:
        print(f"Sample: {query[0].timestamp} - {query[0].close}")
    
    db.close()

if __name__ == "__main__":
    test_market()
