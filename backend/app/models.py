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
    role = Column(String, default="user")
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
    formulas = relationship("FormulaVersion", back_populates="bot")
    signals = relationship("Signal", back_populates="bot")
    backtests = relationship("Backtest", back_populates="bot")

class FormulaVersion(Base):
    __tablename__ = "formulas"

    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(Integer, ForeignKey("bots.id"))
    version = Column(Integer)
    payload = Column(JSON)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    published = Column(Boolean, default=False)
    assets = Column(JSON, default=list)
    notes = Column(String, nullable=True)

    bot = relationship("Bot", back_populates="formulas")
    creator = relationship("User", back_populates="formulas")
    backtests = relationship("Backtest", back_populates="formula")

class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(Integer, ForeignKey("bots.id"))
    type = Column(String) # buy, sell
    payload = Column(JSON)
    emitted_at = Column(DateTime, default=datetime.utcnow)
    mode = Column(String) # paper, live
    delivery_status = Column(String, default="pending")

    bot = relationship("Bot", back_populates="signals")

class Backtest(Base):
    __tablename__ = "backtests"

    id = Column(Integer, primary_key=True, index=True)
    bot_id = Column(Integer, ForeignKey("bots.id"))
    formula_version_id = Column(Integer, ForeignKey("formulas.id"))
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
