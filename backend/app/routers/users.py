from fastapi import APIRouter, Depends, HTTPException, status, Response
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

@router.options("/me")
def options_me():
    """Handle CORS preflight for /me endpoint"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        }
    )

@router.put("/me", response_model=schemas.UserOut)
def update_me(payload: schemas.UserUpdateRequest, user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.name:
        user.name = payload.name
    if payload.mfa_enabled is not None:
        user.mfa_enabled = payload.mfa_enabled
    if payload.role:
        user.role = payload.role  # Allow users to change their own role for testing
    db.commit()
    db.refresh(user)
    return user

@router.get("/", response_model=List[schemas.UserOut])
def list_users(_: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(models.User).all()
