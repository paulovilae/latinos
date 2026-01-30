from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "user"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    role: str = "user"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    token: str


class MFARequest(BaseModel):
    token: str
    code: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class SocialLoginRequest(BaseModel):
    email: EmailStr
    name: str
    provider: str = "google"


class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    mfa_enabled: bool
    subscription_tier: str = "free"

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    mfa_enabled: Optional[bool] = None
    role: Optional[str] = None  # Allow role updates for testing


class UserCreateRequest(RegisterRequest):
    pass


class BotBase(BaseModel):
    name: str
    description: Optional[str] = ""
    script: Optional[str] = ""
    tags: List[str] = []


class BotCreate(BotBase):
    signal_ids: Optional[List[int]] = None  # IDs of signals to associate with this bot


class BotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    script: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None


class BotOut(BotBase):
    id: int
    status: str
    owner_id: int
    signals: Optional[List["SignalOut"]] = None

    class Config:
        from_attributes = True


class FormulaBase(BaseModel):
    payload: Dict = Field(default_factory=dict)
    assets: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


class FormulaCreate(FormulaBase):
    pass


class FormulaUpdate(BaseModel):
    payload: Optional[Dict] = None
    assets: Optional[List[str]] = None
    notes: Optional[str] = None
    published: Optional[bool] = None


class FormulaOut(BaseModel):
    id: int
    bot_id: Optional[int] = None
    version: int
    payload: Dict
    created_by: int
    created_at: datetime
    published: bool
    assets: List[str]
    notes: Optional[str]

    class Config:
        from_attributes = True


class FormulaHistoryResponse(BaseModel):
    history: List[FormulaOut]


class FormulaPublishRequest(BaseModel):
    published: bool = True


class BacktestCreate(BaseModel):
    bot_id: Optional[int] = None
    formula_version_id: Optional[int] = None
    range: str
    market: str
    stack: Optional[List[int]] = None  # List of signal IDs to backtest
    take_profit: Optional[float] = 5.0 # Percentage
    stop_loss: Optional[float] = 3.0   # Percentage
    initial_capital: Optional[float] = 10000.0


class BacktestOut(BaseModel):
    id: int
    bot_id: Optional[int] = None
    formula_version_id: Optional[int] = None
    range: str
    market: str
    status: str
    results: Optional[Dict]
    submitted_at: datetime

    class Config:
        from_attributes = True


class SignalCreate(BaseModel):
    bot_id: Optional[int] = None
    type: str
    payload: Dict
    mode: str = "simulation"


class SignalOut(BaseModel):
    id: int
    bot_id: Optional[int] = None
    type: str
    payload: Dict
    emitted_at: datetime
    mode: str
    delivery_status: str

    class Config:
        from_attributes = True


class TradeCreate(BaseModel):
    bot_id: Optional[int] = None
    signal_id: Optional[int] = None
    symbol: str
    side: str
    price: float
    amount: float = 1.0


class TradeOut(BaseModel):
    id: int
    user_id: int
    bot_id: Optional[int] = None
    signal_id: Optional[int] = None
    symbol: str
    side: str
    price: float
    amount: float
    status: str
    timestamp: datetime

    class Config:
        from_attributes = True


class BillingCheckoutResponse(BaseModel):
    checkout_url: str


class BillingPortalResponse(BaseModel):
    portal_url: str


class HealthResponse(BaseModel):
    status: str


class MetricsResponse(BaseModel):
    users: int
    bots: int
    formulas: int
    backtests: int
    signals: int


class MarketPoint(BaseModel):
    timestamp: datetime
    close: float


class MarketDataResponse(BaseModel):
    symbol: str
    currency: Optional[str]
    interval: str
    range: str
    points: List[MarketPoint]


class MarketUniverseItem(BaseModel):
    symbol: str
    name: str
    sector: str


class MarketUniverseResponse(BaseModel):
    universe: List[MarketUniverseItem]


class Plan(BaseModel):
    name: str
    description: str
    limits: str
    price_monthly: str
    price_yearly: str
    features: List[str]


class DashboardSummary(BaseModel):
    metrics: MetricsResponse
    bots: List[BotOut]
    formulas: List[FormulaOut]
    signals: List[SignalOut]
    backtests: List[BacktestOut]
    plans: List[Plan]
    market_universe: List[MarketUniverseItem]
    subscription_tier: str

class SignalType(str):
    FORMULA = "FORMULA"
    PYTHON = "PYTHON"

class SignalDef(BaseModel):
    id: str  # UUID
    name: str
    type: str # SignalType
    code: str # Formula or Python script
    description: Optional[str] = None

class SignalStack(BaseModel):
    id: str # UUID
    name: str
    signals: List[str]  # List of SignalDef IDs

class StackBacktestRequest(BaseModel):
    stack: SignalStack
    symbol: str
    period: int = 365 # days

class BacktestResult(BaseModel):
    total_trades: int
    win_rate: float
    pnl: float
    initial_capital: float = 10000.0
    final_capital: float = 10000.0
    total_return_pct: float = 0.0
    max_drawdown: float = 0.0
    history: List[Dict] = []
    equity_curve: List[Dict] = [] # timestamps + equity values


# Rebuild models with forward references
BotOut.model_rebuild()
