from __future__ import annotations
import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .routers import auth, users, bots, signals, dashboard, billing, trades

# Load environment variables
from dotenv import load_dotenv
from pathlib import Path

# Load backend .env (if exists)
load_dotenv()

# Load root .env.local (explicitly requested by user)
root_env_path = Path(__file__).resolve().parent.parent.parent / ".env.local"
if root_env_path.exists():
    print(f"📖 Loading config from: {root_env_path}")
    load_dotenv(dotenv_path=root_env_path)
else:
    print(f"⚠️ Config not found at: {root_env_path}")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize database tables
from .db import Base, engine
from . import models  # Import models to register them with Base

app = FastAPI(
    title="Investment Bot Platform - Latinos Trading"
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create all tables on startup
@app.on_event("startup")
def startup_event():
    Base.metadata.create_all(bind=engine)
    
    # Auto-migration: Check if signal_manifest column exists in bots table
    # This is a crude but effective way to handle schema evolution in dev/sqlite
    try:
        with engine.connect() as conn:
            from sqlalchemy import text
            # Try to select the column
            try:
                conn.execute(text("SELECT signal_manifest FROM bots LIMIT 1"))
            except Exception:
                print("⚠️ Column 'signal_manifest' missing in 'bots'. Adding it...")
                conn.execute(text("ALTER TABLE bots ADD COLUMN signal_manifest JSON DEFAULT '[]'"))
                conn.commit()
                print("✅ Column 'signal_manifest' added.")
    except Exception as e:
        print(f"❌ Migration check failed: {e}")

# Middlewares
origins = [
    "http://localhost:3306",
    "https://latinos.paulovila.org",
    "https://apilatinos.paulovila.org",
    "https://api-latinos.paulovila.org",
    "https://back-latinos.paulovila.org",
    "https://api.latinos.paulovila.org",
    "https://latinos-liard.vercel.app",
    "http://localhost:3000"
]

print(f"🌍 Allowed Origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(bots.router)
app.include_router(signals.router)
app.include_router(dashboard.router)
app.include_router(billing.router)
app.include_router(trades.router)

@app.get("/openapi.json")
def openapi_spec():
    return app.openapi()

@app.get("/health")
def health_check():
    try:
        # Check database connectivity
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ok", "service": "latinos-trading-backend", "db": "connected"}
    except Exception as e:
        return {"status": "error", "service": "latinos-trading-backend", "db": "disconnected", "error": str(e)}
