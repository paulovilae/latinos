from __future__ import annotations
import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
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

# Initialize database tables
from .db import Base, engine
from . import models  # Import models to register them with Base

app = FastAPI(
    title="Investment Bot Platform - Latinos Trading"
)

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
origins_raw = os.getenv("ALLOWED_ORIGINS", "http://localhost:3306")
origins = [origin.strip() for origin in origins_raw.split(",") if origin.strip()]

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
    return {"status": "ok", "service": "latinos-trading-backend"}
