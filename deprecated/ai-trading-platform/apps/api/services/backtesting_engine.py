"""
Advanced Backtesting Engine - Comprehensive backtesting with ML integration
"""

import asyncio
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import json
from dataclasses import dataclass, asdict
from enum import Enum

from loguru import logger
from services.ml_models import MLModelsService
from services.market_data import MarketDataService
from config.settings import get_settings

settings = get_settings()


class OrderType(Enum):
    MARKET = "market"
    LIMIT = "limit"
    STOP = "stop"
    STOP_LIMIT = "stop_limit"


class OrderSide(Enum):
    BUY = "buy"
    SELL = "sell"
    SHORT = "short"
    COVER = "cover"


@dataclass
class BacktestOrder:
    """Backtest order representation"""
    id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float] = None
    stop_price: Optional[float] = None
    timestamp: datetime = None
    filled: bool = False
    fill_price: Optional[float] = None
    fill_timestamp: Optional[datetime] = None


@dataclass
class BacktestPosition:
    """Backtest position representation"""
    symbol: str
    quantity: float
    entry_price: float
    entry_timestamp: datetime
    current_price: float = 0.0
    unrealized_pnl: float = 0.0
    realized_pnl: float = 0.0


@dataclass
class BacktestMetrics:
    """Comprehensive backtest performance metrics"""
    total_return: float = 0.0
    annualized_return: float = 0.0
    volatility: float = 0.0
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0
    max_drawdown: float = 0.0
    max_drawdown_duration: int = 0
    win_rate: float = 0.0
    profit_factor: float = 0.0
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    average_win: float = 0.0
    average_loss: float = 0.0
    largest_win: float = 0.0
    largest_loss: float = 0.0
    consecutive_wins: int = 0
    consecutive_losses: int = 0
    calmar_ratio: float = 0.0
    var_95: float = 0.0
    expected_shortfall: float = 0.0
    beta: float = 0.0
    alpha: float = 0.0
    information_ratio: float = 0.0


class BacktestingEngine:
    """Advanced backtesting engine with ML integration"""
    
    def __init__(self):
        self.ml_service = None
        self.market_service = None
        self.ready = False
        
        # Backtest state
        self.portfolio_value = 0.0
        self.cash = 0.0
        self.positions: Dict[str, BacktestPosition] = {}
        self.orders: List[BacktestOrder] = []
        self.trades: List[Dict[str, Any]] = []
        self.portfolio_history: List[Dict[str, Any]] = []
        
        # Configuration
        self.commission = 0.001  # 0.1% commission
        self.slippage = 0.0005   # 0.05% slippage
        self.initial_capital = 100000.0
    
    async def initialize(self):
        """Initialize backtesting engine"""
        logger.info("📊 Initializing Backtesting Engine...")
        
        try:
            self.ml_service = MLModelsService()
            await self.ml_service.initialize()
            
            self.market_service = MarketDataService()
            
            self.ready = True
            logger.info("✅ Backtesting Engine initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize backtesting engine: {e}")
            self.ready = False
    
    def is_ready(self) -> bool:
        """Check if backtesting engine is ready"""
        return self.ready
    
    async def run_backtest(
        self,
        strategy_config: Dict[str, Any],
        symbols: List[str],
        start_date: datetime,
        end_date: datetime,
        initial_capital: float = 100000.0
    ) -> Dict[str, Any]:
        """Run comprehensive backtest"""
        
        try:
            logger.info(f"🚀 Starting backtest: {strategy_config.get('name', 'Unknown Strategy')}")
            
            # Initialize backtest state
            self._reset_backtest_state(initial_capital)
            
            # Get market data for all symbols
            market_data = {}
            for symbol in symbols:
                data = await self._get_historical_data(symbol, start_date, end_date)
                if data is not None and not data.empty:
                    market_data[symbol] = data
                else:
                    logger.warning(f"No data available for {symbol}")
            
            if not market_data:
                return {"error": "No market data available for backtesting"}
            
            # Run backtest simulation
            results = await self._simulate_strategy(strategy_config, market_data, start_date, end_date)
            
            # Calculate comprehensive metrics
            metrics = self._calculate_metrics(results)
            
            # Generate detailed report
            report = self._generate_backtest_report(strategy_config, results, metrics)
            
            logger.info(f"✅ Backtest completed: Total Return {metrics.total_return:.2%}")
            
            return report
            
        except Exception as e:
            logger.error(f"❌ Backtest failed: {e}")
            return {"error": str(e)}
    
    def _reset_backtest_state(self, initial_capital: float):
        """Reset backtest state for new run"""
        self.initial_capital = initial_capital
        self.cash = initial_capital
        self.portfolio_value = initial_capital
        self.positions.clear()
        self.orders.clear()
        self.trades.clear()
        self.portfolio_history.clear()
    
    async def _get_historical_data(self, symbol: str, start_date: datetime, end_date: datetime) -> Optional[pd.DataFrame]:
        """Get historical market data for backtesting"""
        try:
            # Calculate number of days
            days = (end_date - start_date).days
            
            # Get data from market service
            data = await self.market_service.get_historical_data(symbol, "1d", days)
            
            if data and 'data' in data:
                df = pd.DataFrame(data['data'])
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                df.set_index('timestamp', inplace=True)
                
                # Add technical indicators
                df = self._add_technical_indicators(df)
                
                return df
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get historical data for {symbol}: {e}")
            return None
    
    def _add_technical_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add technical indicators to market data"""
        try:
            # RSI
            df['rsi'] = self._calculate_rsi(df['close'])
            
            # MACD
            df['macd'] = self._calculate_macd(df['close'])
            df['macd_signal'] = df['macd'].ewm(span=9).mean()
            df['macd_histogram'] = df['macd'] - df['macd_signal']
            
            # Bollinger Bands
            bb = self._calculate_bollinger_bands(df['close'])
            df['bb_upper'] = bb['upper']
            df['bb_middle'] = bb['middle']
            df['bb_lower'] = bb['lower']
            df['bb_width'] = (bb['upper'] - bb['lower']) / bb['middle']
            df['bb_position'] = (df['close'] - bb['lower']) / (bb['upper'] - bb['lower'])
            
            # Moving Averages
            df['sma_20'] = df['close'].rolling(window=20).mean()
            df['sma_50'] = df['close'].rolling(window=50).mean()
            df['ema_12'] = df['close'].ewm(span=12).mean()
            df['ema_26'] = df['close'].ewm(span=26).mean()
            
            # Volume indicators
            df['volume_sma'] = df['volume'].rolling(window=20).mean()
            df['volume_ratio'] = df['volume'] / df['volume_sma']
            
            # Price-based indicators
            df['returns'] = df['close'].pct_change()
            df['volatility'] = df['returns'].rolling(window=20).std()
            df['high_low_ratio'] = df['high'] / df['low']
            
            # ATR (Average True Range)
            df['tr'] = np.maximum(
                df['high'] - df['low'],
                np.maximum(
                    abs(df['high'] - df['close'].shift(1)),
                    abs(df['low'] - df['close'].shift(1))
                )
            )
            df['atr'] = df['tr'].rolling(window=14).mean()
            
            return df
            
        except Exception as e:
            logger.error(f"Failed to add technical indicators: {e}")
            return df
    
    async def _simulate_strategy(
        self,
        strategy_config: Dict[str, Any],
        market_data: Dict[str, pd.DataFrame],
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """Simulate strategy execution"""
        
        # Get all unique timestamps and sort them
        all_timestamps = set()
        for symbol, data in market_data.items():
            all_timestamps.update(data.index)
        
        timestamps = sorted(list(all_timestamps))
        
        # Simulate day by day
        for timestamp in timestamps:
            if timestamp < start_date or timestamp > end_date:
                continue
            
            # Update positions with current prices
            await self._update_positions(timestamp, market_data)
            
            # Generate trading signals
            signals = await self._generate_signals(timestamp, strategy_config, market_data)
            
            # Execute trades based on signals
            await self._execute_signals(timestamp, signals, market_data)
            
            # Record portfolio state
            self._record_portfolio_state(timestamp)
        
        return {
            "trades": self.trades,
            "portfolio_history": self.portfolio_history,
            "final_positions": {symbol: asdict(pos) for symbol, pos in self.positions.items()},
            "final_portfolio_value": self.portfolio_value,
            "final_cash": self.cash
        }
    
    async def _update_positions(self, timestamp: datetime, market_data: Dict[str, pd.DataFrame]):
        """Update position values with current market prices"""
        total_position_value = 0.0
        
        for symbol, position in self.positions.items():
            if symbol in market_data and timestamp in market_data[symbol].index:
                current_price = market_data[symbol].loc[timestamp, 'close']
                position.current_price = current_price
                position.unrealized_pnl = (current_price - position.entry_price) * position.quantity
                total_position_value += current_price * position.quantity
        
        self.portfolio_value = self.cash + total_position_value
    
    async def _generate_signals(
        self,
        timestamp: datetime,
        strategy_config: Dict[str, Any],
        market_data: Dict[str, pd.DataFrame]
    ) -> Dict[str, Dict[str, Any]]:
        """Generate trading signals based on strategy configuration"""
        
        signals = {}
        
        for symbol, data in market_data.items():
            if timestamp not in data.index:
                continue
            
            current_data = data.loc[:timestamp].tail(100)  # Use last 100 periods for analysis
            
            if len(current_data) < 50:  # Need minimum data for analysis
                continue
            
            # Get strategy type
            strategy_type = strategy_config.get('strategyType', 'technical')
            
            if strategy_type == 'ai':
                # Use ML models for signal generation
                signal = await self._generate_ai_signal(symbol, current_data, strategy_config)
            elif strategy_type == 'technical':
                # Use technical analysis
                signal = self._generate_technical_signal(symbol, current_data, strategy_config)
            elif strategy_type == 'hybrid':
                # Combine AI and technical analysis
                ai_signal = await self._generate_ai_signal(symbol, current_data, strategy_config)
                tech_signal = self._generate_technical_signal(symbol, current_data, strategy_config)
                signal = self._combine_signals(ai_signal, tech_signal)
            else:
                signal = {"action": "hold", "confidence": 0.0}
            
            if signal["action"] != "hold":
                signals[symbol] = signal
        
        return signals
    
    async def _generate_ai_signal(self, symbol: str, data: pd.DataFrame, strategy_config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI-powered trading signal"""
        try:
            if not self.ml_service or not self.ml_service.is_ready():
                return {"action": "hold", "confidence": 0.0}
            
            # Get price prediction
            price_pred = await self.ml_service.predict_price(symbol, data)
            
            # Get trend classification
            trend_pred = await self.ml_service.classify_trend(symbol, data)
            
            # Combine predictions into signal
            if 'error' in price_pred or 'error' in trend_pred:
                return {"action": "hold", "confidence": 0.0}
            
            current_price = data['close'].iloc[-1]
            predicted_price = price_pred.get('predicted_price', current_price)
            predicted_trend = trend_pred.get('predicted_trend', 'sideways')
            
            # Generate signal based on predictions
            price_change_pct = (predicted_price - current_price) / current_price
            trend_confidence = trend_pred.get('confidence', 0.5)
            
            if predicted_trend == 'bullish' and price_change_pct > 0.02:  # 2% upside
                action = "buy"
                confidence = min(trend_confidence * (1 + abs(price_change_pct)), 1.0)
            elif predicted_trend == 'bearish' and price_change_pct < -0.02:  # 2% downside
                action = "sell"
                confidence = min(trend_confidence * (1 + abs(price_change_pct)), 1.0)
            else:
                action = "hold"
                confidence = 0.0
            
            return {
                "action": action,
                "confidence": confidence,
                "predicted_price": predicted_price,
                "predicted_trend": predicted_trend,
                "price_change_pct": price_change_pct
            }
            
        except Exception as e:
            logger.error(f"AI signal generation failed for {symbol}: {e}")
            return {"action": "hold", "confidence": 0.0}
    
    def _generate_technical_signal(self, symbol: str, data: pd.DataFrame, strategy_config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate technical analysis signal"""
        try:
            latest = data.iloc[-1]
            
            # Get strategy parameters
            params = strategy_config.get('parameters', {})
            entry_conditions = params.get('entryConditions', [])
            
            # Evaluate entry conditions
            buy_score = 0
            sell_score = 0
            total_weight = 0
            
            for condition in entry_conditions:
                condition_text = condition.get('condition', '')
                weight = condition.get('priority', 5) / 10.0  # Normalize to 0-1
                
                # Simple condition evaluation (in production, use a proper expression parser)
                if 'RSI < 30' in condition_text and latest['rsi'] < 30:
                    buy_score += weight
                elif 'RSI > 70' in condition_text and latest['rsi'] > 70:
                    sell_score += weight
                elif 'MACD > 0' in condition_text and latest['macd'] > 0:
                    buy_score += weight
                elif 'MACD < 0' in condition_text and latest['macd'] < 0:
                    sell_score += weight
                elif 'close > sma_20' in condition_text and latest['close'] > latest['sma_20']:
                    buy_score += weight
                elif 'close < sma_20' in condition_text and latest['close'] < latest['sma_20']:
                    sell_score += weight
                
                total_weight += weight
            
            # Determine action
            if total_weight > 0:
                buy_confidence = buy_score / total_weight
                sell_confidence = sell_score / total_weight
                
                if buy_confidence > 0.6:
                    return {"action": "buy", "confidence": buy_confidence}
                elif sell_confidence > 0.6:
                    return {"action": "sell", "confidence": sell_confidence}
            
            return {"action": "hold", "confidence": 0.0}
            
        except Exception as e:
            logger.error(f"Technical signal generation failed for {symbol}: {e}")
            return {"action": "hold", "confidence": 0.0}
    
    def _combine_signals(self, ai_signal: Dict[str, Any], tech_signal: Dict[str, Any]) -> Dict[str, Any]:
        """Combine AI and technical signals"""
        ai_action = ai_signal.get('action', 'hold')
        tech_action = tech_signal.get('action', 'hold')
        ai_confidence = ai_signal.get('confidence', 0.0)
        tech_confidence = tech_signal.get('confidence', 0.0)
        
        # If both signals agree, increase confidence
        if ai_action == tech_action and ai_action != 'hold':
            return {
                "action": ai_action,
                "confidence": min((ai_confidence + tech_confidence) / 2 * 1.2, 1.0)
            }
        
        # If signals disagree, use the one with higher confidence
        if ai_confidence > tech_confidence:
            return ai_signal
        else:
            return tech_signal
    
    async def _execute_signals(self, timestamp: datetime, signals: Dict[str, Dict[str, Any]], market_data: Dict[str, pd.DataFrame]):
        """Execute trading signals"""
        for symbol, signal in signals.items():
            action = signal['action']
            confidence = signal['confidence']
            
            if confidence < 0.5:  # Minimum confidence threshold
                continue
            
            current_price = market_data[symbol].loc[timestamp, 'close']
            
            # Calculate position size based on confidence and risk management
            position_size = self._calculate_position_size(symbol, confidence, current_price)
            
            if action == 'buy' and position_size > 0:
                await self._execute_buy_order(symbol, position_size, current_price, timestamp)
            elif action == 'sell' and symbol in self.positions:
                await self._execute_sell_order(symbol, self.positions[symbol].quantity, current_price, timestamp)
    
    def _calculate_position_size(self, symbol: str, confidence: float, price: float) -> float:
        """Calculate position size based on risk management rules"""
        # Simple position sizing: use percentage of portfolio based on confidence
        max_position_pct = 0.1  # Maximum 10% of portfolio per position
        position_pct = max_position_pct * confidence
        
        position_value = self.portfolio_value * position_pct
        position_size = position_value / price
        
        # Ensure we have enough cash
        required_cash = position_size * price * (1 + self.commission + self.slippage)
        if required_cash > self.cash:
            position_size = self.cash / (price * (1 + self.commission + self.slippage))
        
        return max(0, position_size)
    
    async def _execute_buy_order(self, symbol: str, quantity: float, price: float, timestamp: datetime):
        """Execute buy order"""
        if quantity <= 0:
            return
        
        # Apply slippage and commission
        execution_price = price * (1 + self.slippage)
        commission_cost = quantity * execution_price * self.commission
        total_cost = quantity * execution_price + commission_cost
        
        if total_cost > self.cash:
            return  # Insufficient funds
        
        # Update cash
        self.cash -= total_cost
        
        # Update or create position
        if symbol in self.positions:
            # Average down/up
            existing_pos = self.positions[symbol]
            total_quantity = existing_pos.quantity + quantity
            total_cost_basis = (existing_pos.quantity * existing_pos.entry_price) + (quantity * execution_price)
            avg_price = total_cost_basis / total_quantity
            
            existing_pos.quantity = total_quantity
            existing_pos.entry_price = avg_price
        else:
            # New position
            self.positions[symbol] = BacktestPosition(
                symbol=symbol,
                quantity=quantity,
                entry_price=execution_price,
                entry_timestamp=timestamp,
                current_price=price
            )
        
        # Record trade
        self.trades.append({
            "symbol": symbol,
            "action": "buy",
            "quantity": quantity,
            "price": execution_price,
            "commission": commission_cost,
            "timestamp": timestamp,
            "portfolio_value": self.portfolio_value
        })
    
    async def _execute_sell_order(self, symbol: str, quantity: float, price: float, timestamp: datetime):
        """Execute sell order"""
        if symbol not in self.positions or quantity <= 0:
            return
        
        position = self.positions[symbol]
        sell_quantity = min(quantity, position.quantity)
        
        # Apply slippage and commission
        execution_price = price * (1 - self.slippage)
        commission_cost = sell_quantity * execution_price * self.commission
        total_proceeds = sell_quantity * execution_price - commission_cost
        
        # Calculate realized PnL
        realized_pnl = (execution_price - position.entry_price) * sell_quantity - commission_cost
        
        # Update cash
        self.cash += total_proceeds
        
        # Update position
        position.quantity -= sell_quantity
        position.realized_pnl += realized_pnl
        
        # Remove position if fully closed
        if position.quantity <= 0:
            del self.positions[symbol]
        
        # Record trade
        self.trades.append({
            "symbol": symbol,
            "action": "sell",
            "quantity": sell_quantity,
            "price": execution_price,
            "commission": commission_cost,
            "realized_pnl": realized_pnl,
            "timestamp": timestamp,
            "portfolio_value": self.portfolio_value
        })
    
    def _record_portfolio_state(self, timestamp: datetime):
        """Record current portfolio state"""
        total_unrealized_pnl = sum(pos.unrealized_pnl for pos in self.positions.values())
        total_realized_pnl = sum(pos.realized_pnl for pos in self.positions.values())
        
        self.portfolio_history.append({
            "timestamp": timestamp,
            "portfolio_value": self.portfolio_value,
            "cash": self.cash,
            "positions_value": self.portfolio_value - self.cash,
            "unrealized_pnl": total_unrealized_pnl,
            "realized_pnl": total_realized_pnl,
            "total_pnl": total_unrealized_pnl + total_realized_pnl,
            "num_positions": len(self.positions)
        })
    
    def _calculate_metrics(self, results: Dict[str, Any]) -> BacktestMetrics:
        """Calculate comprehensive backtest metrics"""
        if not self.portfolio_history:
            return BacktestMetrics()
        
        # Convert to DataFrame for easier calculations
        df = pd.DataFrame(self.portfolio_history)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df.set_index('timestamp', inplace=True)
        
        # Calculate returns
        df['returns'] = df['portfolio_value'].pct_change()
        df['cumulative_returns'] = (1 + df['returns']).cumprod() - 1
        
        # Basic metrics
        total_return = (self.portfolio_value - self.initial_capital) / self.initial_capital
        
        # Annualized return
        days = (df.index[-1] - df.index[0]).days
        years = days / 365.25
        annualized_return = (1 + total_return) ** (1 / years) - 1 if years > 0 else 0
        
        # Volatility (annualized)
        volatility = df['returns'].std() * np.sqrt(252)
        
        # Sharpe ratio
        sharpe_ratio = annualized_return / volatility if volatility > 0 else 0
        
        # Sortino ratio (downside deviation)
        downside_returns = df['returns'][df['returns'] < 0]
        downside_deviation = downside_returns.std() * np.sqrt(252)
        sortino_ratio = annualized_return / downside_deviation if downside_deviation > 0 else 0
        
        # Maximum drawdown
        rolling_max = df['portfolio_value'].expanding().max()
        drawdown = (df['portfolio_value'] - rolling_max) / rolling_max
        max_drawdown = drawdown.min()
        
        # Trade statistics
        trades_df = pd.DataFrame(self.trades)
        if not trades_df.empty:
            buy_trades = trades_df[trades_df['action'] == 'buy']
            sell_trades = trades_df[trades_df['action'] == 'sell']
            
            total_trades = len(sell_trades)  # Count completed trades
            winning_trades = len(sell_trades[sell_trades['realized_pnl'] > 0]) if 'realized_pnl' in sell_trades.columns else 0
            losing_trades = total_trades - winning_trades
            
            win_rate = winning_trades / total_trades if total_trades > 0 else 0
            
            if 'realized_pnl' in sell_trades.columns:
                wins = sell_trades[sell_trades['realized_pnl'] > 0]['realized_pnl']
                losses = sell_trades[sell_trades['realized_pnl'] < 0]['realized_pnl']
                
                average_win = wins.mean() if len(wins) > 0 else 0
                average_loss = losses.mean() if len(losses) > 0 else 0
                largest_win = wins.max() if len(wins) > 0 else 0
                largest_loss = losses.min() if len(losses) > 0 else 0
                
                profit_factor = abs(wins.sum() / losses.sum()) if losses.sum() != 0 else 0
            else:
                average_win = average_loss = largest_win = largest_loss = profit_factor = 0
        else:
            total_trades = winning_trades = losing_trades = 0
            win_rate = average_win = average_loss = largest_win = largest_loss = profit_factor = 0
        
        # Calmar ratio
        calmar_ratio = annualized_return / abs(max_drawdown) if max_drawdown != 0 else 0
        
        # VaR and Expected Shortfall
        var_95 = df['returns'].quantile(0.05)
        expected_shortfall = df['returns'][df['returns'] <= var_95].mean()
        
        return BacktestMetrics(
            total_return=total_return,
            annualized_return=annualized_return,
            volatility=volatility,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            max_drawdown=max_drawdown,
            win_rate=win_rate,
            profit_factor=profit_factor,
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            average_win=average_win,
            average_loss=average_loss,
            largest_win=largest_win,
            largest_loss=largest_loss,
            calmar_ratio=calmar_ratio,
            var_95=var_95,
            expected_shortfall=expected_shortfall
        )
    
    def _generate_backtest_report(
        self,
        strategy_config: Dict[str, Any],
        results: Dict[str, Any],
        metrics: BacktestMetrics
    ) -> Dict[str, Any]:
        """Generate comprehensive backtest report"""
        return {
            "strategy": {
                "name": strategy_config.get('name', 'Unknown Strategy'),
                "type": strategy_config.get('strategyType', 'unknown'),
                "description": strategy_config.get('description', ''),
                "parameters": strategy_config.get('parameters', {})
            },
            "backtest_period": {
                "start_date": self.portfolio_history[0]['timestamp'] if self.portfolio_history else None,
                "end_date": self.portfolio_history[-1]['timestamp'] if self.portfolio_history else None,
                "duration_days": len(self.portfolio_history)
            },
            "capital": {
                "initial_capital": self.initial_capital,
                "final_capital": self.portfolio_value,
                "final_cash": self.cash,
                "final_positions_value": self.portfolio_value - self.cash
            },
            "performance": asdict(metrics),
            "trades": results["trades"],
            "portfolio_history": results["portfolio_history"],
            "final_positions": results["final_positions"],
            "risk_metrics": {
                "var_95": metrics.var_95,
                "expected_shortfall": metrics.expected_shortfall,
                "max_drawdown": metrics.max_drawdown,
                "volatility": metrics.volatility
            },
            "generated_at": datetime.now().isoformat(),
            "engine_version": "2.0.0"
        }
    
    def _calculate_rsi(self, prices: pd.Series, period: int = 14) -> pd.Series:
        """Calculate RSI indicator"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        rs = gain / loss
        return 100 - (100 / (1 + rs))
    
    def _calculate_macd(self, prices: pd.Series, fast: int = 12, slow: int = 26) -> pd.Series:
        """Calculate MACD indicator"""
        ema_fast = prices.ewm(span=fast).mean()
        ema_slow = prices.ewm(span=slow).mean()
        return ema_fast - ema_slow
    
    def _calculate_bollinger_bands(self, prices: pd.Series, period: int = 20, std_dev: int = 2) -> Dict[str, pd.Series]:
        """Calculate Bollinger Bands"""
        sma = prices.rolling(window=period).mean()
        std = prices.rolling(window=period).std()
        return {
            'upper': sma + (std * std_dev),
            'middle': sma,
            'lower': sma - (std * std_dev)
        }
    
    async def cleanup(self):
        """Cleanup backtesting engine resources"""
        logger.info("🧹 Cleaning up Backtesting Engine...")
        if self.ml_service:
            await self.ml_service.cleanup()
        self.ready = False