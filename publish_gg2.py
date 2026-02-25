import sys
import os
import logging
import json

sys.path.append(os.path.abspath("."))
from app.db import SessionLocal
from app.models import Bot, FormulaVersion, Signal

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    db = SessionLocal()
    
    code = """
bb = ta.bbands(data['close'], 20, 2.05)
adx = ta.adx(data['high'], data['low'], data['close'], 14)
rsi = ta.rsi(data['close'], 14)

# VWAP Calculation
vwap = ta.vwap(data['high'], data['low'], data['close'], data['volume'])

curr_close = data['close'].iloc[idx]
curr_adx = adx.iloc[idx]
curr_rsi = rsi.iloc[idx]
curr_vwap = vwap.iloc[idx]

if not is_active:
    # Entry: Golden Goose + Price must be below VWAP (oversold dip confirmation)
    result = (curr_close < bb['lower'].iloc[idx]) and (curr_adx < 60) and (curr_close < curr_vwap)
else:
    # Exit: ALWAYS SELL NEXT CANDLE (Sniper Mode)
    result = False
"""
    
    sig_config = {
        "type": "PYTHON",
        "payload": {
            "code": code,
            "name": "GG 2 (VWAP Sniper)"
        }
    }

    try:
        # Create Bot
        bot = Bot(
            name="GG 2 (VWAP Sniper)",
            description="Evolution of the Golden Goose. Buys deep dips confirmed by extreme oversold VWAP deviation, and exits immediately. Sharpe: Unknown",
            status="running",
            owner_id=None,
            live_trading=False,
            tags=["crypto", "sniper", "gg2", "vwap"]
        )
        db.add(bot)
        db.commit()
        db.refresh(bot)

        # Create Signal
        s = Signal(
            bot_id=bot.id,
            type=sig_config['type'],
            payload=sig_config['payload'],
            mode="live"
        )
        db.add(s)
        db.commit()
        db.refresh(s)

        # Update Bot Manifest
        bot.signal_manifest = [s.id]
        db.commit()

        # Create Formula Version
        formula = FormulaVersion(
            bot_id=bot.id,
            version=1,
            payload={"stack": [sig_config]},
            created_by=None,
            published=True,
            notes="Auto-generated GG 2 with VWAP filter."
        )
        db.add(formula)
        db.commit()
        
        logger.info(f"Successfully published GG 2 Bot ID: {bot.id}")
    except Exception as e:
        logger.error(f"Error publishing: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
