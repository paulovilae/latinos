import sys
import os
import json
import random

# Add backend to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal, engine
from app.models import Signal, Bot
from sqlalchemy.orm import Session
from sqlalchemy import text

def migrate_db_columns():
    print("🛠️ Checking DB Schema...")
    with engine.connect() as conn:
        conn.commit() # Ensure clean transaction
        # Check 'tags'
        try:
            conn.execute(text("SELECT tags FROM bots LIMIT 1"))
        except Exception:
            print("   ⚠️ Column 'tags' missing in 'bots'. Adding it...")
            # Detect DB type - assuming standard SQL or Postgres
            try:
                conn.rollback()
                conn.execute(text("ALTER TABLE bots ADD COLUMN tags JSON DEFAULT '[]'"))
                conn.commit()
                print("   ✅ Column 'tags' added.")
            except Exception as e:
                print(f"   ❌ Failed to add 'tags': {e}")
        
        # Check 'signal_manifest'
        try:
             conn.execute(text("SELECT signal_manifest FROM bots LIMIT 1"))
        except Exception:
             print("   ⚠️ Column 'signal_manifest' missing in 'bots'. Adding it...")
             try:
                 conn.rollback()
                 conn.execute(text("ALTER TABLE bots ADD COLUMN signal_manifest JSON DEFAULT '[]'"))
                 conn.commit()
                 print("   ✅ Column 'signal_manifest' added.")
             except Exception as e:
                 print(f"   ❌ Failed to add 'signal_manifest': {e}")

def seed_pro():
    migrate_db_columns()
    print("🚀 Starting Pro Content Seeding...")
    db = SessionLocal()
    
    # --- 1. Define Pro Signals ---
    # Each has name, code (python/pandas), description (with info), and tags
    pro_signals = [
        {
            "name": "RSI Bullish Divergence",
            "type": "buy",
            "description": "Strong Reversal Signal. Occurs when price makes a lower low but RSI makes a higher low. \n\n📚 Source: https://www.investopedia.com/terms/d/divergence.asp",
            "code": "rsi = ta.rsi(data['close'], 14)\nif data['close'].iloc[idx] < data['close'].iloc[idx-5] and rsi.iloc[idx] > rsi.iloc[idx-5]:\n    result = True"
        },
        {
            "name": "RSI Bearish Divergence",
            "type": "sell",
            "description": "Strong Reversal Signal. Occurs when price makes a higher high but RSI makes a lower high. \n\n📚 Source: https://www.investopedia.com/terms/d/divergence.asp",
            "code": "rsi = ta.rsi(data['close'], 14)\nif data['close'].iloc[idx] > data['close'].iloc[idx-5] and rsi.iloc[idx] < rsi.iloc[idx-5]:\n    result = True"
        },
        {
            "name": "Golden Cross (SMA 50/200)",
            "type": "buy",
            "description": "Long-term bullish trend confirm. SMA 50 crosses ABOVE SMA 200. Used by institutional investors. \n\n📚 Info: https://www.investopedia.com/terms/g/goldencross.asp",
            "code": "sma50 = ta.sma(data['close'], 50)\nsma200 = ta.sma(data['close'], 200)\nif sma50.iloc[idx] > sma200.iloc[idx] and sma50.iloc[idx-1] <= sma200.iloc[idx-1]:\n    result = True"
        },
        {
            "name": "Death Cross (SMA 50/200)",
            "type": "sell",
            "description": "Long-term bearish market warning. SMA 50 crosses BELOW SMA 200. \n\n📚 Info: https://www.investopedia.com/terms/d/deathcross.asp",
            "code": "sma50 = ta.sma(data['close'], 50)\nsma200 = ta.sma(data['close'], 200)\nif sma50.iloc[idx] < sma200.iloc[idx] and sma50.iloc[idx-1] >= sma200.iloc[idx-1]:\n    result = True"
        },
        {
            "name": "Bollinger Squeeze Breakout",
            "type": "buy",
            "description": "Volatility Play. Buying when bands narrow (squeeze) and price breaks upward. \n\n📚 Strategy: https://school.stockcharts.com/doku.php?id=trading_strategies:bollinger_band_squeeze",
            "code": "bb = ta.bbands(data['close'], 20)\nbandwidth = (bb['upper'] - bb['lower']) / bb['mid']\nif bandwidth.iloc[idx] < 0.10 and data['close'].iloc[idx] > bb['upper'].iloc[idx]:\n    result = True"
        },
         {
            "name": "MACD Histogram Reversal",
            "type": "buy",
            "description": "Early Momentum Entry. Histogram ticks up while still negative (aggressive entry before the zero cross).",
            "code": "macd = ta.macd(data['close'])\nhist = macd['histogram']\nif hist.iloc[idx] > hist.iloc[idx-1] and hist.iloc[idx] < 0:\n    result = True"
        },
        {
            "name": "Supertrend Bullish Flip",
            "type": "buy",
            "description": "Trend Following. Price closes above the Supertrend line (ATR trailing stop). Excellent for crypto trends.",
            "code": "st = ta.supertrend(data['high'], data['low'], data['close'], 10, 3)\nif data['close'].iloc[idx] > st['supertrend'].iloc[idx] and data['close'].iloc[idx-1] <= st['supertrend'].iloc[idx-1]:\n    result = True"
        },
        {
            "name": "VWAP Crossover (Intraday)",
            "type": "buy",
            "description": "Institutional Volume. Price crosses above Volume Weighted Average Price. Valid mainly for intraday timeframes.",
            "code": "vwap = ta.vwap(data['high'], data['low'], data['close'], data['volume'])\nif data['close'].iloc[idx] > vwap.iloc[idx] and data['close'].iloc[idx-1] <= vwap.iloc[idx-1]:\n    result = True"
        },
        {
            "name": "Ichimoku Cloud Breakout",
            "type": "buy",
            "description": "Cloud Trading. Price closes above the Kumo (Cloud). Indicates strong established trend.",
            "code": "ichi = ta.ichimoku(data['high'], data['low'], data['close'])\nif data['close'].iloc[idx] > ichi['spanA'].iloc[idx] and data['close'].iloc[idx] > ichi['spanB'].iloc[idx]:\n    result = True"
        },
        {
            "name": "Hammer Candle Pattern",
            "type": "buy",
            "description": "Candlestick Pattern. Bullish reversal at bottom of downtrend. Long lower wick.",
            "code": "# Simplified Hammer logic (body in upper 30% of range, long lower shadow)\nbody = abs(data['close'] - data['open'])\nrange_len = data['high'] - data['low']\nif body < 0.3 * range_len and (min(data['close'].iloc[idx], data['open'].iloc[idx]) - data['low'].iloc[idx]) > 0.6 * range_len:\n    result = True"
        },
        {
             "name": "Williams %R Oversold",
             "type": "buy",
             "description": "Momentum Oscillator. Similar to Stochastic but more sensitive. Buy when < -80.",
             "code": "wr = ta.willr(data['high'], data['low'], data['close'])\nif wr.iloc[idx] < -80:\n    result = True"
        },
        {
            "name": "EMA 9/21 Crossover",
            "type": "buy",
            "description": "Short Term Trend. Fast EMA 9 crosses above EMA 21. Creating for swing trades.",
            "code": "ema9 = ta.ema(data['close'], 9)\nema21 = ta.ema(data['close'], 21)\nif ema9.iloc[idx] > ema21.iloc[idx] and ema9.iloc[idx-1] <= ema21.iloc[idx-1]:\n    result = True"
        }
    ]
    
    # Store IDs for Robot creation
    signal_map = {} # name -> id
    
    print(f"   Creating {len(pro_signals)} Pro Signals...")
    for s in pro_signals:
        # Check if exists
        exists = db.query(Signal).filter(Signal.delivery_status == 'active').all()
        # Filter in python to match name inside json payload
        found = None
        for es in exists:
            try:
                p = es.payload if isinstance(es.payload, dict) else json.loads(es.payload)
                if p.get("name") == s["name"]:
                    found = es
                    break
            except: pass
        
        if found:
            print(f"      🔹 Exists: {s['name']}")
            signal_map[s["name"]] = found.id
        else:
            new_sig = Signal(
                type=s["type"],
                payload={"name": s["name"], "code": s["code"], "description": s["description"]},
                mode="simulation",
                delivery_status="active",
                emitted_at="2024-01-01" # needed for schema
            )
            db.add(new_sig)
            db.commit()
            db.refresh(new_sig)
            print(f"      ✅ Created: {s['name']}")
            signal_map[s["name"]] = new_sig.id

    # --- 2. Define Pro Robots ---
    pro_robots = [
        {
            "name": "🦅 Alpha Trend Follower",
            "description": "Classic trend following strategy. Uses 'Golden Cross' for direction and 'Supertrend' for entry timing. Holds for big moves.",
            "tags": ["Conservative", "Long-Term", "Trend"],
            "signals": ["Golden Cross (SMA 50/200)", "Supertrend Bullish Flip"]
        },
        {
            "name": "⚡ Velocity Scalper",
            "description": "Aggressive scalping bot. Enters on 'Bollinger Squeeze Breakouts' backed by 'EMA 9/21' momentum. Tight stops recommended.",
            "tags": ["Aggressive", "Scalping", "High Frequency"],
            "signals": ["Bollinger Squeeze Breakout", "EMA 9/21 Crossover", "RSI Bullish Divergence"]
        },
        {
            "name": "🧘 Zen Mean Reversion",
            "description": "Buys the dip in established trends. Waits for 'RSI Oversold' (from your standard list) or 'Hammer Candle' patterns while filtered by 'Ichimoku Cloud'.",
            "tags": ["Moderate", "Swing", "Dip Buyer"],
            "signals": ["RSI Bullish Divergence", "Hammer Candle Pattern", "Ichimoku Cloud Breakout"]
        },
        {
            "name": "🐳 Whale Hunter",
            "description": "Detects institutional accumulation. Uses 'VWAP Crossover' and 'MACD Histogram Reversal' to spot where big money is entering.",
            "tags": ["Volume", "Institutional", "Day Trading"],
            "signals": ["VWAP Crossover (Intraday)", "MACD Histogram Reversal"]
        }
    ]

    print(f"\n   Creating {len(pro_robots)} Pro Robots...")
    
    # Get Admin User ID (assuming 1)
    admin_id = 1
    
    for r in pro_robots:
        # Check if exists
        existing_bot = db.query(Bot).filter(Bot.name == r["name"]).first()
        
        # Build Manifest
        manifest = []
        for sig_name in r["signals"]:
            if sig_name in signal_map:
                manifest.append(signal_map[sig_name])
            else:
                print(f"      ⚠️ Warning: Signal '{sig_name}' not found for robot '{r['name']}'")
        
        if existing_bot:
             print(f"      🔹 Updating Exists: {r['name']}")
             existing_bot.description = r["description"]
             existing_bot.tags = r["tags"]
             existing_bot.signal_manifest = manifest
             db.commit()
        else:
            new_bot = Bot(
                name=r["name"],
                description=r["description"],
                status="draft",
                owner_id=admin_id,
                tags=r["tags"],
                signal_manifest=manifest
            )
            db.add(new_bot)
            db.commit()
            print(f"      ✅ Created: {r['name']}")

    print("\n✅ Pro Content Seeding Complete! Enjoy your new factory.")
    db.close()

if __name__ == "__main__":
    seed_pro()
