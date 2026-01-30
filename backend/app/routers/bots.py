from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models, crud, worker
from ..db import get_db
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/bots",
    tags=["bots"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", response_model=schemas.BotOut, status_code=status.HTTP_201_CREATED)
def create_bot(payload: schemas.BotCreate, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role != "admin" and user.subscription_tier != "pro":
        bot_count = db.query(models.Bot).filter(models.Bot.owner_id == user.id).count()
        if bot_count >= 1:
            raise HTTPException(status_code=403, detail="Upgrade to Pro to create more bots.")
            
    return crud.create_bot(db, payload, user.id)

@router.get("/", response_model=List[schemas.BotOut])
def list_bots(user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if user.role == "admin":
        return db.query(models.Bot).all()
    return db.query(models.Bot).filter(models.Bot.owner_id == user.id).all()

@router.put("/{bot_id}", response_model=schemas.BotOut)
def update_bot(
    bot_id: int,
    payload: schemas.BotUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = crud.get_bot(db, bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
    
    if payload.name: bot.name = payload.name
    if payload.description: bot.description = payload.description
    if payload.tags is not None: bot.tags = payload.tags
    if payload.status: bot.status = payload.status
    if payload.script is not None: bot.script = payload.script
    
    db.commit()
    db.refresh(bot)
    return bot

@router.delete("/{bot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_bot(
    bot_id: int,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = crud.get_bot(db, bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
    db.delete(bot)
    db.commit()
    return None

@router.post("/{bot_id}/deploy", response_model=schemas.BotOut)
def deploy_bot(bot_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    bot = crud.get_bot(db, bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
    bot.status = "running"
    db.commit()
    return bot

@router.post("/{bot_id}/pause", response_model=schemas.BotOut)
def pause_bot(bot_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    bot = crud.get_bot(db, bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
    bot.status = "paused"
    db.commit()
    return bot

# Formulas

@router.post("/{bot_id}/formulas", response_model=schemas.FormulaOut, status_code=status.HTTP_201_CREATED)
def create_formula(
    bot_id: int,
    payload: schemas.FormulaCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = crud.get_bot(db, bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
    return crud.create_formula(db, payload, bot_id, user.id)

@router.get("/{bot_id}/formulas", response_model=List[schemas.FormulaOut])
def list_formulas_for_bot(
    bot_id: int, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)
):
    bot = crud.get_bot(db, bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
    return crud.get_formulas(db, bot_id)

@router.put("/formulas/{formula_id}", response_model=schemas.FormulaOut)
def update_formula(
    formula_id: int,
    payload: schemas.FormulaUpdate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    formula = db.query(models.FormulaVersion).filter(models.FormulaVersion.id == formula_id).first()
    if not formula:
        raise HTTPException(status_code=404, detail="Formula not found")
    
    bot = crud.get_bot(db, formula.bot_id)
    if bot and user.role != "admin" and bot.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if payload.payload is not None: formula.payload = payload.payload
    if payload.assets is not None: formula.assets = payload.assets
    if payload.notes is not None: formula.notes = payload.notes
    if payload.published is not None: formula.published = payload.published
    
    db.commit()
    db.refresh(formula)
    return formula

@router.post("/formulas/{formula_id}/publish", response_model=schemas.FormulaOut)
def publish_formula(
    formula_id: int,
    payload: schemas.FormulaPublishRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    formula = db.query(models.FormulaVersion).filter(models.FormulaVersion.id == formula_id).first()
    if not formula:
        raise HTTPException(status_code=404, detail="Formula not found")
    
    bot = crud.get_bot(db, formula.bot_id)
    if bot and user.role != "admin" and bot.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    formula.published = payload.published
    db.commit()
    return formula

@router.get("/formulas/{formula_id}/history", response_model=schemas.FormulaHistoryResponse)
def formula_history(formula_id: int, db: Session = Depends(get_db)):
    formula = db.query(models.FormulaVersion).filter(models.FormulaVersion.id == formula_id).first()
    if not formula:
        raise HTTPException(status_code=404, detail="Formula not found")
    history = db.query(models.FormulaVersion).filter(models.FormulaVersion.bot_id == formula.bot_id).order_by(models.FormulaVersion.version).all()
    return schemas.FormulaHistoryResponse(history=history)

# Backtests

@router.post("/backtests", response_model=schemas.BacktestOut, status_code=status.HTTP_201_CREATED)
def create_backtest(
    payload: schemas.BacktestCreate,
    background_tasks: BackgroundTasks,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = crud.get_bot(db, payload.bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
    
    backtest = crud.create_backtest(db, payload, user.id)
    background_tasks.add_task(worker.run_backtest_task, backtest.id)
    return backtest

# Signals / Webhooks

@router.post("/webhooks/signal", response_model=schemas.SignalOut, status_code=status.HTTP_201_CREATED)
def create_signal(
    payload: schemas.SignalCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bot = crud.get_bot(db, payload.bot_id)
    if not bot or (user.role != "admin" and bot.owner_id != user.id):
        raise HTTPException(status_code=404, detail="Bot not found")
    
    return crud.create_signal(db, payload)
