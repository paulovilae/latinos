from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
import uuid
from datetime import datetime


class FormulaInterval(str, Enum):
    ONE_MINUTE = "1m"
    FIVE_MINUTES = "5m"
    FIFTEEN_MINUTES = "15m"
    ONE_HOUR = "1h"
    DAILY = "1d"


class FormulaCreate(BaseModel):
    """Model for creating a trading formula configuration"""
    name: str = Field(..., description="Name of the formula")
    symbol: str = Field(..., description="Stock symbol (e.g., AAPL)")
    exchange: str = Field("AMEX", description="Exchange (e.g., AMEX, NASDAQ)")
    interval: FormulaInterval = Field(..., description="Time interval for the formula")
    parameters: Dict[str, Any] = Field(
        ..., description="Formula parameters (e.g., MA period, RSI threshold)"
    )
    is_active: bool = Field(True, description="Whether the formula is active")


class FormulaResponse(BaseModel):
    """Model for formula response"""
    id: str
    name: str
    symbol: str
    exchange: str
    interval: str
    parameters: Dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class FormulaUpdate(BaseModel):
    """Model for updating a trading formula configuration"""
    name: Optional[str] = None
    symbol: Optional[str] = None
    exchange: Optional[str] = None
    interval: Optional[FormulaInterval] = None
    parameters: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None


class TradeStatus(str, Enum):
    OPEN = "open"
    FILLED = "filled"
    CANCELLED = "cancelled"
    EXPIRED = "expired"
    REJECTED = "rejected"


class TradeResponse(BaseModel):
    """Model for trade response"""
    id: str
    symbol: str
    side: str  # buy or sell
    quantity: float
    price: float
    status: TradeStatus
    created_at: datetime
    filled_at: Optional[datetime] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None


class PerformanceMetrics(BaseModel):
    """Model for performance metrics"""
    total_trades: int
    successful_trades: int
    success_rate: float
    total_profit_loss: float
    profit_loss_percentage: float
    max_drawdown: float
    sharpe_ratio: Optional[float] = None
    period_start: datetime
    period_end: datetime


class SystemStatus(str, Enum):
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"


class SystemStatusResponse(BaseModel):
    """Model for system status response"""
    status: SystemStatus
    uptime_seconds: Optional[int] = None
    active_formulas: int
    last_execution: Optional[datetime] = None
    next_execution: Optional[datetime] = None
    error_message: Optional[str] = None


class TokenData(BaseModel):
    """Model for token data"""
    username: str
    permissions: List[str] = []


class ErrorResponse(BaseModel):
    """Model for error response"""
    detail: str