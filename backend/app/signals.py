import pandas as pd
from typing import List, Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from .models import Signal, MarketData
from .schemas import SignalDef, SignalStack, BacktestResult, SignalType
from .market_data_loader import sync_market_data


class TechnicalAnalysis:
    @staticmethod
    def sma(series: pd.Series, period: int = 14) -> pd.Series:
        return series.rolling(window=period).mean()

    @staticmethod
    def ema(series: pd.Series, period: int = 14) -> pd.Series:
        return series.ewm(span=period, adjust=False).mean()

    @staticmethod
    def rsi(series: pd.Series, period: int = 14) -> pd.Series:
        delta = series.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))

    @staticmethod
    def macd(series: pd.Series, fast: int = 12, slow: int = 26, signal: int = 9) -> Dict[str, pd.Series]:
        exp1 = series.ewm(span=fast, adjust=False).mean()
        exp2 = series.ewm(span=slow, adjust=False).mean()
        macd_line = exp1 - exp2
        signal_line = macd_line.ewm(span=signal, adjust=False).mean()
        return {"macd": macd_line, "signal": signal_line, "hist": macd_line - signal_line}

    @staticmethod
    def bbands(series: pd.Series, period: int = 20, std_dev: int = 2) -> Dict[str, pd.Series]:
        sma = series.rolling(window=period).mean()
        std = series.rolling(window=period).std()
        upper = sma + (std * std_dev)
        lower = sma - (std * std_dev)
        return {"upper": upper, "middle": sma, "lower": lower}

    @staticmethod
    def stoch(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14, k_window: int = 3, d_window: int = 3) -> Dict[str, pd.Series]:
        lowest_low = low.rolling(window=period).min()
        highest_high = high.rolling(window=period).max()
        k_percent = 100 * ((close - lowest_low) / (highest_high - lowest_low))
        k = k_percent.rolling(window=k_window).mean()
        d = k.rolling(window=d_window).mean()
        return {"k": k, "d": d}

# Restricted Global Environment for Python Signals
SAFE_GLOBALS = {
    "__builtins__": {
        "abs": abs, "all": all, "any": any, "bool": bool,
        "dict": dict, "float": float, "int": int, "len": len,
        "list": list, "max": max, "min": min, "pow": pow,
        "round": round, "set": set, "str": str, "sum": sum,
        "range": range, "enumerate": enumerate, "zip": zip,
        "filter": filter, "map": map, "sorted": sorted,
    },
    "pd": pd,
    "math": __import__("math"),
    "ta": TechnicalAnalysis, # Injected TA Library
}

class SignalEvaluator:
    def __init__(self, signal_def: Signal):
        self.signal = signal_def

    def evaluate(self, context: pd.DataFrame, candle_idx: int = -1) -> bool:
        """
        Evaluates the signal against a specific point in time (candle index).
        Context is a DataFrame with open, high, low, close, volume.
        Returns True (Green/1) or False (Red/0).
        """
        if self.signal.type.upper() == "FORMULA":
            return self._eval_formula(context, candle_idx)
        elif self.signal.type.upper() == "PYTHON":
            return self._eval_python(context, candle_idx)
        return False

    def _eval_formula(self, df: pd.DataFrame, idx: int) -> bool:
        # Simple formula engine: "close > open"
        # We can use pandas eval for vectorization or simple python 'eval' for single row
        # For simplicity MVP: row-based eval
        try:
            # Prepare locals: close, open, etc.
            row = df.iloc[idx].to_dict()

            # Helper functions that work with series up to current index
            def MA(arg1, arg2=None) -> float:
                """Moving Average. Usage: MA(14) or MA('close', 14)"""
                period = 14
                series_name = 'close'
                
                if isinstance(arg1, str):
                    series_name = arg1
                    if arg2 is not None:
                         period = int(arg2)
                elif isinstance(arg1, int):
                    period = arg1
                # If arg1 is float/other (e.g. valid price passed by mistake), we can't infer name.
                
                if idx < period - 1:
                    return 0.0  # Not enough data
                
                if series_name not in df.columns:
                     return 0.0 # Fail safe

                series = df[series_name].iloc[max(0, idx - period + 1):idx + 1]
                return float(series.mean())
            
            def RSI(arg1, arg2=None) -> float:
                """Relative Strength Index. Usage: RSI(14) or RSI('close', 14)"""
                period = 14
                series_name = 'close'
                
                if isinstance(arg1, str):
                    series_name = arg1
                    if arg2 is not None:
                        period = int(arg2)
                elif isinstance(arg1, int):
                    period = arg1
                    
                if idx < period:
                    return 50.0  # Default neutral
                
                if series_name not in df.columns:
                    return 50.0

                # Get series slice
                series = df[series_name].iloc[max(0, idx - period):idx + 1]
                delta = series.diff().dropna() # Drop first NaN
                
                gain = (delta.where(delta > 0, 0)).mean()
                loss = (-delta.where(delta < 0, 0)).mean()
                
                val = 50.0
                if loss == 0 and gain > 0:
                     val = 100.0
                elif loss == 0 and gain == 0:
                     val = 50.0
                else:
                    rs = gain / loss
                    val = 100 - (100 / (1 + rs))
                
                # Debug print periodically
                # if idx % 100 == 0:
                #     print(f"DEBUG RSI at idx {idx}: Val={val:.2f}")
                
                return val

            # Safe globals with helper functions
            safe_globals = {
                'MA': MA,
                'RSI': RSI,
                'abs': abs,
                'max': max,
                'min': min,
            }
            
            code = self.signal.payload.get("code", "")
            # print(f"DEBUG Eval Code: {code} at idx {idx}")
            result = eval(code, safe_globals, row)
            # print(f"DEBUG Result: {result}")
            return bool(result)
        except Exception as e:
            print(f"Formula Error processing '{self.signal.payload.get('code')}': {e}")
            return False

    def _eval_python(self, df: pd.DataFrame, idx: int) -> bool:
        code = self.signal.payload.get("code", "")
        if not code:
            return False
            
        local_scope = {
            "data": df,
            "idx": idx,
            "result": False # Expected output
        }
        
        try:
            # Exec safe-ish
            exec(code, SAFE_GLOBALS, local_scope)
            return bool(local_scope.get("result", False))
        except Exception as e:
            print(f"Python Signal Error processing '{code[:20]}...': {e}")
            return False

class StackRunner:
    def __init__(self, db: Session, stack: SignalStack):
        self.db = db
        # Resolve Signals
        # In a real app, 'stack.signals' would be IDs. We fetch db models.
        # For now assuming stack.signals are passed as objects or we fetch them.
        self.signals = self._fetch_signals(stack.signals)

    def _fetch_signals(self, signal_ids: List[str]) -> List[Signal]:
        # Dummy fetcher - replace with CRUD
        return [] 

    def run_tick(self, context: pd.DataFrame, idx: int) -> bool:
        """Sequential Logic: AND gate by default? Or sequential flow?"""
        # User defined: "If green -> next; If red -> stop" (AND Chain)
        for sig in self.signals:
            evaluator = SignalEvaluator(sig)
            if not evaluator.evaluate(context, idx):
                return False
        return True

class BacktestEngine:
    def __init__(self, db: Session):
        self.db = db

    def run(self, stack_ids: List[str], symbol: str, interval: str = "1d", days: int = 365,
            take_profit: float = 5.0, stop_loss: float = 3.0, initial_capital: float = 10000.0) -> BacktestResult:
        # 1. Fetch Data - try real data first, fallback to synthetic if needed
        print(f"Fetching real market data for {symbol}...")
        try:
            # Try real Yahoo Finance data first
            from .market import fetch_market_series # Ensure import
            # sync_market_data(self.db, symbol, interval, range_=f"{days}d", use_synthetic=False)
            # The market_data_loader logic handles fetching if missing
            pass # Provided logic seems to fetch implicitly or relies on caller. 
                 # Actually previous code called sync_market_data. Let's keep it.
            from .market_data_loader import sync_market_data
            sync_market_data(self.db, symbol, interval, range_=f"{days}d", use_synthetic=False)
            print(f"✅ Successfully fetched real data for {symbol}")
        except Exception as e:
            print(f"⚠️ Failed to fetch real data: {e}")
            from .market_data_loader import sync_market_data
            sync_market_data(self.db, symbol, interval, range_=f"{days}d", use_synthetic=True)
        
        # Query DB using Pandas
        query = self.db.query(MarketData).filter(
            MarketData.symbol == symbol.upper(),
            MarketData.interval == interval
        ).order_by(MarketData.timestamp.asc())
        
        data = [
            {"open": d.open, "high": d.high, "low": d.low, "close": d.close, "volume": d.volume, "timestamp": d.timestamp}
            for d in query.all()
        ]
        
        if not data:
            return BacktestResult(
                total_trades=0, win_rate=0.0, pnl=0.0,
                initial_capital=initial_capital, final_capital=initial_capital,
                total_return_pct=0.0, max_drawdown=0.0,
                history=[], equity_curve=[]
            )

        df = pd.DataFrame(data)
        
        # 2. Prepare Signals
        from .models import Signal as SignalModel
        signals: List[SignalModel] = []
        if stack_ids:
            signals = self.db.query(SignalModel).filter(SignalModel.id.in_(stack_ids)).all()
        
        if not signals:
             print(f"WARNING: Stack IDs {stack_ids} yielded 0 signals. check if signals exist in DB.")
             # Return flat equity curve (Hold Cash)
             flat_curve = [{"timestamp": d["timestamp"], "equity": initial_capital} for d in data]
             return BacktestResult(
                total_trades=0, win_rate=0.0, pnl=0.0,
                initial_capital=initial_capital, final_capital=initial_capital,
                total_return_pct=0.0, max_drawdown=0.0,
                history=[], equity_curve=flat_curve
            )
        
        # 3. Iterate Simulation
        trades = []
        equity_curve = []
        current_capital = initial_capital
        equity_curve.append({"timestamp": df.iloc[0]["timestamp"], "equity": current_capital})

        in_position = False
        entry_price = 0.0
        shares = 0.0
        
        tp_pct = (take_profit or 5.0) / 100.0
        sl_pct = (stop_loss or 3.0) / 100.0
        
        print(f"Starting backtest loop for {len(df)} candles with Capital={initial_capital}, TP={tp_pct}, SL={sl_pct}...")
        
        for i in range(len(df)):
            price = df.iloc[i]["close"]
            ts = df.iloc[i]["timestamp"]
            
            # Evaluate Signal
            is_green = self._evaluate_stack(signals, df, i)
            
            # Record Equity (Mark to Market)
            current_equity = current_capital
            if in_position:
                current_equity = shares * price
            
            equity_curve.append({"timestamp": ts, "equity": current_equity})

            # Trading Logic
            if is_green and not in_position:
                # BUY: Use all capital
                shares = current_capital / price
                # Simulate slippage/fees? Ignoring for now.
                current_capital = 0 # All in stocks
                entry_price = price
                in_position = True
                
                trades.append({
                    "type": "buy",
                    "price": price,
                    "amount": shares,
                    "time": ts,
                    "balance": current_equity
                })
            
            elif in_position:
                should_sell = False
                reason = ""
                
                # Check Exit Conditions
                if not is_green:
                    should_sell = True
                    reason = "Signal Lost"
                elif price >= entry_price * (1 + tp_pct):
                    should_sell = True
                    reason = f"Take Profit (+{take_profit}%)"
                elif price <= entry_price * (1 - sl_pct):
                    should_sell = True
                    reason = f"Stop Loss (-{stop_loss}%)"
                
                if should_sell:
                    proceeds = shares * price
                    pnl = proceeds - (shares * entry_price)
                    pnl_pct = pnl / (shares * entry_price)
                    
                    current_capital = proceeds
                    shares = 0
                    in_position = False
                    
                    trades.append({
                        "type": "sell",
                        "price": price,
                        "time": ts,
                        "pnl": pnl,
                        "pnl_pct": pnl_pct,
                        "reason": reason,
                        "balance": current_capital
                    })

        # Close open trade at end
        if in_position:
            last_price = df.iloc[-1]["close"]
            proceeds = shares * last_price
            pnl = proceeds - (shares * entry_price)
            current_capital = proceeds
            shares = 0
            trades.append({
                "type": "sell",
                "price": last_price,
                "time": df.iloc[-1]["timestamp"],
                "pnl": pnl,
                "reason": "End of Backtest",
                "balance": current_capital
            })
            equity_curve[-1]["equity"] = current_capital

        # Calculate Stats
        final_capital = current_capital
        total_closed = len([t for t in trades if t.get("type") == "sell"])
        wins = len([t for t in trades if t.get("type") == "sell" and t.get("pnl", 0) > 0])
        win_rate = (wins / total_closed) if total_closed > 0 else 0.0
        total_pnl = final_capital - initial_capital
        total_return_pct = (total_pnl / initial_capital) * 100

        # Calculate Max Drawdown
        max_equity = 0
        drawdown = 0
        max_drawdown = 0
        for pt in equity_curve:
            eq = pt["equity"]
            if eq > max_equity:
                max_equity = eq
            dd = (max_equity - eq) / max_equity if max_equity > 0 else 0
            if dd > max_drawdown:
                max_drawdown = dd
        
        return BacktestResult(
            total_trades=total_closed,
            win_rate=round(win_rate * 100, 2), # Return as percentage 0-100? or 0-1? Field is float. Let's send percentage.
            pnl=round(total_pnl, 2),
            initial_capital=initial_capital,
            final_capital=round(final_capital, 2),
            total_return_pct=round(total_return_pct, 2),
            max_drawdown=round(max_drawdown * 100, 2),
            history=trades,
            equity_curve=equity_curve
        )

    def _evaluate_stack(self, signals, df: pd.DataFrame, idx: int) -> bool:
        """
        Evaluates all signals in the stack using AND logic.
        All signals must be True (green) for the stack to be True.
        """
        if not signals:
            return False  # No signals = no signal
        
        for sig in signals:
            evaluator = SignalEvaluator(sig)
            if not evaluator.evaluate(df, idx):
                return False
        return True
