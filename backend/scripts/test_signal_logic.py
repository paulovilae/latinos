
import sys
import os
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path so we can import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.db import SQLALCHEMY_DATABASE_URL
from app.models import Signal, MarketData
from app.signals import SignalEvaluator

def test_signal(signal_id, symbol="AAPL", days=30):
    print(f"🧪 Testing Signal ID: {signal_id} on {symbol} ({days} days)...")
    
    # Setup DB
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Fetch Signal
        signal = db.query(Signal).filter(Signal.id == signal_id).first()
        if not signal:
            print(f"❌ Signal {signal_id} not found!")
            return

        print(f"   📋 Signal: {signal.name} (Type: {signal.type})")
        print(f"   📝 Payload: {signal.payload}")

        # Fetch Market Data
        print(f"   📊 Fetching market data for {symbol}...")
        # Simple fetch logic for now, assuming data exists or running sync if needed
        # For this script we'll just query existing data
        query = db.query(MarketData).filter(
            MarketData.symbol == symbol.upper(),
            MarketData.interval == "1d"
        ).order_by(MarketData.timestamp.desc()).limit(days)
        
        data = [{"open": d.open, "high": d.high, "low": d.low, "close": d.close, "volume": d.volume, "timestamp": d.timestamp} for d in query.all()]
        if not data:
            print(f"❌ No market data found for {symbol}. Run system sync first.")
            return
            
        # Reverse to chronological order
        data = data[::-1]
        df = pd.DataFrame(data)
        print(f"   ✅ Loaded {len(df)} candles.")

        # Evaluate
        evaluator = SignalEvaluator(signal, logs=[])
        
        print("\n--- Evaluation Results (Last 5 Candles) ---")
        for i in range(max(0, len(df)-5), len(df)):
            ts = df.iloc[i]["timestamp"]
            close = df.iloc[i]["close"]
            
            # Capture logs for this iteration
            evaluator.logs = [] 
            result = evaluator.evaluate(df, i, debug=True)
            
            res_str = "Unknown"
            if result is True: res_str = "🟢 TRUE (Buy)"
            elif result is False: res_str = "🔴 FALSE (Hold)"
            elif result is None: res_str = "⚠️ ERROR (None)"
            
            print(f"[{ts}] Close: {close:.2f} -> {res_str}")
            if result is None:
                print("   🔻 Debug Logs:")
                for log in evaluator.logs:
                    print(log)

    except Exception as e:
        print(f"💥 Critical Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_signal_logic.py <signal_id> [symbol] [days]")
        sys.exit(1)
    
    s_id = sys.argv[1]
    sym = sys.argv[2] if len(sys.argv) > 2 else "AAPL"
    d = int(sys.argv[3]) if len(sys.argv) > 3 else 30
    
    test_signal(s_id, sym, d)
