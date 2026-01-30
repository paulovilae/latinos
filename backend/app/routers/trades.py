from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models, crud
from ..db import get_db
from ..dependencies import get_current_user

router = APIRouter(
    prefix="/api/trades",
    tags=["trades"],
)

@router.post("/", response_model=schemas.TradeOut, status_code=status.HTTP_201_CREATED)
def create_trade(
    payload: schemas.TradeCreate,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Records a simulated or manual trade triggered by a signal.
    """
    return crud.create_trade(db, payload, user.id)

@router.get("/", response_model=List[schemas.TradeOut])
def list_trades(
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Returns the trade history for the current user.
    """
    return db.query(models.Trade).filter(models.Trade.user_id == user.id).all()
