from __future__ import annotations
import os
from typing import Dict, List, Optional
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from . import models, crud
from .db import get_db

load_dotenv()
security = HTTPBearer(auto_error=False)

SECRET_KEY = os.getenv("NEXTAUTH_SECRET", "supersecret")
ALGORITHM = "HS256"

# Keep the demo token for "Legacy" API access if needed, or mapping
DEMO_TOKEN = "demo-admin-token"

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db)
) -> models.User:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Missing authentication credentials"
        )
    
    token = credentials.credentials
    user = None
    
    # 1. Check for legacy demo token (Create admin if not exists, for ease of dev)
    if token == DEMO_TOKEN:
        user = crud.get_user_by_email(db, "demo@latinos.dev")
        if not user:
            # Bootstrap Demo Admin
            from .schemas import UserCreateRequest
            user_in = UserCreateRequest(
                email="demo@latinos.dev", 
                password="demo-password", 
                name="Demo Admin", 
                role="admin"
            )
            user = crud.create_user(db, user_in)
        return user

    # 2. Check for JWT (NextAuth)
    try:
        # NextAuth JWT usually contains 'sub', 'email', 'name', 'iat', 'exp'
        # Verification requires same SECRET and ALGORITHM
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        if email is None:
             raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")
        
        user = crud.get_user_by_email(db, email)
        if user is None:
             # Auto-provision user from JWT if they don't exist?
             # For now, let's auto-provision with default role "user"
             name = payload.get("name", "Unknown")
             # Random password for social users
             from .schemas import UserCreateRequest
             import secrets
             user_in = UserCreateRequest(
                 email=email,
                 password=secrets.token_hex(16),
                 name=name,
                 role="user" 
             )
             user = crud.create_user(db, user_in)
             # Update with avatar if present
             if "picture" in payload:
                 user.avatar_url = payload["picture"]
                 db.commit()
                 
        return user

    except JWTError:
        # 3. Fallback: maybe it's a legacy token-hex? (removed support for simplicity)
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")


def require_admin(user: models.User = Depends(get_current_user)) -> models.User:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Admin privileges required"
        )
    return user
