import asyncio
import os
import json
import websockets
from datetime import datetime
from sqlalchemy.orm import Session
import pandas as pd

from app.db import SessionLocal
from app import models, crud
from app.signals import SignalEvaluator

# Basic daemon for streaming Alpaca Market Data and triggering active bots
# In production, this would be a separate microservice using Redis/Celery.
# For Latinos MVP, we run it as an asyncio background task.

ALPACA_DATA_URL = "wss://stream.data.alpaca.markets/v1beta3/crypto/us"
ALPACA_API_KEY = os.getenv("ALPACA_API_KEY", "")
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET_KEY", "")

# In-memory buffer for the current minute's candle construction
candle_buffer = {}

async def authenticate(ws):
    auth_msgs = {"action": "auth", "key": ALPACA_API_KEY, "secret": ALPACA_SECRET_KEY}
    await ws.send(json.dumps(auth_msgs))
    auth_reply = await ws.recv()
    print(f"📡 Alpaca WS Auth Reply: {auth_reply}")

async def subscribe(ws, symbols: list):
    sub_msg = {"action": "subscribe", "bars": symbols}
    await ws.send(json.dumps(sub_msg))
    sub_reply = await ws.recv()
    print(f"📡 Alpaca WS Sub Reply: {sub_reply}")

def get_active_live_bots(db: Session, symbol: str):
    """Fetch all bots authorized for live trading on this symbol."""
    # For MVP, we assume running bots trade the symbol they were last backtested on, 
    # or all bots if symbol agnosticism is applied.
    # Currently `Bot` schema doesn't lock to one symbol, we will evaluate all `live_trading` bots.
    bots = db.query(models.Bot).filter(models.Bot.live_trading == True, models.Bot.status == "running").all()
    return bots

def evaluate_bot_live(bot: models.Bot, symbol: str, current_bar: dict, db: Session):
    """Execute the bot's signal stack against the current live market bar."""
    print(f"🤖 Evaluating live Bot '{bot.name}' on {symbol} @ {current_bar['c']}")
    
    # 1. Fetch signal manifest
    manifest = bot.signal_manifest
    if not manifest: return
    
    # Extract IDs safely regardless of storage format
    target_ids = []
    config_map = {}
    for item in manifest:
        if isinstance(item, dict):
            s_id = str(item.get("id"))
            target_ids.append(s_id)
            config_map[s_id] = item
        elif isinstance(item, (int, str)):
            s_id = str(item)
            target_ids.append(s_id)
            config_map[s_id] = {"invert": False}
            
    if not target_ids: return
    
    # 2. Fetch Signals
    signals = db.query(models.Signal).filter(models.Signal.id.in_(target_ids)).all()
    if not signals: return
    
    # 3. Build synthetic DataFrame representing the "current state"
    # To properly evaluate TA like RSI or MA, the bot actually needs historical context.
    # For a true live daemon, we should fetch the last 100 bars from the DB, append this live bar, and evaluate.
    from app.market_data_loader import sync_market_data
    from app.models import MarketData
    
    # Let's ensure recent data exists in the BD before evaluating
    sync_market_data(db, symbol, interval="1d", range_="1mo") # Ensures we have context
    
    # Fetch context
    query = db.query(MarketData).filter(MarketData.symbol == symbol).order_by(MarketData.timestamp.asc()).limit(100)
    historical_data = [{"open": d.open, "high": d.high, "low": d.low, "close": d.close, "volume": d.volume, "timestamp": d.timestamp, "symbol": symbol} for d in query.all()]
    
    # Append the LIVE bar dynamically 
    live_timestamp = datetime.strptime(current_bar['t'], "%Y-%m-%dT%H:%M:%SZ") if isinstance(current_bar['t'], str) else datetime.utcnow()
    
    historical_data.append({
        "open": current_bar['o'],
        "high": current_bar['h'],
        "low": current_bar['l'],
        "close": current_bar['c'],
        "volume": current_bar['v'],
        "timestamp": live_timestamp,
        "symbol": symbol
    })
    
    df = pd.DataFrame(historical_data)
    
    # 4. Evaluate stack
    is_green = True
    for sig in signals:
        evaluator = SignalEvaluator(sig)
        # Pass the DB session dynamically for Broker Key lookup
        res = evaluator.evaluate(df, db, candle_idx=-1, debug=True)
        
        cfg = config_map.get(str(sig.id), {})
        if res is None: res = False
        elif cfg.get("invert"): res = not res
            
        if not res:
            is_green = False
            break

    if is_green:
        print(f"🔥 Live TRADING SIGNAL FIRED for Bot {bot.name} on {symbol}!")
        # Evaluator._trigger_alpaca_order already executed inside element.evaluate() if `mode=live`
        # But MVP signals might not have `mode=live` hardcoded in DB.
        # So we force execute if the bot is live.
        from app.signals import SignalEvaluator
        # Instantiate a proxy signal to force trigger manually if required
        fake_sig = models.Signal(id=0, bot_id=bot.id, type="BUY", payload={}, mode="live")
        eval_engine = SignalEvaluator(fake_sig)
        eval_engine._trigger_alpaca_order(df, db)

async def market_data_loop():
    print("🌍 Starting Live Market Data Daemon...")
    if not ALPACA_API_KEY:
        print("⚠️ No global Alpaca keys set. Daemon will not start.")
        return
        
    try:
        async with websockets.connect(ALPACA_DATA_URL) as ws:
            await authenticate(ws)
            # Subscribe to Minute Bars for Bitcoin & Ethereum
            await subscribe(ws, ["BTC/USD", "ETH/USD"])
            
            while True:
                msg = await ws.recv()
                data = json.loads(msg)
                
                for item in data:
                    if item.get("T") == "b": # 'b' indicates a Bar (Candle)
                        symbol = item.get("S", "").replace("/", "-")
                        print(f"📈 [LIVE TICK] {symbol}: Close {item.get('c')}")
                        
                        # Process bots
                        db = SessionLocal()
                        try:
                            bots = get_active_live_bots(db, symbol)
                            for bot in bots:
                                evaluate_bot_live(bot, symbol, item, db)
                        except Exception as e:
                            print(f"Error evaluating live bots: {e}")
                        finally:
                            db.close()
    except Exception as e:
        print(f"💥 Live WS connection dropped: {e}")
        # Simplistic auto-reconnect delay
        await asyncio.sleep(5)
        # In a real daemon you would wrap this in a robust reconnect loop

if __name__ == "__main__":
    asyncio.run(market_data_loop())
