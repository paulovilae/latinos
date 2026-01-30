from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from jose import jwt

from .. import schemas, models, crud
from ..db import get_db
from ..dependencies import get_current_user, DEMO_TOKEN, SECRET_KEY, ALGORITHM

router = APIRouter(
    prefix="/api/auth",
    tags=["auth"],
)

@router.post("/register", response_model=schemas.TokenResponse)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, payload.email)
    if user:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_user = crud.create_user(db, payload) 
    return schemas.TokenResponse(access_token=DEMO_TOKEN, role=new_user.role) 

@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, payload.email)
    if not user or not crud.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return schemas.TokenResponse(access_token=DEMO_TOKEN, role=user.role) 

@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh(payload: schemas.RefreshRequest):
    return schemas.TokenResponse(access_token=payload.token, role="user") 

@router.post("/google", response_model=schemas.TokenResponse)
def social_login(payload: schemas.SocialLoginRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, payload.email)
    if not user:
        import secrets
        random_pw = secrets.token_urlsafe(16)
        reg_payload = schemas.RegisterRequest(
            email=payload.email,
            name=payload.name,
            password=random_pw,
            role="user"
        )
        user = crud.create_user(db, reg_payload)
    
    token_data = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "iat": datetime.now(timezone.utc),
        "exp": datetime.now(timezone.utc) + timedelta(days=30)
    }
    access_token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    return schemas.TokenResponse(access_token=access_token, role=user.role)

@router.post("/mfa/verify", response_model=schemas.HealthResponse)
def verify_mfa(payload: schemas.MFARequest):
    if payload.code != "123456":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid MFA code")
    return schemas.HealthResponse(status="verified")

@router.post("/password/reset", response_model=schemas.HealthResponse)
def reset_password(payload: schemas.PasswordResetRequest):
    return schemas.HealthResponse(status=f"reset-link-sent:{payload.email}")
