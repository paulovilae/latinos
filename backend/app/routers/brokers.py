from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import crud, models, schemas
from ..dependencies import get_db
from .auth import get_current_user

router = APIRouter(
    prefix="/api/brokers",
    tags=["Brokers"],
)

@router.post("/", response_model=schemas.BrokerConnectionOut, status_code=status.HTTP_201_CREATED)
def add_broker_connection(
    payload: schemas.BrokerConnectionCreate, 
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Securely store a broker API key connection for the current user.
    """
    if payload.broker_name.lower() not in ["alpaca", "binance", "tradingview", "interactivebrokers"]:
        raise HTTPException(
            status_code=400, 
            detail="Unsupported broker. Currently supported: 'alpaca', 'binance', 'tradingview', 'interactivebrokers'"
        )
        
    return crud.create_broker_connection(db, broker_in=payload, user_id=user.id)

@router.get("/", response_model=List[schemas.BrokerConnectionOut])
def get_user_broker_connections(
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Retrieve all broker connections for the current user.
    (API Keys and secrets are deliberately excluded from the output schema)
    """
    return crud.get_broker_connections(db, user_id=user.id)

@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_broker_connection(
    connection_id: int, 
    user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """
    Delete a stored broker connection.
    """
    success = crud.delete_broker_connection(db, connection_id=connection_id, user_id=user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Broker connection not found or unauthorized")
    return None
