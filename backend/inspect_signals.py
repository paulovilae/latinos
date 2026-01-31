
import sys
import os
from sqlalchemy import func

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal
from app import models

def inspect_signals():
    db = SessionLocal()
    try:
        print("🔍 Inspecting Signal Distribution...")
        
        # Group by name, mode, status, bot_id
        signals = db.query(models.Signal).all()
        
        counts = {}
        for s in signals:
            name = s.payload.get("name") if s.payload else "Unknown"
            key = (name, s.mode, s.delivery_status, s.bot_id)
            counts[key] = counts.get(key, 0) + 1
            
        print(f"{'Count':<5} | {'Name':<30} | {'Mode':<10} | {'Status':<10} | {'BotID':<5}")
        print("-" * 75)
        
        for (name, mode, status, bot_id), count in sorted(counts.items(), key=lambda x: x[1], reverse=True):
            if count > 1:
                print(f"{count:<5} | {name[:30]:<30} | {mode:<10} | {status:<10} | {str(bot_id):<5}")
        
    finally:
        db.close()

if __name__ == "__main__":
    inspect_signals()
