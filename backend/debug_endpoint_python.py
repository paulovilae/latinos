
import sys
import os
sys.path.append("/app")

from app.db import SessionLocal
from app.routers.signals import test_signal_logic
from app import schemas, models

# Create DB Session
db = SessionLocal()

try:
    # Get first user (mock auth)
    user = db.query(models.User).first()
    if not user:
        print("No users found!")
        sys.exit(1)
        
    print(f"Testing as user: {user.email}")
    
    # Get first signal
    signal = db.query(models.Signal).first()
    if not signal:
        print("No signals found!")
        sys.exit(1)
        
    print(f"Testing Signal ID: {signal.id}")

    # Create Request
    req = schemas.SignalTestRequest(symbol='AAPL', days=5)
    
    # Call function directly
    print("Calling test_signal_logic...")
    res = test_signal_logic(signal.id, req, db, user)
    
    print("\n--- RESULT ---")
    print(f"Total Candles: {res.total_candles}")
    print(f"First Result: {res.results[0] if res.results else 'None'}")
    
except Exception as e:
    print("\nXXX EXCEPTION XXX")
    import traceback
    traceback.print_exc()
finally:
    db.close()
