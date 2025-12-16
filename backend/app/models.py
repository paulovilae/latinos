from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional


@dataclass
class User:
    id: int
    email: str
    name: str
    password: str
    role: str = "user"
    mfa_enabled: bool = False
    stripe_customer_id: Optional[str] = None


@dataclass
class Bot:
    id: int
    name: str
    description: str
    status: str
    owner_id: int
    tags: List[str] = field(default_factory=list)


@dataclass
class FormulaVersion:
    id: int
    bot_id: int
    version: int
    payload: Dict
    created_by: int
    created_at: datetime = field(default_factory=datetime.utcnow)
    published: bool = False
    assets: List[str] = field(default_factory=list)
    notes: Optional[str] = None


@dataclass
class Signal:
    id: int
    bot_id: int
    type: str
    payload: Dict
    emitted_at: datetime
    mode: str
    delivery_status: str = "pending"


@dataclass
class Backtest:
    id: int
    bot_id: int
    formula_version_id: int
    range: str
    market: str
    status: str
    results: Optional[Dict] = None
    submitted_at: datetime = field(default_factory=datetime.utcnow)


@dataclass
class Subscription:
    id: int
    user_id: int
    plan: str
    status: str
    limits: Dict[str, int]
