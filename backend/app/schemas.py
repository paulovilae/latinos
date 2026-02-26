from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional, Union

from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str = "user"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=2)
    role: str = "user"

    @field_validator("password")
    @classmethod
    def password_complexity(cls, v: str) -> str:
        if not re.match(r"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$", v):
            raise ValueError("Password must contain at least one lowercase letter, one uppercase letter, and one digit")
        return v


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
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True

class BrokerConnectionCreate(BaseModel):
    broker_name: str # e.g., 'alpaca', 'binance'
    api_key: str
    api_secret: str
    is_paper: bool = True

class BrokerConnectionOut(BaseModel):
    id: int
    user_id: int
    broker_name: str
    is_paper: bool
    status: str
    created_at: datetime
    # We never return the api_key or api_secret

    class Config:
        from_attributes = True

class UserUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2)
    mfa_enabled: Optional[bool] = None
    avatar_url: Optional[str] = None
    # role: Optional[str] = None  # Removed to prevent privilege escalation via schema


class UserCreateRequest(RegisterRequest):
    pass


class BotBase(BaseModel):
    name: str
    description: Optional[str] = ""
    script: Optional[str] = ""
    tags: List[str] = []
    live_trading: bool = False
    live_trading_connection_id: Optional[int] = None
    live_metrics: Optional[Dict] = {}

class BotCreate(BotBase):
    signal_ids: Optional[List[Union[int, str, Dict]]] = None  # IDs or Config objects

class BotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    script: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None
    signal_ids: Optional[List[Union[int, str, Dict]]] = None # Allow updating stack
    live_trading: Optional[bool] = None
    live_trading_connection_id: Optional[int] = None
    live_metrics: Optional[Dict] = None

class BotOut(BotBase):
    id: int
    status: str
    owner_id: Optional[int] = None
    is_wasm: Optional[bool] = False
    wasm_base64: Optional[str] = None
    signal_manifest: Optional[List[Union[int, str, Dict]]] = []
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
    created_by: Optional[int] = None
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
    stack_ids: Optional[List[Union[int, str, SignalConfig]]] = None  # List of signal IDs or Configs
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
    symbol: str = Field(..., min_length=1, max_length=20)
    side: str = Field(..., pattern="^(buy|sell)$")
    price: float = Field(..., gt=0)
    amount: float = Field(default=1.0, gt=0)


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
    open: float
    high: float
    low: float
    close: float
    volume: Optional[int] = None


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


class AlpacaOrderOut(BaseModel):
    id: str
    client_order_id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    submitted_at: Optional[datetime] = None
    filled_at: Optional[datetime] = None
    expired_at: Optional[datetime] = None
    canceled_at: Optional[datetime] = None
    failed_at: Optional[datetime] = None
    replaced_at: Optional[datetime] = None
    replaced_by: Optional[str] = None
    replaces: Optional[str] = None
    asset_id: str
    symbol: str
    asset_class: str
    qty: Optional[str] = None
    filled_qty: str
    type: str
    side: str
    time_in_force: str
    limit_price: Optional[str] = None
    stop_price: Optional[str] = None
    filled_avg_price: Optional[str] = None
    status: str
    extended_hours: bool

class AlpacaPositionOut(BaseModel):
    asset_id: str
    symbol: str
    exchange: str
    asset_class: str
    avg_entry_price: str
    qty: str
    side: str
    market_value: str
    cost_basis: str
    unrealized_pl: str
    unrealized_plpc: str
    unrealized_intraday_pl: str
    unrealized_intraday_plpc: str
    current_price: str
    lastday_price: str
    change_today: str

class AlpacaAccountOut(BaseModel):
    id: str
    account_number: str
    status: str
    crypto_status: Optional[str] = None
    currency: str
    buying_power: str
    regt_buying_power: str
    daytrading_buying_power: str
    cash: str
    portfolio_value: str
    equity: str
    last_equity: str
    long_market_value: str
    short_market_value: str
    initial_margin: str
    maintenance_margin: str
    last_maintenance_margin: str
    daytrade_count: int
    sma: str

class DashboardSummary(BaseModel):
    metrics: MetricsResponse
    bots: List[BotOut]
    formulas: List[FormulaOut]
    signals: List[SignalOut]
    backtests: List[BacktestOut]
    plans: List[Plan]
    market_universe: List[MarketUniverseItem]
    subscription_tier: str
    alpaca_account: Optional[AlpacaAccountOut] = None
    alpaca_orders: List[AlpacaOrderOut] = []
    alpaca_positions: List[AlpacaPositionOut] = []

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

class SignalConfig(BaseModel):
    id: str
    invert: bool = False

class BacktestRequest(BaseModel):
    stack_ids: List[Union[str, SignalConfig]]  # Support both for backward compatibility
    symbol: str
    interval: str = "1d"
    range: str = "1y"
    take_profit: float = 5.0
    stop_loss: float = 3.0
    initial_capital: float = 10000.0
    final_capital: float = 10000.0
    total_return_pct: float = 0.0
    max_drawdown: float = 0.0
    history: List[Dict] = []

class BacktestResult(BaseModel):
    total_trades: int
    win_rate: float
    pnl: float
    initial_capital: float = 10000.0
    final_capital: float = 10000.0
    total_return_pct: float = 0.0
    max_drawdown: float = 0.0
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0
    history: List[Dict] = []
    equity_curve: List[Dict] = [] # timestamps + equity values
    logs: List[str] = [] # Execution logs for debugging

class SignalTestRequest(BaseModel):
    symbol: str = "AAPL"
    days: int = 30
    
class SignalTestResult(BaseModel):
    signal_id: int
    symbol: str
    days: int
    total_candles: int
    results: List[Dict] # [{timestamp, close, result, logs}]
    logs: List[str]

class SignalScanRequest(BaseModel):
    signal_ids: List[int]
    symbol: str = "AAPL"
    days: int = 60

class SignalScanSignalResult(BaseModel):
    signal_id: int
    name: str
    results: List[Dict]  # [{timestamp, close, result}]

class SignalScanResult(BaseModel):
    symbol: str
    days: int
    total_candles: int
    timestamps: List[str]  # shared date axis
    signals: List[SignalScanSignalResult]


class BotSimulationRequest(BaseModel):
    symbol: Optional[str] = None  # Override default; if None uses bot's configured stock
    days: int = 5  # How many recent candles to evaluate

class BotSimulationSignalDetail(BaseModel):
    signal_id: int
    name: str
    result: Optional[bool] = None  # True=PASS, False=FAIL, None=ERROR
    inverted: bool = False

class BotSimulationBotResult(BaseModel):
    bot_id: int
    bot_name: str
    symbol: str
    recommendation: str  # "BUY", "SELL", "HOLD", "ERROR"
    confidence: float  # 0-100, percentage of signals that passed
    signals_passed: int
    signals_total: int
    latest_close: float
    timestamp: str
    details: List[BotSimulationSignalDetail] = []

class BotSimulationResult(BaseModel):
    bots: List[BotSimulationBotResult]
    evaluated_at: str


# Rebuild models with forward references
BotOut.model_rebuild()
