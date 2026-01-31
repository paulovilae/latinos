
import sys
import os
from sqlalchemy import func

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal
from app import models

def cleanup_aggressive():
    db = SessionLocal()
    try:
        print("🧹 Starting AGGRESSIVE signal cleanup...")
        
        # Fetch ALL signals
        signals = db.query(models.Signal).all()
        
        by_name = {}
        for s in signals:
            name = s.payload.get("name") if s.payload else "Unknown"
            if name not in by_name:
                by_name[name] = []
            by_name[name].append(s)
            
        deleted_count = 0
        for name, sigs in by_name.items():
            if len(sigs) > 1:
                # Sort by ID descending (Highest ID = Latest)
                # We KEEP the LATEST one. 
                # Why? Because latest might have fix or updated timestamp.
                sigs.sort(key=lambda x: x.id, reverse=True)
                
                to_keep = sigs[0]
                to_delete = sigs[1:]
                
                print(f"🔹 '{name}': Found {len(sigs)}. Keeping ID {to_keep.id}, deleting {len(to_delete)} others.")
                
                for d in to_delete:
                    db.delete(d)
                    deleted_count += 1
        
        db.commit()
        print(f"✅ Aggressive cleanup complete. Deleted {deleted_count} duplicate signals.")
        
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_aggressive()
