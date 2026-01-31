
import sys
import os
from sqlalchemy import func

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal
from app import models

def inspect_aggressive():
    db = SessionLocal()
    try:
        print("🔍 Aggressive Signal Inspection (By Name Only)...")
        
        # Fetch ALL signals
        signals = db.query(models.Signal).all()
        
        by_name = {}
        for s in signals:
            name = s.payload.get("name") if s.payload else "Unknown"
            if name not in by_name:
                by_name[name] = []
            by_name[name].append(s)
            
        print(f"{'Count':<5} | {'Name':<40} | {'Modes Found':<30}")
        print("-" * 80)
        
        duplicate_count = 0
        for name, sigs in sorted(by_name.items(), key=lambda x: len(x[1]), reverse=True):
            if len(sigs) > 1:
                duplicate_count += len(sigs) - 1
                modes = set(s.mode for s in sigs)
                print(f"{len(sigs):<5} | {name[:40]:<40} | {str(list(modes))[:30]:<30}")
        
        print("-" * 80)
        print(f"⚠️ Total potentially redundant signals: {duplicate_count}")

    finally:
        db.close()

if __name__ == "__main__":
    inspect_aggressive()
