import sys
import os
import pandas as pd
import logging
from datetime import datetime
from unittest.mock import MagicMock

# MOCK ALPACA to avoid ModuleNotFoundError
sys.modules["alpaca_trade_api"] = MagicMock()

# Add current directory to path
sys.path.append(os.path.abspath("."))

from app.db import SessionLocal
from app.signals import BacktestEngine, SignalEvaluator, TechnicalAnalysis
from app.models import Signal, Bot, FormulaVersion
from sqlalchemy.orm import Session

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class MockSignal:
    def __init__(self, id, type, payload):
        self.id = id
        self.type = type
        self.payload = payload
        self.bot_id = None
        self.mode = "simulation"

def run_strategy_test(db: Session, strategy_name: str, signals_config: list, symbol: str = "BTC-USD", days: int = 365):
    """
    Runs a backtest for a given strategy configuration.
    """
    logger.info(f"--- Testing Strategy: {strategy_name} ---")

    created_signals = []
    try:
        for i, sig_conf in enumerate(signals_config):
            s = Signal(
                type=sig_conf['type'],
                payload=sig_conf['payload'],
                mode="simulation"
            )
            db.add(s)
            db.commit()
            db.refresh(s)
            created_signals.append(s)

        stack_ids = [s.id for s in created_signals]

        engine = BacktestEngine(db)

        # Configurable TP/SL from strategy config, defaults to wide
        tp = sig_conf.get('take_profit', 100.0)
        sl = sig_conf.get('stop_loss', 10.0)

        result = engine.run(stack_ids, symbol, days=days, stop_loss=sl, take_profit=tp)

        logger.info(f"Results for {strategy_name}:")
        logger.info(f"  Sharpe: {result.sharpe_ratio}")
        logger.info(f"  Max DD: {result.max_drawdown}%")
        logger.info(f"  Return: {result.total_return_pct}%")
        logger.info(f"  Trades: {result.total_trades}")

        return result

    except Exception as e:
        logger.error(f"Error running strategy {strategy_name}: {e}")
        import traceback
        traceback.print_exc()
        return None
    finally:
        # Cleanup
        for s in created_signals:
            db.delete(s)
        db.commit()

def generate_variations():
    variations = []

    # Strategy: Golden Goose "Sniper" Refinement
    # Insight: The best strategy is "Buy Deep Dip, Sell Next Day".
    # Goal: Optimize the ENTRY for this 1-Day Hold to increase Sharpe > 1.8.

    # Base: Dev 2.05, ADX < 60, Exit Next Day.
    # Current Best: Sharpe 1.47, DD 2.1%

    # 1. Test Stricter Deviations (Catch deeper knives)
    deviations = [2.05, 2.1, 2.2, 2.3]

    # 2. Test RSI Filters (Ensure it's oversold, not just outside bands)
    rsi_thresholds = [100, 30, 25] # 100 = Off

    for dev in deviations:
        for rsi_max in rsi_thresholds:
            name = f"Sniper_Dev{dev}_RSI{rsi_max}"

            # Entry Logic construction
            conditions = [
                f"(curr_close < bb['lower'].iloc[idx])", # Below Lower Band
                "(curr_adx < 60)"                         # Not in mega-crash trend
            ]

            if rsi_max < 100:
                conditions.append(f"(curr_rsi < {rsi_max})")

            entry_logic = " and ".join(conditions)

            code = f"""
bb = ta.bbands(data['close'], 20, {dev})
adx = ta.adx(data['high'], data['low'], data['close'], 14)
rsi = ta.rsi(data['close'], 14)

curr_close = data['close'].iloc[idx]
curr_adx = adx.iloc[idx]
curr_rsi = rsi.iloc[idx]

if not is_active:
    # Entry
    result = {entry_logic}
else:
    # Exit: ALWAYS SELL NEXT CANDLE (Sniper Mode)
    result = False
"""
            variations.append({
                "name": name,
                "signals": [{"type": "PYTHON", "payload": {"code": code, "name": name}}]
            })

    return variations

def main():
    db = SessionLocal()
    variations = generate_variations()

    logger.info(f"Generated {len(variations)} variations.")

    best_sharpe = -100
    best_strategy = None

    symbol = "BTC-USD"

    for v in variations:
        res = run_strategy_test(db, v['name'], v['signals'], symbol=symbol)

        if res:
            if res.sharpe_ratio > best_sharpe:
                best_sharpe = res.sharpe_ratio
                best_strategy = v
                logger.info(f"*** NEW BEST: {v['name']} (Sharpe: {best_sharpe}, DD: {res.max_drawdown}) ***")

            # Check criteria
            if res.sharpe_ratio > 1.5 and res.max_drawdown < 20.0:
                logger.info("!!! PROMISING STRATEGY FOUND !!!")

            if res.sharpe_ratio > 1.8 and res.max_drawdown < 15.0:
                logger.info("!!! GOLDEN GOOSE CRITERIA MET !!!")
                with open("WINNING_STRATEGY.txt", "w") as f:
                    f.write(f"Name: {v['name']}\n")
                    f.write(f"Code: {v['signals'][0]['payload']['code']}\n")
                    f.write(f"Sharpe: {res.sharpe_ratio}\n")
                    f.write(f"DD: {res.max_drawdown}\n")
                break

if __name__ == "__main__":
    main()
