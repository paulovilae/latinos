from __future__ import annotations

import secrets
from datetime import datetime
from typing import Dict, List

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .market import MARKET_UNIVERSE
from .models import Backtest, Bot, FormulaVersion, Signal, Subscription, User

security = HTTPBearer(auto_error=False)


class DataStore:
    def __init__(self) -> None:
        self.users: Dict[int, User] = {}
        self.bots: Dict[int, Bot] = {}
        self.formulas: Dict[int, FormulaVersion] = {}
        self.signals: Dict[int, Signal] = {}
        self.backtests: Dict[int, Backtest] = {}
        self.subscriptions: Dict[int, Subscription] = {}
        self.tokens: Dict[str, int] = {}
        self._user_id = 1
        self._bot_id = 1
        self._formula_id = 1
        self._signal_id = 1
        self._backtest_id = 1
        self._subscription_id = 1
        self.market_universe: List[Dict[str, str]] = [item.copy() for item in MARKET_UNIVERSE]
        self.demo_token = "demo-admin-token"
        self._bootstrapped = False
        self._bootstrap_demo_data()

    def create_user(self, email: str, password: str, name: str, role: str = "user") -> User:
        if any(u.email == email for u in self.users.values()):
            raise ValueError("Email already registered")
        user = User(id=self._user_id, email=email, password=password, name=name, role=role)
        self.users[user.id] = user
        self._user_id += 1
        return user

    def authenticate(self, email: str, password: str) -> str:
        for user in self.users.values():
            if user.email == email and user.password == password:
                token = f"token-{secrets.token_hex(8)}"
                self.tokens[token] = user.id
                return token
        raise ValueError("Invalid credentials")

    def refresh(self, token: str) -> str:
        if token not in self.tokens:
            raise ValueError("Unknown token")
        new_token = f"token-{secrets.token_hex(8)}"
        self.tokens[new_token] = self.tokens[token]
        return new_token

    def current_user(self, token: str) -> User:
        user_id = self.tokens.get(token)
        if not user_id:
            raise ValueError("Invalid token")
        return self.users[user_id]

    def create_bot(self, owner_id: int, name: str, description: str, tags: List[str]) -> Bot:
        bot = Bot(id=self._bot_id, name=name, description=description, status="draft", owner_id=owner_id, tags=tags)
        self.bots[bot.id] = bot
        self._bot_id += 1
        return bot

    def create_formula(
        self, bot_id: int, payload: Dict, created_by: int, assets: List[str] | None = None, notes: str | None = None
    ) -> FormulaVersion:
        version = len([f for f in self.formulas.values() if f.bot_id == bot_id]) + 1
        formula = FormulaVersion(
            id=self._formula_id,
            bot_id=bot_id,
            version=version,
            payload=payload,
            created_by=created_by,
            assets=assets or [],
            notes=notes,
        )
        self.formulas[formula.id] = formula
        self._formula_id += 1
        return formula

    def add_signal(self, bot_id: int, type: str, payload: Dict, mode: str) -> Signal:
        signal = Signal(
            id=self._signal_id, bot_id=bot_id, type=type, payload=payload, emitted_at=datetime.utcnow(), mode=mode
        )
        self.signals[signal.id] = signal
        self._signal_id += 1
        return signal

    def submit_backtest(self, bot_id: int, formula_version_id: int, range: str, market: str) -> Backtest:
        backtest = Backtest(
            id=self._backtest_id,
            bot_id=bot_id,
            formula_version_id=formula_version_id,
            range=range,
            market=market,
            status="queued",
            results=None,
        )
        self.backtests[backtest.id] = backtest
        self._backtest_id += 1
        return backtest

    def create_subscription(self, user_id: int, plan: str, limits: Dict[str, int]) -> Subscription:
        sub = Subscription(id=self._subscription_id, user_id=user_id, plan=plan, status="active", limits=limits)
        self.subscriptions[sub.id] = sub
        self._subscription_id += 1
        return sub

    def list_formulas_for_bot(self, bot_id: int) -> List[FormulaVersion]:
        return sorted([f for f in self.formulas.values() if f.bot_id == bot_id], key=lambda f: f.version, reverse=True)

    def upsert_universe_item(self, symbol: str, name: str, sector: str) -> Dict[str, str]:
        normalized = symbol.upper()
        entry = {"symbol": normalized, "name": name, "sector": sector}
        for idx, item in enumerate(self.market_universe):
            if item["symbol"] == normalized:
                self.market_universe[idx] = entry
                break
        else:
            self.market_universe.append(entry)
        return entry

    def remove_universe_item(self, symbol: str) -> None:
        normalized = symbol.upper()
        self.market_universe = [item for item in self.market_universe if item["symbol"] != normalized]

    def _bootstrap_demo_data(self) -> None:
        if self._bootstrapped:
            return
        demo_admin = self.create_user("demo@latinos.dev", "demo123", "Demo Admin", role="admin")
        self.tokens[self.demo_token] = demo_admin.id
        bot_specs = [
            {
                "name": "Momentum Alpha",
                "description": "High-beta equities breakout bot",
                "tags": ["momentum", "equities"],
                "assets": ["AAPL", "MSFT"],
                "payload": {"logic": {"entry": "close > sma50", "exit": "close < sma20"}},
                "notes": "Focus on liquid mega-caps",
            },
            {
                "name": "Mean Reverter",
                "description": "FX pair mean reversion",
                "tags": ["fx", "mean-reversion"],
                "assets": ["EURUSD", "GBPUSD"],
                "payload": {"logic": {"entry": "spread zscore > 2", "exit": "spread zscore < 0.5"}},
                "notes": "Paper trade only",
            },
        ]
        for spec in bot_specs:
            bot = self.create_bot(demo_admin.id, spec["name"], spec["description"], spec["tags"])
            formula = self.create_formula(bot.id, spec["payload"], demo_admin.id, spec["assets"], spec["notes"])
            formula.published = True
            self.formulas[formula.id] = formula
            signal = self.add_signal(bot.id, "buy", {"note": spec["name"]}, "paper")
            signal.delivery_status = "delivered"
            self.signals[signal.id] = signal
            backtest = self.submit_backtest(bot.id, formula.id, "2020-2024", "NASDAQ")
            backtest.status = "completed"
            backtest.results = {"pnl": 42, "hit_rate": 0.68}
            self.backtests[backtest.id] = backtest
        self._bootstrapped = True


def get_datastore() -> DataStore:
    if not hasattr(get_datastore, "_store"):
        get_datastore._store = DataStore()  # type: ignore[attr-defined]
    return get_datastore._store  # type: ignore[attr-defined]


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security), datastore: DataStore = Depends(get_datastore)
) -> User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    try:
        return datastore.current_user(credentials.credentials)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
    return user
