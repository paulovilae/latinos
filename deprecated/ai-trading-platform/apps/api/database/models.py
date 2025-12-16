"""
Database Models - SQLAlchemy models for the trading platform
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database.connection import Base


class TradingBot(Base):
    """Trading bot database model"""
    __tablename__ = "trading_bots"
    __table_args__ = {"schema": "analytics"}
    
    id = Column(String, primary_key=True)
    name = Column(String(100), nullable=False)
    owner_id = Column(String, nullable=False)
    tenant_id = Column(String, nullable=False)
    bot_type = Column(String(50), nullable=False)
    status = Column(String(20), default="paused")
    config = Column(JSON)
    performance = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    trades = relationship("Trade", back_populates="bot")
    positions = relationship("Position", back_populates="bot")


class Trade(Base):
    """Trade execution database model"""
    __tablename__ = "trades"
    __table_args__ = {"schema": "analytics"}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    bot_id = Column(String, ForeignKey("analytics.trading_bots.id"))
    symbol = Column(String(20), nullable=False)
    action = Column(String(10), nullable=False)  # buy, sell
    quantity = Column(Float, nullable=False)
    price = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default="pending")
    pnl = Column(Float)
    fees = Column(Float, default=0.0)
    
    # Relationships
    bot = relationship("TradingBot", back_populates="trades")


class Position(Base):
    """Trading position database model"""
    __tablename__ = "positions"
    __table_args__ = {"schema": "analytics"}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    bot_id = Column(String, ForeignKey("analytics.trading_bots.id"))
    symbol = Column(String(20), nullable=False)
    quantity = Column(Float, nullable=False)
    entry_price = Column(Float, nullable=False)
    current_price = Column(Float)
    pnl = Column(Float)
    pnl_percent = Column(Float)
    opened_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    closed_at = Column(DateTime(timezone=True))
    status = Column(String(20), default="open")
    
    # Relationships
    bot = relationship("TradingBot", back_populates="positions")


class MarketData(Base):
    """Market data database model"""
    __tablename__ = "market_data"
    __table_args__ = {"schema": "analytics"}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    open_price = Column(Float)
    high_price = Column(Float)
    low_price = Column(Float)
    close_price = Column(Float)
    volume = Column(Float)
    timeframe = Column(String(10), default="1m")
    
    # Indexes for efficient querying
    __table_args__ = (
        {"schema": "analytics"},
    )


class AIAnalysis(Base):
    """AI analysis results database model"""
    __tablename__ = "ai_analysis"
    __table_args__ = {"schema": "analytics"}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(20))
    analysis_type = Column(String(50), nullable=False)  # market_analysis, risk_assessment, etc.
    model_used = Column(String(50))
    confidence = Column(Float)
    result = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Additional metadata
    processing_time = Column(Float)  # seconds
    tokens_used = Column(Integer)


class Portfolio(Base):
    """Portfolio database model"""
    __tablename__ = "portfolios"
    __table_args__ = {"schema": "analytics"}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(String, nullable=False)
    tenant_id = Column(String, nullable=False)
    name = Column(String(100), nullable=False)
    total_value = Column(Float, default=0.0)
    cash_balance = Column(Float, default=0.0)
    daily_pnl = Column(Float, default=0.0)
    total_pnl = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class RiskMetrics(Base):
    """Risk metrics database model"""
    __tablename__ = "risk_metrics"
    __table_args__ = {"schema": "analytics"}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    bot_id = Column(String, ForeignKey("analytics.trading_bots.id"))
    portfolio_id = Column(Integer, ForeignKey("analytics.portfolios.id"))
    var_95 = Column(Float)  # Value at Risk 95%
    var_99 = Column(Float)  # Value at Risk 99%
    expected_shortfall = Column(Float)
    sharpe_ratio = Column(Float)
    sortino_ratio = Column(Float)
    max_drawdown = Column(Float)
    beta = Column(Float)
    alpha = Column(Float)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())


class TradingStrategy(Base):
    """Trading strategy database model"""
    __tablename__ = "trading_strategies"
    __table_args__ = {"schema": "analytics"}
    
    id = Column(String, primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    strategy_type = Column(String(50))  # technical, fundamental, ai, hybrid
    parameters = Column(JSON)
    performance_metrics = Column(JSON)
    created_by = Column(String, nullable=False)
    tenant_id = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class BacktestResult(Base):
    """Backtest results database model"""
    __tablename__ = "backtest_results"
    __table_args__ = {"schema": "analytics"}
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    strategy_id = Column(String, ForeignKey("analytics.trading_strategies.id"))
    bot_id = Column(String, ForeignKey("analytics.trading_bots.id"))
    start_date = Column(DateTime(timezone=True))
    end_date = Column(DateTime(timezone=True))
    initial_capital = Column(Float)
    final_capital = Column(Float)
    total_return = Column(Float)
    sharpe_ratio = Column(Float)
    max_drawdown = Column(Float)
    win_rate = Column(Float)
    total_trades = Column(Integer)
    results_data = Column(JSON)  # Detailed backtest data
    created_at = Column(DateTime(timezone=True), server_default=func.now())