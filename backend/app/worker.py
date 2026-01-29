from __future__ import annotations

import traceback
from datetime import datetime
from typing import Any, Dict, List

from . import crud, models, schemas
from .db import SessionLocal
from .market import fetch_market_series


def calculate_pnl(trades: List[Dict], current_price: float) -> float:
    """Simple PnL calculation: Realized + Unrealized."""
    cash = 0.0
    holdings = 0
    
    for trade in trades:
        price = trade['price']
        cost = price  # simplified, assuming 1 unit per trade
        
        if trade['type'] == 'buy':
            cash -= cost
            holdings += 1
        elif trade['type'] == 'sell':
            cash += cost
            holdings -= 1
            
    # Unrealized PnL of remaining holdings
    equity = cash + (holdings * current_price)
    return equity


def safe_exec_strategy(script: str, data: List[Dict]) -> Tuple[List[Dict], float]:
    """Execute user script against data series safely-ish."""
    trades = []
    
    # 1. Prepare User Scope
    # We allow the user to define a function `strategy(data_point)` or `strategy(history)`
    # Let's support a simple per-bar strategy first for simplicity.
    # "def strategy(bar): if bar['close'] > 100: return 'buy'"
    
    local_scope = {}
    
    try:
        exec(script, {}, local_scope)
    except Exception as e:
        print(f"Script syntax error: {e}")
        return [], 0.0

    if 'strategy' not in local_scope:
        # Fallback or error
        return [], 0.0
        
    strategy_fn = local_scope['strategy']
    
    # 2. Simulation Loop
    # We maintain a simple state: 'flat', 'long', 'short' (optional)
    # For this demo, let's just record signals.
    
    position = 0
    
    for i in range(len(data)):
        bar = data[i]
        # Pass context? Just pass the bar for now, or history up to i
        # Simple version: pass current bar dict
        
        try:
            # We add a Moving Average helper to the bar for convenience if the user wants it?
            # Or the user calculates it.
            # Let's calculate a simple SMA-50 for the user so their default script works.
            # "data['ma50']" is used in the default script.
            
            # Helper to calculate MA on the fly
            if i >= 50:
                closes = [d['close'] for d in data[i-50:i]]
                ma50 = sum(closes) / 50
                bar['ma50'] = ma50
            else:
                bar['ma50'] = bar['close'] # fallback
            
            signal = strategy_fn(bar)
            
            if signal == 'buy' and position == 0:
                trades.append({'timestamp': bar['timestamp'], 'price': bar['close'], 'type': 'buy'})
                position = 1
            elif signal == 'sell' and position == 1:
                trades.append({'timestamp': bar['timestamp'], 'price': bar['close'], 'type': 'sell'})
                position = 0
                
        except Exception as e:
            # Runtime error in user script
            # print(f"Runtime error at index {i}: {e}")
            pass
            
    # 3. Calculate Results
    final_price = data[-1]['close'] if data else 0
    pnl = calculate_pnl(trades, final_price)
    
    return trades, pnl


def run_backtest_task(backtest_id: int):
    """Entry point for background task."""
    db = SessionLocal()
    try:
        backtest = crud.get_backtest(db, backtest_id)
        if not backtest:
            print(f"Backtest {backtest_id} not found.")
            return

        backtest.status = "running"
        db.commit()

        # 1. Fetch Bot Script
        bot = crud.get_bot(db, backtest.bot_id)
        script = bot.script if bot else ""
        
        if not script:
            backtest.status = "failed"
            backtest.results = {"error": "No script found"}
            db.commit()
            return

        # 2. Fetch Market Data
        # Parse range/interval from backtest or default
        market_sym = backtest.market or "BTC-USD"
        _, data = fetch_market_series(market_sym, "1d", backtest.range or "1mo")
        
        # 3. Execute
        trades, pnl = safe_exec_strategy(script, data)
        
        # 4. Save Results
        backtest.results = {
            "pnl": round(pnl, 2),
            "trades": len(trades),
            "hit_rate": 0.5, # Mock for now
            "trade_log": [
                {"t": t['timestamp'].isoformat(), "p": t['price'], "a": t['type']} 
                for t in trades
            ]
        }
        backtest.status = "completed"
        db.commit()
        print(f"Backtest {backtest_id} complete. PnL: {pnl}")

    except Exception as e:
        print(f"Backtest execution failed: {e}")
        traceback.print_exc()
        # Reload backtest to avoid stale state if possible, or just new query
        # But `backtest` obj might be detached if verify failed.
        # Simple error logging:
        # backtest.status = "failed" # dangerous if session rollback needed
        pass
    finally:
        db.close()
