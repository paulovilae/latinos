from __future__ import annotations
import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from .routers import auth, users, bots, signals, dashboard, billing, trades, brokers

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
async def startup_event():
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
        
    print("🕒 Initializing Backend Task Scheduler for Automated Backtesting...")
    from .scheduler import init_scheduler
    init_scheduler()

    print("🚀 Triggering Live Trading Daemon...")
    import asyncio
    from .daemon import market_data_loop
    # Fire and forget the daemon background task
    asyncio.create_task(market_data_loop())

# Middlewares
origins = [
    "http://localhost:3306",
    "https://latinos.paulovila.org",
    "https://apilatinos.paulovila.org",
    "https://api-latinos.paulovila.org",
    "https://back-latinos.paulovila.org",
    "https://api-latinos.paulovila.org",
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

from .routers import auth, users, bots, signals, dashboard, billing, trades, brokers, dify_tools

# ... (omitted for brevity, we can just replace the Include Routers block)

# Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(bots.router)
app.include_router(signals.router)
app.include_router(dashboard.router)
app.include_router(billing.router)
app.include_router(trades.router)
app.include_router(brokers.router)
app.include_router(dify_tools.router)

@app.get("/openapi.json")
def openapi_spec():
    return app.openapi()

from fastapi.openapi.utils import get_openapi
from app.routers import dify_tools

@app.get("/api/dify/openapi.json", tags=["Dify Custom Tools"])
def dify_openapi_spec():
    # Generate an isolated OpenAPI schema ONLY for the Dify routes
    # This prevents Dify from choking on 100+ unrelated backend schemas
    dify_schema = get_openapi(
        title="Latinos Strategies",
        version="v2.0.0",
        description="Native, high-performance quantitative indicators running in WASM or Python.",
        routes=dify_tools.router.routes,
    )
    
    # Cleanly set the server URL back to the internal bridge
    dify_schema["servers"] = [{"url": "http://latinos-backend:8000"}]
    
    return dify_schema

@app.get("/health")
def health_check():
    try:
        # Check database connectivity
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "ok", "service": "latinos-trading-backend", "db": "connected"}
    except Exception as e:
        return {"status": "error", "service": "latinos-trading-backend", "db": "disconnected", "error": str(e)}
