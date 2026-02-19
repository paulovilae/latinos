from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from .. import schemas, models, crud
from ..db import get_db
from ..dependencies import get_current_user, require_admin
from ..market import fetch_market_series, MARKET_UNIVERSE
from ..constants import PLANS, dashboard_cache
from ..brokers.alpaca_broker import alpaca_client

router = APIRouter(
    prefix="/api",
    tags=["dashboard"],
)

def model_to_dict(model):
    """Helper to convert Alpaca models (swag objects) to dicts for Pydantic"""
    if hasattr(model, '_raw'):
        return model._raw
    return model.__dict__

@router.get("/dashboard/summary", response_model=schemas.DashboardSummary)
def dashboard_summary(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    cache_key = f"dashboard_metrics_{user.id}"
    cached_data = dashboard_cache.get(cache_key)
    
    if cached_data:
        metrics, bots, formulas, signals, backtests = cached_data
    else:
        # Filter by owner or admin
        user_id_filter = None if user.role == "admin" else user.id
        
        user_count = db.query(models.User).count()
        
        bot_query = db.query(models.Bot)
        if user_id_filter:
            bot_query = bot_query.filter(models.Bot.owner_id == user_id_filter)
        bot_count = bot_query.count()
        bots = bot_query.all()

        formula_query = db.query(models.FormulaVersion)
        if user_id_filter:
            formula_query = formula_query.filter(models.FormulaVersion.created_by == user_id_filter)
        formula_count = formula_query.count()
        formulas = formula_query.limit(10).all()

        signal_query = db.query(models.Signal)
        if user_id_filter:
            # Signals are associated with bots. Find bots first.
            owned_bot_ids = db.query(models.Bot.id).filter(models.Bot.owner_id == user.id).all()
            owned_bot_ids = [bid[0] for bid in owned_bot_ids]
            signal_query = signal_query.filter(models.Signal.bot_id.in_(owned_bot_ids))
        signal_count = signal_query.count()
        signals = signal_query.limit(10).all()

        backtest_query = db.query(models.Backtest)
        if user_id_filter:
            # Backtests are associated with bots.
            owned_bot_ids = db.query(models.Bot.id).filter(models.Bot.owner_id == user.id).all()
            owned_bot_ids = [bid[0] for bid in owned_bot_ids]
            backtest_query = backtest_query.filter(models.Backtest.bot_id.in_(owned_bot_ids))
        backtest_count = backtest_query.count()
        backtests = backtest_query.limit(10).all()
        
        metrics = schemas.MetricsResponse(
            users=user_count,
            bots=bot_count,
            formulas=formula_count,
            backtests=backtest_count,
            signals=signal_count,
        )
        dashboard_cache[cache_key] = (metrics, bots, formulas, signals, backtests)

    # Fetch real Alpaca data
    alpaca_account = None
    alpaca_orders = []
    alpaca_positions = []

    if alpaca_client.api:
        try:
            acc = alpaca_client.get_account_summary()
            if acc:
                alpaca_account = model_to_dict(acc)
            
            orders = alpaca_client.get_orders(limit=10)
            alpaca_orders = [model_to_dict(o) for o in orders]
            
            positions = alpaca_client.get_positions()
            alpaca_positions = [model_to_dict(p) for p in positions]
        except Exception as e:
            print(f"Error fetching Alpaca data for dashboard: {e}")

    return schemas.DashboardSummary(
        metrics=metrics,
        bots=bots,
        formulas=formulas,
        signals=signals,
        backtests=backtests,
        plans=PLANS,
        market_universe=[schemas.MarketUniverseItem(**item) for item in MARKET_UNIVERSE],
        subscription_tier=user.subscription_tier or "free",
        alpaca_account=alpaca_account,
        alpaca_orders=alpaca_orders,
        alpaca_positions=alpaca_positions
    )

@router.get("/plans", response_model=List[schemas.Plan])
def list_plans():
    return PLANS

@router.get("/market/series/{symbol}", response_model=schemas.MarketDataResponse)
def get_market_series(symbol: str, range: str = "1y", interval: str = "1d"):
    currency, points = fetch_market_series(symbol, range_=range, interval=interval)
    return schemas.MarketDataResponse(
        symbol=symbol,
        currency=currency,
        range=range,
        interval=interval,
        points=points
    )

@router.get("/admin/metrics", response_model=schemas.MetricsResponse)
def metrics(_: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    return schemas.MetricsResponse(
        users=db.query(models.User).count(),
        bots=db.query(models.Bot).count(),
        formulas=db.query(models.FormulaVersion).count(),
        backtests=db.query(models.Backtest).count(),
        signals=db.query(models.Signal).count(),
    )

@router.get("/admin/health", response_model=schemas.HealthResponse)
def health(_: models.User = Depends(require_admin)):
    return schemas.HealthResponse(status="ok")
