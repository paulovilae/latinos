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
        if self.signal.type == "FORMULA":
            return self._eval_formula(context, candle_idx)
        elif self.signal.type == "PYTHON":
            return self._eval_python(context, candle_idx)
        return False

    def _eval_formula(self, df: pd.DataFrame, idx: int) -> bool:
        # Simple formula engine: "close > open"
        # We can use pandas eval for vectorization or simple python 'eval' for single row
        # For simplicity MVP: row-based eval
        try:
            row = df.iloc[idx].to_dict()
            # Prepare locals: close, open, etc.
            # Add simple helpers if needed
            result = eval(self.signal.payload.get("code", ""), {}, row)
            return bool(result)
        except Exception as e:
            # print(f"Formula Error: {e}")
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
            # print(f"Python Signal Error: {e}")
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

    def run(self, stack_ids: List[str], symbol: str, interval: str = "1d", days: int = 365) -> BacktestResult:
        # 1. Fetch Data
        # Ensure data exists?
        # sync_market_data(self.db, symbol, interval) # Maybe trigger this?
        
        # Query DB using Pandas
        query = self.db.query(MarketData).filter(
            MarketData.symbol == symbol.upper(),
            MarketData.interval == interval
        ).order_by(MarketData.timestamp.asc())
        
        # df = pd.read_sql(query.statement, self.db.bind) # Needs bind
        # OR manual construction
        data = [
            {"open": d.open, "high": d.high, "low": d.low, "close": d.close, "volume": d.volume, "timestamp": d.timestamp}
            for d in query.all()
        ]
        
        if not data:
             return BacktestResult() # Empty

        df = pd.DataFrame(data)
        
        # 2. Prepare Signals - fetch from DB by ID
        from .models import Signal as SignalModel
        signals: List[SignalModel] = []
        if stack_ids:
            signals = self.db.query(SignalModel).filter(SignalModel.id.in_(stack_ids)).all()
        
        if not signals:
            # No signals to evaluate = no trades
            return BacktestResult()
        
        # 3. Iterate
        trades = []
        in_position = False
        entry_price = 0.0
        
        # Simple Logic: Green Stack = BUY (if not in pos), Red Stack = SELL (if in pos)
        # This is basic strategy logic, user might want "Buy Stack" vs "Sell Stack"
        # For now: Single Stack -> if Green => Bullish sentiment.
        
        for i in range(len(df)):
            is_green = self._evaluate_stack(signals, df, i)
            
            price = df.iloc[i]["close"]
            ts = df.iloc[i]["timestamp"]
            
            if is_green and not in_position:
                trades.append({"type": "buy", "price": price, "time": ts})
                in_position = True
                entry_price = price
            elif not is_green and in_position:
                trades.append({"type": "sell", "price": price, "time": ts, "pnl": price - entry_price})
                in_position = False

        # Calculate Stats
        wins = len([t for t in trades if t.get("type") == "sell" and t.get("pnl", 0) > 0])
        total_closed = len([t for t in trades if t.get("type") == "sell"])
        win_rate = (wins / total_closed) if total_closed > 0 else 0
        total_pnl = sum([t.get("pnl", 0) for t in trades])
        
        return BacktestResult(
            total_trades=total_closed,
            win_rate=win_rate,
            pnl=total_pnl,
            history=trades
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
