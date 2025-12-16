"""
Trading Models - Pydantic models for API requests and responses
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class BotConfig(BaseModel):
    """Trading bot configuration model"""
    name: str
    bot_type: str
    risk_level: str
    max_position_size: float
    stop_loss: float
    take_profit: float
    asset_classes: List[str]


class BotSyncRequest(BaseModel):
    """Bot synchronization request from Payload CMS"""
    id: str
    name: str
    bot_type: str = Field(alias="botType")
    status: str
    config: Dict[str, Any]
    performance: Optional[Dict[str, Any]] = None
    
    class Config:
        allow_population_by_field_name = True


class TradingSignal(BaseModel):
    """Trading signal model"""
    symbol: str
    action: str  # buy, sell, hold
    confidence: float
    price: float
    timestamp: datetime
    reasoning: str


class MarketAnalysis(BaseModel):
    """Market analysis model"""
    symbol: str
    sentiment: str
    confidence: float
    support_levels: List[float]
    resistance_levels: List[float]
    technical_signals: Dict[str, str]
    summary: str
    timestamp: datetime


class PerformanceMetrics(BaseModel):
    """Performance metrics model"""
    total_return: float
    win_rate: float
    sharpe_ratio: float
    max_drawdown: float
    total_trades: int
    profitable_trades: int
    average_trade_return: float
    last_updated: datetime


class Position(BaseModel):
    """Trading position model"""
    symbol: str
    quantity: float
    entry_price: float
    current_price: float
    pnl: float
    pnl_percent: float
    timestamp: datetime


class Trade(BaseModel):
    """Trade execution model"""
    bot_id: str
    symbol: str
    action: str
    quantity: float
    price: float
    timestamp: datetime
    status: str
    pnl: Optional[float] = None