import sys
import os
import json

# Fix path
sys.path.append(os.getcwd())

from app.db import SessionLocal
from app.signals import BacktestEngine
from app.models import Signal

def debug_full_backtest():
    db = SessionLocal()
    print("--- STARTING FULL BACKTEST DEBUG ---")
    
    # 1. Create Dummy Signal (Always Buy)
    # Using python mode "True" or formula "close > 0"
    payload = {"code": "close > 0", "name": "Always True"}
    dummy = Signal(type="FORMULA", payload=payload, mode="simulation")
    db.add(dummy)
    db.commit()
    db.refresh(dummy)
    print(f"Created Dummy Signal ID: {dummy.id} with payload: {payload}")
    
    # 2. Run Engine
    engine = BacktestEngine(db)
    
    # Stack IDs should be list of ints? but engine expects list of str?
    # Based on models.py, id is Integer.
    # signals.py: filter(SignalModel.id.in_(stack_ids))
    # SQLAlchemy handles int/str conversion sometimes, but best be safe.
    stack_ids = [dummy.id] 
    
    print(f"Running backtest with stack_ids: {stack_ids}...")
    try:
        result = engine.run(
            stack_ids=stack_ids,
            symbol="AAPL",
            interval="1d",
            days=365,
            initial_capital=10000.0,
            take_profit=5.0,
            stop_loss=3.0
        )
        
        print("--- BACKTEST COMPLETED ---")
        print(f"Total Trades: {result.total_trades}")
        print(f"Win Rate: {result.win_rate}%")
        print(f"PnL: {result.pnl}")
        print(f"Equity Curve Points: {len(result.equity_curve)}")
        
        if result.history:
            print(f"Sample Trade: {result.history[0]}")
        else:
            print("No trades found!")
            
    except Exception as e:
        print(f"Backtest Failed: {e}")
        import traceback
        traceback.print_exc()
        
    # Cleanup
    db.delete(dummy)
    db.commit()
    db.close()

if __name__ == "__main__":
    debug_full_backtest()
