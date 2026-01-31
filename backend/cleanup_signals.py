
import sys
import os
from sqlalchemy import func

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal
from app import models

def cleanup_duplicates():
    db = SessionLocal()
    try:
        print("🧹 Starting signal cleanup...")
        
        # 1. Fetch all seeded/library signals (bot_id is None, or specific modes)
        # We target mode="simulation" delivery_status="seeded" as those are the ones from create_simulation_data.py
        # We also check for bots if needed, but user's list implies Library (orphans).
        
        signals = db.query(models.Signal).filter(
            models.Signal.mode == "simulation",
            models.Signal.delivery_status == "seeded"
        ).all()
        
        print(f"📋 Found {len(signals)} seeded signals.")
        
        # Group by name
        by_name = {}
        for s in signals:
            name = s.payload.get("name") if s.payload else "Unknown"
            if name not in by_name:
                by_name[name] = []
            by_name[name].append(s)
            
        # Delete duplicates
        deleted_count = 0
        for name, sigs in by_name.items():
            if len(sigs) > 1:
                print(f"⚠️ Found {len(sigs)} copies of '{name}'. Keeping 1, deleting {len(sigs)-1}.")
                # Sort by id desc (keep latest?) or asc (keep oldest?)
                # user sees many, usually want to keep one.
                # Let's keep the one with the lowest ID (oldest) to be stable?
                # Or highest (latest)? Latest might match latest logic if changed. 
                # Let's keep latest (highest ID).
                sigs.sort(key=lambda x: x.id, reverse=True)
                
                to_keep = sigs[0]
                to_delete = sigs[1:]
                
                for d in to_delete:
                    db.delete(d)
                    deleted_count += 1
        
        db.commit()
        print(f"✅ Cleanup complete. Deleted {deleted_count} duplicate signals.")
        
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_duplicates()
