"""
Market Data Cleanup & Download Script
1. Removes duplicate rows from MarketData table
2. Downloads 2 years of historical data for key symbols
"""
import sys
sys.path.insert(0, "/app")

from app.db import SessionLocal
from app.models import MarketData
from app.market_data_loader import sync_market_data
from sqlalchemy import func, text

db = SessionLocal()

# ============================================
# STEP 1: Count and Remove Duplicates
# ============================================
print("=" * 50)
print("STEP 1: Cleaning duplicate MarketData rows")
print("=" * 50)

# Find duplicates (same symbol + interval + timestamp)
dupes_query = db.query(
    MarketData.symbol,
    MarketData.interval,
    MarketData.timestamp,
    func.count(MarketData.id).label("cnt"),
    func.min(MarketData.id).label("keep_id")
).group_by(
    MarketData.symbol,
    MarketData.interval,
    MarketData.timestamp
).having(func.count(MarketData.id) > 1)

dupes = dupes_query.all()
print(f"Found {len(dupes)} duplicate groups")

total_deleted = 0
for dupe in dupes:
    # Delete all but the oldest (min id) for each group
    deleted = db.query(MarketData).filter(
        MarketData.symbol == dupe.symbol,
        MarketData.interval == dupe.interval,
        MarketData.timestamp == dupe.timestamp,
        MarketData.id != dupe.keep_id
    ).delete(synchronize_session=False)
    total_deleted += deleted

db.commit()
print(f"🗑️  Deleted {total_deleted} duplicate rows")

# ============================================
# STEP 2: Download 2 Years of Data
# ============================================
print("\n" + "=" * 50)
print("STEP 2: Downloading 2 years of historical data")
print("=" * 50)

symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "SPY", "QQQ", "META", "NVDA"]

for sym in symbols:
    try:
        new_count = sync_market_data(db, sym, "1d", range_="2y", use_synthetic=False)
        total = db.query(func.count(MarketData.id)).filter(
            MarketData.symbol == sym,
            MarketData.interval == "1d"
        ).scalar()
        print(f"  ✅ {sym}: {new_count} new rows added (total: {total})")
    except Exception as e:
        print(f"  ❌ {sym}: {e}")

# ============================================
# STEP 3: Final Stats
# ============================================
print("\n" + "=" * 50)
print("STEP 3: Final Database Stats")
print("=" * 50)

stats = db.query(
    MarketData.symbol,
    func.count(MarketData.id).label("rows"),
    func.min(MarketData.timestamp).label("oldest"),
    func.max(MarketData.timestamp).label("newest")
).group_by(MarketData.symbol).all()

for s in stats:
    print(f"  {s.symbol}: {s.rows} rows | {s.oldest} -> {s.newest}")

db.close()
print("\n✅ Done!")
