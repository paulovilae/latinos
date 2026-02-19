import sys, os
sys.path.insert(0, "/app")
os.environ.setdefault("YFINANCE_DISABLE", "1")

# Avoid importing yfinance-heavy modules
from app.db import SessionLocal
from sqlalchemy import text

db = SessionLocal()
rows = db.execute(text("SELECT id, type, payload FROM signals")).fetchall()
for r in rows:
    print(f"ID:{r[0]} | Type:{r[1]} | Payload:{r[2]}")
db.close()
