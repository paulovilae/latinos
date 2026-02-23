from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, JSON, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from .db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    password_hash = Column(String)  # Renamed from password to be specific
    role = Column(String, default="admin")
    mfa_enabled = Column(Boolean, default=False)
    avatar_url = Column(String, nullable=True)
    
    # Stripe / Subscription
    stripe_customer_id = Column(String, nullable=True, index=True)
    subscription_status = Column(String, default="free") # free, active, past_due, canceled
    subscription_tier = Column(String, default="free")   # free, pro
    current_period_end = Column(DateTime, nullable=True)

    bots = relationship("Bot", back_populates="owner")
    subscriptions = relationship("Subscription", back_populates="user")
    formulas = relationship("FormulaVersion", back_populates="creator")
    broker_connections = relationship("BrokerConnection", back_populates="user", cascade="all, delete-orphan")

class BrokerConnection(Base):
    __tablename__ = "broker_connections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    broker_name = Column(String, index=True) # e.g., 'alpaca', 'binance'
    api_key_encrypted = Column(String)
    api_secret_encrypted = Column(String)
    is_paper = Column(Boolean, default=True)
    status = Column(String, default="active") # active, error, inactive
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="broker_connections")

class Bot(Base):
    __tablename__ = "bots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    script = Column(String, default="")
    status = Column(String, default="draft")
    owner_id = Column(Integer, ForeignKey("users.id"))
    tags = Column(JSON, default=list)

    owner = relationship("User", back_populates="bots")
    formulas = relationship("FormulaVersion", back_populates="bot", cascade="all, delete-orphan")
    signals = relationship("Signal", back_populates="bot")
    backtests = relationship("Backtest", back_populates="bot", cascade="all, delete-orphan")
    signal_manifest = Column(JSON, default=list) # Stores list of signal IDs for the stack
    live_trading = Column(Boolean, default=False)
    live_trading_connection_id = Column(Integer, ForeignKey("broker_connections.id", ondelete="SET NULL"), nullable=True)

    broker_connection = relationship("BrokerConnection")

class FormulaVersion(Base):
    __tablename__ = "formulas"

    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(Integer, ForeignKey("bots.id", ondelete="CASCADE"))
    version = Column(Integer)
    payload = Column(JSON)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    published = Column(Boolean, default=False)
    assets = Column(JSON, default=list)
    notes = Column(String, nullable=True)

    bot = relationship("Bot", back_populates="formulas")
    creator = relationship("User", back_populates="formulas")
    backtests = relationship("Backtest", back_populates="formula", cascade="all, delete-orphan")

class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(Integer, ForeignKey("bots.id", ondelete="SET NULL"))
    type = Column(String) # buy, sell
    payload = Column(JSON)
    emitted_at = Column(DateTime, default=datetime.utcnow)
    mode = Column(String) # simulation, live
    delivery_status = Column(String, default="pending")

    bot = relationship("Bot", back_populates="signals")

class Backtest(Base):
    __tablename__ = "backtests"

    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(Integer, ForeignKey("bots.id", ondelete="CASCADE"))
    formula_version_id = Column(Integer, ForeignKey("formulas.id", ondelete="CASCADE"))
    range = Column(String)
    market = Column(String)
    status = Column(String, default="queued")
    results = Column(JSON, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)

    bot = relationship("Bot", back_populates="backtests")
    formula = relationship("FormulaVersion", back_populates="backtests")

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    plan = Column(String)
    status = Column(String)
    limits = Column(JSON)

    user = relationship("User", back_populates="subscriptions")

class MarketData(Base):
    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    interval = Column(String, index=True)  # 1d, 1h, 15m
    timestamp = Column(DateTime, index=True)
    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)

class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    bot_id = Column(Integer, ForeignKey("bots.id"), nullable=True)
    signal_id = Column(Integer, ForeignKey("signals.id"), nullable=True)
    symbol = Column(String)
    side = Column(String) # buy, sell
    price = Column(Float)
    amount = Column(Float, default=1.0)
    status = Column(String, default="simulated")
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
    bot = relationship("Bot")
    signal = relationship("Signal")
