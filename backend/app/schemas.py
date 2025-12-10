from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, EmailStr, Field


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str
    role: str = "user"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    token: str


class MFARequest(BaseModel):
    token: str
    code: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    mfa_enabled: bool

    class Config:
        orm_mode = True


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    mfa_enabled: Optional[bool] = None


class UserCreateRequest(RegisterRequest):
    pass


class BotBase(BaseModel):
    name: str
    description: str
    tags: List[str] = []


class BotCreate(BotBase):
    pass


class BotUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    status: Optional[str] = None


class BotOut(BotBase):
    id: int
    status: str
    owner_id: int

    class Config:
        orm_mode = True


class FormulaCreate(BaseModel):
    payload: Dict


class FormulaOut(BaseModel):
    id: int
    bot_id: int
    version: int
    payload: Dict
    created_by: int
    created_at: datetime
    published: bool

    class Config:
        orm_mode = True


class FormulaHistoryResponse(BaseModel):
    history: List[FormulaOut]


class FormulaPublishRequest(BaseModel):
    published: bool = True


class BacktestCreate(BaseModel):
    bot_id: int
    formula_version_id: int
    range: str
    market: str


class BacktestOut(BaseModel):
    id: int
    bot_id: int
    formula_version_id: int
    range: str
    market: str
    status: str
    results: Optional[Dict]
    submitted_at: datetime

    class Config:
        orm_mode = True


class SignalCreate(BaseModel):
    bot_id: int
    type: str
    payload: Dict
    mode: str = "paper"


class SignalOut(BaseModel):
    id: int
    bot_id: int
    type: str
    payload: Dict
    emitted_at: datetime
    mode: str
    delivery_status: str

    class Config:
        orm_mode = True


class BillingCheckoutResponse(BaseModel):
    checkout_url: str


class BillingPortalResponse(BaseModel):
    portal_url: str


class HealthResponse(BaseModel):
    status: str


class MetricsResponse(BaseModel):
    users: int
    bots: int
    formulas: int
    backtests: int
    signals: int
