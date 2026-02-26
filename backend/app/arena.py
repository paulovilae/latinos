"""
🏟️ Robot Arena — WASM-Powered Backtesting Engine

Loads each bot's compiled WASM binary, feeds real market data through
process_batch(), simulates trades, and calculates performance metrics.
"""

from __future__ import annotations

import base64
import ctypes
import logging
import time
from typing import Dict, List, Optional, Tuple

import pandas as pd
from wasmtime import Store, Module, Instance

from .signals import TechnicalAnalysis
from .market import fetch_market_series

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────
# Indicator Mapping: bot name pattern → indicator function
# Each WASM bot expects [close, indicator_value] per candle
# ──────────────────────────────────────────────────────────────

INDICATOR_MAP = {
    "rsi":        lambda df: TechnicalAnalysis.rsi(df["close"], period=14),
    "macd":       lambda df: TechnicalAnalysis.macd(df["close"])["macd"],
    "bbands":     lambda df: TechnicalAnalysis.bbands(df["close"])["lower"],
    "stochastic": lambda df: TechnicalAnalysis.stoch(df["high"], df["low"], df["close"])["k"],
    "adx":        lambda df: TechnicalAnalysis.adx(df["high"], df["low"], df["close"]),
    "williams_r": lambda df: TechnicalAnalysis.willr(df["high"], df["low"], df["close"]),
    "supertrend": lambda df: TechnicalAnalysis.supertrend(df["high"], df["low"], df["close"])["direction"],
    "atr":        lambda df: TechnicalAnalysis.atr(df["high"], df["low"], df["close"]),
    "vwap":       lambda df: TechnicalAnalysis.vwap(df["high"], df["low"], df["close"], df["volume"]),
}


def detect_indicator(bot_name: str) -> str:
    """
    Detect which indicator a bot uses from its name or Dify workflow variables.
    """
    name_lower = bot_name.lower()
    
    indicator_keywords = {
        "rsi": "rsi",
        "macd": "macd",
        "bollinger": "bbands",
        "bbands": "bbands",
        "stochastic": "stochastic",
        "adx": "adx",
        "williams": "williams_r",
        "supertrend": "supertrend",
        "atr": "atr",
        "vwap": "vwap",
    }
    
    for keyword, indicator in indicator_keywords.items():
        if keyword in name_lower:
            return indicator
    
    return "rsi"  # Default fallback


def compute_indicator_series(df: pd.DataFrame, indicator_key: str) -> pd.Series:
    """
    Compute the indicator series for a given DataFrame.
    Returns a pandas Series aligned with the DataFrame index.
    """
    compute_fn = INDICATOR_MAP.get(indicator_key)
    if not compute_fn:
        logger.warning(f"Unknown indicator '{indicator_key}', defaulting to RSI")
        compute_fn = INDICATOR_MAP["rsi"]
    
    try:
        result = compute_fn(df)
        if isinstance(result, tuple):
            result = result[0]  # Take first element if tuple
        return result.fillna(0.0)
    except Exception as e:
        logger.error(f"Indicator computation failed for '{indicator_key}': {e}")
        return pd.Series([0.0] * len(df), index=df.index)


def run_wasm_backtest(
    wasm_binary: bytes,
    closes: List[float],
    indicators: List[float],
) -> List[int]:
    """
    Execute the WASM process_batch function on market data.
    Returns a list of signals: 1=BUY, -1=SELL, 0=HOLD
    """
    num_candles = len(closes)
    num_vars = 2  # [close, indicator] per candle
    
    # Setup wasmtime
    store = Store()
    module = Module(store.engine, wasm_binary)
    instance = Instance(store, module, [])
    
    process_batch = instance.exports(store)["process_batch"]
    memory = instance.exports(store)["memory"]
    
    # Calculate memory requirements
    input_size_bytes = num_candles * num_vars * 8  # f64 = 8 bytes
    output_size_bytes = num_candles * 4  # i32 = 4 bytes
    total_needed = input_size_bytes + output_size_bytes
    
    # Ensure enough WASM memory pages (64KB each)
    current_pages = memory.size(store)
    needed_pages = (total_needed // (64 * 1024)) + 2
    if current_pages < needed_pages:
        memory.grow(store, needed_pages - current_pages)
    
    input_ptr = 0
    output_ptr = input_size_bytes
    
    # Write input data to WASM memory
    mem_view = memory.data_ptr(store)
    input_array_type = ctypes.c_double * (num_candles * num_vars)
    input_array = input_array_type.from_address(
        ctypes.addressof(mem_view.contents) + input_ptr
    )
    
    for i in range(num_candles):
        base = i * num_vars
        input_array[base] = closes[i]
        input_array[base + 1] = indicators[i]
    
    # Execute WASM
    process_batch(store, input_ptr, output_ptr, num_candles)
    
    # Read output signals
    output_array_type = ctypes.c_int32 * num_candles
    output_array = output_array_type.from_address(
        ctypes.addressof(mem_view.contents) + output_ptr
    )
    
    return [output_array[i] for i in range(num_candles)]


def simulate_trades(
    signals: List[int],
    closes: List[float],
    initial_capital: float = 10000.0,
) -> Dict:
    """
    Simulate trades from WASM signals.
    Strategy: BUY when signal=1, EXIT when signal drops back to 0.
    This creates round-trip trades for buy-only bots.
    """
    capital = initial_capital
    position = 0  # 0 = flat, 1 = long
    entry_price = 0.0
    trades = []
    equity_curve = [initial_capital]
    peak_equity = initial_capital
    max_drawdown = 0.0
    
    for i, (signal, price) in enumerate(zip(signals, closes)):
        if price <= 0:
            equity_curve.append(equity_curve[-1])
            continue
            
        if signal == 1 and position == 0:
            # ENTER long
            position = 1
            entry_price = price
        elif signal != 1 and position == 1:
            # EXIT: signal dropped from 1 → 0 (or -1)
            pnl_pct = (price - entry_price) / entry_price * 100
            trades.append(pnl_pct)
            capital *= (1 + pnl_pct / 100)
            position = 0
        
        # Track equity
        if position == 1 and entry_price > 0:
            equity_curve.append(capital * (price / entry_price))
        else:
            equity_curve.append(capital)
        
        # Track drawdown
        current_equity = equity_curve[-1]
        if current_equity > peak_equity:
            peak_equity = current_equity
        if peak_equity > 0:
            dd = (peak_equity - current_equity) / peak_equity * 100
            if dd > max_drawdown:
                max_drawdown = dd
    
    # Close any open position at end
    if position == 1 and closes and entry_price > 0:
        pnl_pct = (closes[-1] - entry_price) / entry_price * 100
        trades.append(pnl_pct)
        capital *= (1 + pnl_pct / 100)
    
    # Compute metrics
    total_return = ((capital - initial_capital) / initial_capital) * 100
    winning_trades = [t for t in trades if t > 0]
    win_rate = (len(winning_trades) / len(trades) * 100) if trades else 0.0
    
    # Sharpe ratio (annualized)
    if len(equity_curve) > 2:
        returns = pd.Series(equity_curve).pct_change().dropna()
        returns = returns.replace([float('inf'), float('-inf')], 0).fillna(0)
        if returns.std() > 0:
            sharpe = (returns.mean() / returns.std()) * (252 ** 0.5)
        else:
            sharpe = 0.0
    else:
        sharpe = 0.0
    
    buy_count = sum(1 for s in signals if s == 1)
    sell_count = sum(1 for s in signals if s == -1)
    
    return {
        "total_return": round(total_return, 2),
        "win_rate": round(win_rate, 1),
        "max_drawdown": round(max_drawdown, 2),
        "sharpe": round(sharpe, 2),
        "num_trades": len(trades),
        "buy_signals": buy_count,
        "sell_signals": sell_count,
    }


def run_arena_for_bot(
    bot_name: str,
    wasm_base64: str,
    asset: str,
    timeframe: str = "30d",
) -> Optional[Dict]:
    """
    Run full arena backtest for a single bot on a single asset.
    
    Returns metrics dict or None on failure.
    """
    try:
        t0 = time.time()
        
        # 1. Map timeframe string to yfinance range
        range_map = {
            "7d": ("7d", "1h"),
            "15d": ("15d", "1h"),
            "30d": ("1mo", "1d"),
            "90d": ("3mo", "1d"),
            "180d": ("6mo", "1d"),
            "365d": ("1y", "1d"),
        }
        yf_range, yf_interval = range_map.get(timeframe, ("1mo", "1d"))
        
        # 2. Fetch market data
        _, candles = fetch_market_series(asset, yf_interval, yf_range)
        if not candles or len(candles) < 20:
            return None
        
        # 3. Build DataFrame
        df = pd.DataFrame(candles)
        if "timestamp" in df.columns:
            df.set_index("timestamp", inplace=True)
        
        # 4. Detect and compute indicator
        indicator_key = detect_indicator(bot_name)
        indicator_series = compute_indicator_series(df, indicator_key)
        
        closes = df["close"].tolist()
        indicators = indicator_series.tolist()
        
        # Trim to same length
        min_len = min(len(closes), len(indicators))
        closes = closes[:min_len]
        indicators = indicators[:min_len]
        
        if min_len < 10:
            return None
        
        # 5. Decode WASM and run
        wasm_binary = base64.b64decode(wasm_base64)
        signals = run_wasm_backtest(wasm_binary, closes, indicators)
        
        # 6. Simulate trades
        metrics = simulate_trades(signals, closes)
        
        elapsed = time.time() - t0
        metrics["exec_time_ms"] = round(elapsed * 1000, 1)
        metrics["indicator"] = indicator_key
        metrics["candles"] = min_len
        
        logger.info(
            f"🏟️ Arena: {bot_name} × {asset} ({timeframe}) = "
            f"{metrics['total_return']:+.1f}% | {metrics['num_trades']} trades | "
            f"{elapsed*1000:.0f}ms"
        )
        
        return metrics
        
    except Exception as e:
        logger.error(f"Arena backtest failed for {bot_name} × {asset}: {e}")
        return None
