from __future__ import annotations
import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, users, bots, signals, dashboard, billing, trades

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

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

# Middlewares
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv(
        "ALLOWED_ORIGINS", 
        "http://localhost:3003,http://localhost:3306,https://latinos.paulovila.org,https://apilatinos.paulovila.org,https://api-latinos.paulovila.org,https://back-latinos.paulovila.org,https://api.latinos.paulovila.org,https://latinos-liard.vercel.app"
    ).split(","),
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
