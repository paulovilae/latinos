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

@router.put("/{signal_id}", response_model=schemas.SignalOut)
def update_signal(
    signal_id: int,
    payload: schemas.SignalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_sig = crud.update_signal(db, signal_id, payload)
    if not db_sig:
        raise HTTPException(status_code=404, detail="Signal not found")
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
    return None
