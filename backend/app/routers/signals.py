from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from .. import schemas, models, crud
from ..db import get_db
from ..signals import BacktestEngine, SignalEvaluator
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/signals",
    tags=["signals"],
    responses={404: {"description": "Not found"}},
)

@router.post("/backtest", response_model=schemas.BacktestOut)
def run_backtest_endpoint(
    request: schemas.BacktestCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Executes a backtest for a given stack/bot configuration.
    """
    # 1. Verify Bot/Stack ownership if bot_id is provided
    stack_ids = request.stack_ids
    bot_id = None
    
    if request.bot_id:
        bot = crud.get_bot(db, request.bot_id)
        if not bot:
            raise HTTPException(status_code=404, detail="Bot not found")
        if bot.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
        bot_id = bot.id
        if not stack_ids:
            stack_ids = [s.id for s in bot.signals]
            
    if not stack_ids:
        raise HTTPException(status_code=400, detail="No signals provided for backtest")
    
    # 2. Initialize Engine
    engine = BacktestEngine(db)
    
    # 4. Run Backtest
    # This is synchronous for now - should be async/background for real heavy loads
    result = engine.run(
        stack_ids=stack_ids,
        symbol=request.market,
        days=365,
        take_profit=request.take_profit,
        stop_loss=request.stop_loss,
        initial_capital=request.initial_capital
    )
    
    # 5. Store Result (Optional)
    # db_backtest = models.Backtest(...)
    # db.add(db_backtest)
    # db.commit()
    
    return schemas.BacktestOut(
        id=0, # Placeholder
        bot_id=bot_id,
        range=request.range,
        market=request.market,
        status="completed",
        results=result.dict(),
        submitted_at=datetime.utcnow()
    )

@router.post("/", response_model=schemas.SignalOut)
def create_signal(
    payload: schemas.SignalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check bot ownership if associating signal with bot
    if payload.bot_id:
        bot = crud.get_bot(db, payload.bot_id)
        if not bot or bot.owner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized")
            
    return crud.create_signal(db, payload)

@router.get("/", response_model=List[schemas.SignalOut])
def list_signals(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Returns all signals the current user has access to.
    Only returns 'template' signals (seeded or active in library), 
    filtering out emitted/delivered signals from simulation or live trading.
    """
    return db.query(models.Signal).filter(
        models.Signal.delivery_status.in_(["seeded", "active", "template"])
    ).all()

@router.post("/scan", response_model=schemas.SignalScanResult)
def scan_signals(
    request: schemas.SignalScanRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Test multiple signals against the same market data.
    Returns per-signal PASS/FAIL timelines for heatmap visualization.
    """
    from ..market_data_loader import sync_market_data
    from ..models import MarketData
    from sqlalchemy import func as sqlfunc
    import pandas as pd

    if not request.signal_ids or len(request.signal_ids) == 0:
        raise HTTPException(status_code=400, detail="No signal IDs provided")
    if len(request.signal_ids) > 10:
        raise HTTPException(status_code=400, detail="Max 10 signals per scan")

    symbol = request.symbol.upper()
    days = request.days

    # Fetch signals
    signals = db.query(models.Signal).filter(
        models.Signal.id.in_(request.signal_ids)
    ).all()
    if not signals:
        raise HTTPException(status_code=404, detail="No signals found")

    # Ensure market data exists
    try:
        sync_market_data(db, symbol, "1d", range_="1y", use_synthetic=False)
    except Exception:
        sync_market_data(db, symbol, "1d", range_="30d", use_synthetic=True)

    # Fetch data (deduplicated, with buffer for MA indicators)
    subq = db.query(
        sqlfunc.max(MarketData.id).label("id")
    ).filter(
        MarketData.symbol == symbol,
        MarketData.interval == "1d"
    ).group_by(MarketData.timestamp).subquery()

    query = db.query(MarketData).join(
        subq, MarketData.id == subq.c.id
    ).order_by(MarketData.timestamp.desc()).limit(days + 250)

    data = [
        {"open": d.open, "high": d.high, "low": d.low,
         "close": d.close, "volume": d.volume, "timestamp": d.timestamp}
        for d in query.all()
    ]

    if not data:
        raise HTTPException(status_code=404, detail=f"No market data for {symbol}")

    # Chronological order
    data = data[::-1]
    df = pd.DataFrame(data)

    # Evaluate each signal across the date range
    start_idx = max(0, len(df) - days)
    timestamps = [
        str(df.iloc[i]["timestamp"]) for i in range(start_idx, len(df))
    ]

    signal_results = []
    for sig in signals:
        evaluator = SignalEvaluator(sig, logs=[])
        sig_data = []
        for i in range(start_idx, len(df)):
            ts = df.iloc[i]["timestamp"]
            close = df.iloc[i]["close"]
            evaluator.logs = []
            try:
                res = evaluator.evaluate(df, i, debug=False)
            except Exception:
                res = None
            sig_data.append({
                "timestamp": str(ts),
                "close": float(close),
                "result": res
            })
        signal_results.append(schemas.SignalScanSignalResult(
            signal_id=sig.id,
            name=sig.payload.get("name", f"Signal {sig.id}") if isinstance(sig.payload, dict) else f"Signal {sig.id}",
            results=sig_data
        ))

    return schemas.SignalScanResult(
        symbol=symbol,
        days=days,
        total_candles=len(timestamps),
        timestamps=timestamps,
        signals=signal_results
    )

@router.put("/{signal_id}", response_model=schemas.SignalOut)
def update_signal(
    signal_id: int,
    payload: schemas.SignalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    signal = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    
    # Ownership check
    if signal.bot and signal.bot.owner_id != current_user.id and current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Not authorized")

    db_sig = crud.update_signal(db, signal_id, payload)
    return db_sig

@router.delete("/{signal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_signal(
    signal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    signal = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
    
    # Ownership check
    if signal.bot and signal.bot.owner_id != current_user.id:
         raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(signal)
    db.commit()
@router.post("/{signal_id}/test", response_model=schemas.SignalTestResult)
def test_signal_logic(
    signal_id: int,
    request: schemas.SignalTestRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Test a signal against market data and return detailed execution logs.
    """
    signal = db.query(models.Signal).filter(models.Signal.id == signal_id).first()
    if not signal:
        raise HTTPException(status_code=404, detail="Signal not found")
        
    # Permission Check
    if signal.bot and signal.bot.owner_id != current_user.id and current_user.role != "admin":
         raise HTTPException(status_code=403, detail="Not authorized")

    symbol = request.symbol.upper()
    days = request.days
    
    # Reuse market sync logic from BacktestEngine roughly or just call loader
    from ..market_data_loader import sync_market_data
    from ..models import MarketData
    import pandas as pd
    
    # Ensure data exists
    try:
        sync_market_data(db, symbol, "1d", range_="1y", use_synthetic=False)
    except:
        sync_market_data(db, symbol, "1d", range_="30d", use_synthetic=True)
        
    # Fetch Data - deduplicate by timestamp and use large buffer for MA indicators
    from sqlalchemy import func as sqlfunc
    
    # Subquery to get distinct timestamps (avoids duplicate rows from multiple syncs)
    subq = db.query(
        sqlfunc.max(MarketData.id).label("id")
    ).filter(
        MarketData.symbol == symbol,
        MarketData.interval == "1d"
    ).group_by(MarketData.timestamp).subquery()
    
    query = db.query(MarketData).join(
        subq, MarketData.id == subq.c.id
    ).order_by(MarketData.timestamp.desc()).limit(days + 250)  # Buffer for MA(200)
    
    data = [{"open": d.open, "high": d.high, "low": d.low, "close": d.close, "volume": d.volume, "timestamp": d.timestamp} for d in query.all()]
    
    if not data:
         raise HTTPException(status_code=404, detail=f"No market data found for {symbol}")
         
    # Chronological order
    data = data[::-1]
    df = pd.DataFrame(data)
    
    # Evaluate last N candles
    evaluator = SignalEvaluator(signal, logs=[])
    results = []
    
    # Evaluate last 'days' candles
    start_idx = max(0, len(df) - days)
    
    for i in range(start_idx, len(df)):
        ts = df.iloc[i]["timestamp"]
        close = df.iloc[i]["close"]
        
        # Reset logs for this candle to capture specific logic
        evaluator.logs = []
        try:
            res = evaluator.evaluate(df, i, debug=True)
            log_capture = list(evaluator.logs)
        except Exception as e:
            res = None
            log_capture = [f"💥 Exception: {str(e)}"]
            
        results.append({
            "timestamp": ts,
            "close": close,
            "result": res,
            "logs": log_capture
        })
        
    return schemas.SignalTestResult(
        signal_id=signal.id,
        symbol=symbol,
        days=days,
        total_candles=len(results),
        results=results[::-1], # Return newest first for UI
        logs=[]
    )
