from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .. import schemas, models, crud
from ..db import get_db
from ..dependencies import get_current_user, require_admin

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
)

@router.get("/me", response_model=schemas.UserOut)
def get_me(user: models.User = Depends(get_current_user)):
    return user

@router.put("/me", response_model=schemas.UserOut)
def update_me(payload: schemas.UserUpdateRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.name:
        user.name = payload.name
    if payload.mfa_enabled is not None:
        user.mfa_enabled = payload.mfa_enabled
    db.commit()
    db.refresh(user)
    return user

@router.get("/", response_model=List[schemas.UserOut])
def list_users(_: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(models.User).all()
