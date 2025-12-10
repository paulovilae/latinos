from __future__ import annotations

from fastapi import Depends, FastAPI, HTTPException, status

from .dependencies import DataStore, get_current_user, get_datastore, require_admin
from .models import Bot, User
from .schemas import (
    BacktestCreate,
    BacktestOut,
    BillingCheckoutResponse,
    BillingPortalResponse,
    BotCreate,
    BotOut,
    BotUpdate,
    FormulaCreate,
    FormulaHistoryResponse,
    FormulaOut,
    FormulaPublishRequest,
    HealthResponse,
    LoginRequest,
    MFARequest,
    MetricsResponse,
    PasswordResetRequest,
    RefreshRequest,
    RegisterRequest,
    SignalCreate,
    SignalOut,
    TokenResponse,
    UserCreateRequest,
    UserOut,
    UserUpdateRequest,
)

app = FastAPI(title="Investment Bot Platform")


@app.post("/auth/register", response_model=TokenResponse)
def register(payload: RegisterRequest, datastore: DataStore = Depends(get_datastore)):
    try:
        datastore.create_user(payload.email, payload.password, payload.name, payload.role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    token = datastore.authenticate(payload.email, payload.password)
    return TokenResponse(access_token=token)


@app.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, datastore: DataStore = Depends(get_datastore)):
    try:
        token = datastore.authenticate(payload.email, payload.password)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return TokenResponse(access_token=token)


@app.post("/auth/refresh", response_model=TokenResponse)
def refresh(payload: RefreshRequest, datastore: DataStore = Depends(get_datastore)):
    try:
        token = datastore.refresh(payload.token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc))
    return TokenResponse(access_token=token)


@app.post("/auth/mfa/verify", response_model=HealthResponse)
def verify_mfa(payload: MFARequest):
    if payload.code != "123456":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid MFA code")
    return HealthResponse(status="verified")


@app.post("/auth/password/reset", response_model=HealthResponse)
def reset_password(payload: PasswordResetRequest):
    # Real implementation would dispatch email; stub confirms receipt.
    return HealthResponse(status=f"reset-link-sent:{payload.email}")


@app.get("/users/me", response_model=UserOut)
def get_me(user: User = Depends(get_current_user)):
    return user


@app.put("/users/me", response_model=UserOut)
def update_me(payload: UserUpdateRequest, user: User = Depends(get_current_user), datastore: DataStore = Depends(get_datastore)):
    if payload.name:
        user.name = payload.name
    if payload.mfa_enabled is not None:
        user.mfa_enabled = payload.mfa_enabled
    datastore.users[user.id] = user
    return user


@app.get("/users", response_model=list[UserOut])
def list_users(_: User = Depends(require_admin), datastore: DataStore = Depends(get_datastore)):
    return list(datastore.users.values())


@app.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(payload: UserCreateRequest, _: User = Depends(require_admin), datastore: DataStore = Depends(get_datastore)):
    try:
        return datastore.create_user(payload.email, payload.password, payload.name, payload.role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@app.put("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    _: User = Depends(require_admin),
    datastore: DataStore = Depends(get_datastore),
):
    user = datastore.users.get(user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if payload.name:
        user.name = payload.name
    if payload.mfa_enabled is not None:
        user.mfa_enabled = payload.mfa_enabled
    datastore.users[user.id] = user
    return user


@app.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, _: User = Depends(require_admin), datastore: DataStore = Depends(get_datastore)):
    if user_id in datastore.users:
        datastore.users.pop(user_id)
    return None


@app.post("/bots", response_model=BotOut, status_code=status.HTTP_201_CREATED)
def create_bot(payload: BotCreate, user: User = Depends(get_current_user), datastore: DataStore = Depends(get_datastore)):
    bot = datastore.create_bot(user.id, payload.name, payload.description, payload.tags)
    return bot


@app.get("/bots", response_model=list[BotOut])
def list_bots(user: User = Depends(get_current_user), datastore: DataStore = Depends(get_datastore)):
    # basic owner filter; admins see all
    if user.role == "admin":
        return list(datastore.bots.values())
    return [b for b in datastore.bots.values() if b.owner_id == user.id]


@app.put("/bots/{bot_id}", response_model=BotOut)
def update_bot(
    bot_id: int,
    payload: BotUpdate,
    user: User = Depends(get_current_user),
    datastore: DataStore = Depends(get_datastore),
):
    bot = datastore.bots.get(bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    if payload.name:
        bot.name = payload.name
    if payload.description:
        bot.description = payload.description
    if payload.tags is not None:
        bot.tags = payload.tags
    if payload.status:
        bot.status = payload.status
    datastore.bots[bot.id] = bot
    return bot


@app.delete("/bots/{bot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bot(
    bot_id: int,
    user: User = Depends(get_current_user),
    datastore: DataStore = Depends(get_datastore),
):
    bot = datastore.bots.get(bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    datastore.bots.pop(bot_id)
    return None


@app.post("/bots/{bot_id}/deploy", response_model=BotOut)
def deploy_bot(bot_id: int, user: User = Depends(get_current_user), datastore: DataStore = Depends(get_datastore)):
    bot = datastore.bots.get(bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    bot.status = "running"
    datastore.bots[bot.id] = bot
    return bot


@app.post("/bots/{bot_id}/pause", response_model=BotOut)
def pause_bot(bot_id: int, user: User = Depends(get_current_user), datastore: DataStore = Depends(get_datastore)):
    bot = datastore.bots.get(bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    bot.status = "paused"
    datastore.bots[bot.id] = bot
    return bot


@app.post("/bots/{bot_id}/formulas", response_model=FormulaOut, status_code=status.HTTP_201_CREATED)
def create_formula(
    bot_id: int,
    payload: FormulaCreate,
    user: User = Depends(get_current_user),
    datastore: DataStore = Depends(get_datastore),
):
    bot = datastore.bots.get(bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    formula = datastore.create_formula(bot_id, payload.payload, user.id)
    return formula


@app.post("/formulas/{formula_id}/publish", response_model=FormulaOut)
def publish_formula(
    formula_id: int,
    payload: FormulaPublishRequest,
    user: User = Depends(get_current_user),
    datastore: DataStore = Depends(get_datastore),
):
    formula = datastore.formulas.get(formula_id)
    if not formula:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formula not found")
    bot = datastore.bots.get(formula.bot_id)
    if bot and user.role != "admin" and bot.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    formula.published = payload.published
    datastore.formulas[formula.id] = formula
    return formula


@app.get("/formulas/{formula_id}/history", response_model=FormulaHistoryResponse)
def formula_history(formula_id: int, datastore: DataStore = Depends(get_datastore)):
    formula = datastore.formulas.get(formula_id)
    if not formula:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formula not found")
    history = [f for f in datastore.formulas.values() if f.bot_id == formula.bot_id]
    history.sort(key=lambda f: f.version)
    return FormulaHistoryResponse(history=history)


@app.post("/signals", response_model=SignalOut, status_code=status.HTTP_201_CREATED)
def create_signal(payload: SignalCreate, user: User = Depends(get_current_user), datastore: DataStore = Depends(get_datastore)):
    bot = datastore.bots.get(payload.bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    signal = datastore.add_signal(payload.bot_id, payload.type, payload.payload, payload.mode)
    return signal


@app.get("/signals", response_model=list[SignalOut])
def list_signals(user: User = Depends(get_current_user), datastore: DataStore = Depends(get_datastore)):
    if user.role == "admin":
        return list(datastore.signals.values())
    return [s for s in datastore.signals.values() if datastore.bots.get(s.bot_id, Bot(0, '', '', '', 0)).owner_id == user.id]


@app.post("/backtests", response_model=BacktestOut, status_code=status.HTTP_201_CREATED)
def create_backtest(
    payload: BacktestCreate, user: User = Depends(get_current_user), datastore: DataStore = Depends(get_datastore)
):
    bot = datastore.bots.get(payload.bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bot not found")
    formula = datastore.formulas.get(payload.formula_version_id)
    if not formula or formula.bot_id != bot.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Formula does not belong to bot")
    backtest = datastore.submit_backtest(payload.bot_id, payload.formula_version_id, payload.range, payload.market)
    backtest.status = "completed"
    backtest.results = {"pnl": 42, "hit_rate": 0.75}
    datastore.backtests[backtest.id] = backtest
    return backtest


@app.get("/backtests/{backtest_id}", response_model=BacktestOut)
def get_backtest(backtest_id: int, user: User = Depends(get_current_user), datastore: DataStore = Depends(get_datastore)):
    backtest = datastore.backtests.get(backtest_id)
    if not backtest:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Backtest not found")
    bot = datastore.bots.get(backtest.bot_id)
    if bot and user.role != "admin" and bot.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return backtest


@app.post("/billing/checkout", response_model=BillingCheckoutResponse)
def billing_checkout(user: User = Depends(get_current_user), headers: dict | None = None):
    auth_header = (headers or {}).get("Authorization", "")
    token = auth_header.split(" ", 1)[1] if " " in auth_header else ""
    return BillingCheckoutResponse(checkout_url=f"https://billing.example.com/checkout/{user.id}?token={token}")


@app.get("/billing/portal", response_model=BillingPortalResponse)
def billing_portal(user: User = Depends(get_current_user)):
    return BillingPortalResponse(portal_url=f"https://billing.example.com/portal/{user.id}")


@app.get("/admin/health", response_model=HealthResponse)
def health():
    return HealthResponse(status="ok")


@app.get("/admin/metrics", response_model=MetricsResponse)
def metrics(datastore: DataStore = Depends(get_datastore)):
    return MetricsResponse(
        users=len(datastore.users),
        bots=len(datastore.bots),
        formulas=len(datastore.formulas),
        backtests=len(datastore.backtests),
        signals=len(datastore.signals),
    )


@app.get("/admin/audit-logs", response_model=list[dict])
def audit_logs():
    # Stubbed audit log stream
    return [{"action": "bootstrap", "actor": "system"}]
