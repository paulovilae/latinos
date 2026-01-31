import sys
import os
import json
import sqlite3
from datetime import datetime

# Standalone script that writes directly to users.db to avoid ENV confusion
DB_FILE = "users.db"

def seed_sqlite_pro():
    print(f"🚀 Starting Pro Content Seeding (Target: {DB_FILE})...")
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # --- 0. Migrate Schema (Ensure columns exist) ---
    print("🛠️ Checking DB Schema...")
    try:
        cursor.execute("SELECT tags FROM bots LIMIT 1")
    except sqlite3.OperationalError:
        print("   ⚠️ Column 'tags' missing in 'bots'. Adding it...")
        try:
             cursor.execute("ALTER TABLE bots ADD COLUMN tags JSON DEFAULT '[]'")
             print("   ✅ Column 'tags' added.")
        except Exception as e:
             print(f"   ❌ Failed to add 'tags': {e}")

    try:
        cursor.execute("SELECT signal_manifest FROM bots LIMIT 1")
    except sqlite3.OperationalError:
        print("   ⚠️ Column 'signal_manifest' missing in 'bots'. Adding it...")
        try:
             cursor.execute("ALTER TABLE bots ADD COLUMN signal_manifest JSON DEFAULT '[]'")
             print("   ✅ Column 'signal_manifest' added.")
        except Exception as e:
             print(f"   ❌ Failed to add 'signal_manifest': {e}")
    conn.commit()

    # --- 1. Define Pro Signals ---
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
            "code": "# Simplified Hammer logic\nbody = abs(data['close'] - data['open'])\nrange_len = data['high'] - data['low']\nif body < 0.3 * range_len and (min(data['close'].iloc[idx], data['open'].iloc[idx]) - data['low'].iloc[idx]) > 0.6 * range_len:\n    result = True"
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
    
    signal_map = {} # name -> id
    
    print(f"   Creating {len(pro_signals)} Pro Signals...")
    for s in pro_signals:
        # Check exists in DB (parse payload)
        cursor.execute("SELECT id, payload FROM signals WHERE type = ?", (s['type'],))
        candidates = cursor.fetchall()
        
        found_id = None
        for cand in candidates:
             try:
                 p = json.loads(cand['payload']) if isinstance(cand['payload'], str) else cand['payload']
                 if p.get("name") == s["name"]:
                     found_id = cand['id']
                     break
             except: pass
        
        if found_id:
            print(f"      🔹 Exists: {s['name']}")
            # Force status to active just in case
            cursor.execute("UPDATE signals SET delivery_status = 'active' WHERE id = ?", (found_id,))
            signal_map[s["name"]] = found_id
        else:
            payload_str = json.dumps({"name": s["name"], "code": s["code"], "description": s["description"]})
            cursor.execute(
                "INSERT INTO signals (type, payload, mode, delivery_status, emitted_at) VALUES (?, ?, ?, ?, ?)",
                (s["type"], payload_str, "simulation", "active", "2024-01-01")
            )
            signal_map[s["name"]] = cursor.lastrowid
            print(f"      ✅ Created: {s['name']}")
    
    conn.commit()

    # --- 2. Define Pro Robots ---
    pro_robots = [
         {
            "name": "🦅 Alpha Trend Follower",
            "description": "Classic trend following strategy. Uses 'Golden Cross' for direction and 'Supertrend' for entry timing. Holds for big moves.",
            "tags": json.dumps(["Conservative", "Long-Term", "Trend"]),
            "signals": ["Golden Cross (SMA 50/200)", "Supertrend Bullish Flip"]
        },
        {
            "name": "⚡ Velocity Scalper",
            "description": "Aggressive scalping bot. Enters on 'Bollinger Squeeze Breakouts' backed by 'EMA 9/21' momentum. Tight stops recommended.",
            "tags": json.dumps(["Aggressive", "Scalping", "High Frequency"]),
            "signals": ["Bollinger Squeeze Breakout", "EMA 9/21 Crossover", "RSI Bullish Divergence"]
        },
        {
            "name": "🧘 Zen Mean Reversion",
            "description": "Buys the dip in established trends. Waits for 'RSI Oversold' (from your standard list) or 'Hammer Candle' patterns while filtered by 'Ichimoku Cloud'.",
            "tags": json.dumps(["Moderate", "Swing", "Dip Buyer"]),
            "signals": ["RSI Bullish Divergence", "Hammer Candle Pattern", "Ichimoku Cloud Breakout"]
        },
        {
            "name": "🐳 Whale Hunter",
            "description": "Detects institutional accumulation. Uses 'VWAP Crossover' and 'MACD Histogram Reversal' to spot where big money is entering.",
            "tags": json.dumps(["Volume", "Institutional", "Day Trading"]),
            "signals": ["VWAP Crossover (Intraday)", "MACD Histogram Reversal"]
        }
    ]

    print(f"\n   Creating {len(pro_robots)} Pro Robots...")
    admin_id = 1
    
    for r in pro_robots:
        cursor.execute("SELECT id FROM bots WHERE name = ?", (r["name"],))
        existing = cursor.fetchone()
        
        manifest = []
        for sig_name in r["signals"]:
            if sig_name in signal_map:
                manifest.append(signal_map[sig_name])
            elif sig_name == "RSI Oversold": # Fallback to standard if needed
                 # Find RSI Oversold 
                 cursor.execute("SELECT id, payload FROM signals")
                 all_sigs = cursor.fetchall()
                 for asig in all_sigs:
                     try:
                         if "RSI Oversold" in asig['payload']:
                             manifest.append(asig['id'])
                             break
                     except: pass
            else:
                print(f"      ⚠️ Warning: Signal '{sig_name}' not found for robot '{r['name']}'")
        
        manifest_json = json.dumps(manifest)
        
        if existing:
             print(f"      🔹 Updating Exists: {r['name']}")
             cursor.execute(
                 "UPDATE bots SET description = ?, tags = ?, signal_manifest = ? WHERE id = ?",
                 (r["description"], r["tags"], manifest_json, existing['id'])
             )
        else:
            cursor.execute(
                "INSERT INTO bots (name, description, status, owner_id, tags, signal_manifest) VALUES (?, ?, ?, ?, ?, ?)",
                (r["name"], r["description"], "draft", admin_id, r["tags"], manifest_json)
            )
            print(f"      ✅ Created: {r['name']}")

    conn.commit()
    print("\n✅ SQLite Pro Content Seeding Complete!")
    conn.close()

if __name__ == "__main__":
    seed_sqlite_pro()
