import sys
import os
import logging

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
    # Entry: Momentum Breakout + Price must be above VWAP (aggressive uptrend confirmation)
    result = (curr_close > bb['upper'].iloc[idx]) and (curr_adx > 25) and (curr_close > curr_vwap)
else:
    # Exit: ALWAYS SELL NEXT CANDLE (Sniper Mode)
    result = False
"""
    
    sig_config = {
        "type": "PYTHON",
        "payload": {
            "code": code,
            "name": "GG 3 (Momentum Breakout)"
        }
    }

    try:
        # Create Bot specifically targeting SOXR
        bot = Bot(
            name="GG 3 (Momentum Breakout)",
            description="Designed for Inverse ETFs (like SOXR). Buys aggressive momentum breakouts confirmed by VWAP, and exits immediately. Sharpe: Unknown",
            status="running",
            owner_id=None,
            live_trading=False,
            tags=["SOXR"] # Assign SOXR as the target asset
        )
        db.add(bot)
        db.commit()
        db.refresh(bot)

        # Create Signal
        s = Signal(
            bot_id=bot.id,
            type=sig_config['type'],
            payload=sig_config['payload'],
            mode="live",
            delivery_status="template"
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
            notes="Auto-generated GG 3 targeting breakout momentum."
        )
        db.add(formula)
        db.commit()
        
        logger.info(f"Successfully published GG 3 Bot ID: {bot.id}")
    except Exception as e:
        logger.error(f"Error publishing: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
