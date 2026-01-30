from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models, crud
from ..db import get_db
from ..dependencies import get_current_user
from ..market import fetch_market_series, MARKET_UNIVERSE
from ..constants import PLANS, dashboard_cache

router = APIRouter(
    prefix="/api",
    tags=["dashboard"],
)

@router.get("/dashboard/summary", response_model=schemas.DashboardSummary)
def dashboard_summary(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    cache_key = "dashboard_metrics"
    cached_data = dashboard_cache.get(cache_key)
    
    if cached_data:
        metrics, bots, formulas, signals, backtests = cached_data
    else:
        user_count = db.query(models.User).count()
        bot_count = db.query(models.Bot).count()
        formula_count = db.query(models.FormulaVersion).count()
        signal_count = db.query(models.Signal).count()
        backtest_count = db.query(models.Backtest).count()

        bots = db.query(models.Bot).all()
        formulas = db.query(models.FormulaVersion).limit(10).all() 
        signals = db.query(models.Signal).limit(10).all()
        backtests = db.query(models.Backtest).limit(10).all()
        
        metrics = schemas.MetricsResponse(
            users=user_count,
            bots=bot_count,
            formulas=formula_count,
            backtests=backtest_count,
            signals=signal_count,
        )
        dashboard_cache[cache_key] = (metrics, bots, formulas, signals, backtests)

    return schemas.DashboardSummary(
        metrics=metrics,
        bots=bots,
        formulas=formulas,
        signals=signals,
        backtests=backtests,
        plans=PLANS,
        market_universe=[schemas.MarketUniverseItem(**item) for item in MARKET_UNIVERSE],
        subscription_tier=user.subscription_tier or "free",
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
def metrics(db: Session = Depends(get_db)):
    return schemas.MetricsResponse(
        users=db.query(models.User).count(),
        bots=db.query(models.Bot).count(),
        formulas=db.query(models.FormulaVersion).count(),
        backtests=db.query(models.Backtest).count(),
        signals=db.query(models.Signal).count(),
    )

@router.get("/admin/health", response_model=schemas.HealthResponse)
def health():
    return schemas.HealthResponse(status="ok")
