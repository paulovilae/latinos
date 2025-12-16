"""
AI Trading Platform - Python FastAPI Backend
Main application entry point with AI/ML services and Ollama integration
"""

import asyncio
import os
from contextlib import asynccontextmanager
from typing import Dict, Any

import uvicorn
from fastapi import FastAPI, WebSocket, BackgroundTasks, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from loguru import logger
import pandas as pd
import numpy as np

# Services
from services.ai_analysis import AIAnalysisService
from services.trading_engine import TradingEngine
from services.data_processor import DataProcessor
from services.payload_sync import PayloadSyncService
from services.market_data import MarketDataService
from services.risk_manager import RiskManager

# Models
from models.trading_models import (
    BotConfig,
    TradingSignal,
    MarketAnalysis,
    PerformanceMetrics,
    BotSyncRequest
)

# Database
from database.connection import get_database
from database.models import TradingBot, Trade, Position

# Configuration
from config.settings import get_settings

settings = get_settings()

# Global services
ai_service: AIAnalysisService = None
trading_engine: TradingEngine = None
data_processor: DataProcessor = None
payload_sync: PayloadSyncService = None
market_data_service: MarketDataService = None
risk_manager: RiskManager = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global ai_service, trading_engine, data_processor, payload_sync, market_data_service, risk_manager
    
    logger.info("🚀 Starting AI Trading Platform API...")
    
    # Initialize services
    ai_service = AIAnalysisService()
    trading_engine = TradingEngine()
    data_processor = DataProcessor()
    payload_sync = PayloadSyncService()
    market_data_service = MarketDataService()
    risk_manager = RiskManager()
    
    # Initialize AI models
    await ai_service.initialize_models()
    
    # Start background tasks
    asyncio.create_task(market_data_service.start_real_time_feed())
    asyncio.create_task(trading_engine.start_bot_monitoring())
    
    logger.info("✅ All services initialized successfully")
    
    yield
    
    # Cleanup
    logger.info("🛑 Shutting down AI Trading Platform API...")
    await ai_service.cleanup()
    await trading_engine.stop_all_bots()
    await market_data_service.stop_real_time_feed()


# Create FastAPI application
app = FastAPI(
    title="AI Trading Platform API",
    description="Advanced AI-powered trading platform with real-time analytics",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Marketing
        "http://localhost:3001",  # Trading
        settings.FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# API Routes
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Trading Platform API",
        "version": "2.0.0",
        "status": "operational",
        "services": {
            "ai_analysis": ai_service.is_ready() if ai_service else False,
            "trading_engine": trading_engine.is_ready() if trading_engine else False,
            "market_data": market_data_service.is_ready() if market_data_service else False,
        }
    }


@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": pd.Timestamp.now().isoformat(),
        "services": {
            "database": await get_database().is_connected(),
            "ai_models": await ai_service.health_check() if ai_service else False,
            "market_feed": market_data_service.is_connected() if market_data_service else False,
        }
    }


# Bot Management Endpoints
@app.post("/api/bots/{bot_id}/sync")
async def sync_bot_with_payload(bot_id: str, bot_data: BotSyncRequest):
    """Sync bot configuration from Payload CMS"""
    try:
        # Update bot configuration in trading engine
        await trading_engine.update_bot_config(bot_id, bot_data.dict())
        
        # Sync performance metrics back to Payload
        performance = await trading_engine.get_bot_performance(bot_id)
        await payload_sync.update_bot_performance(bot_id, performance)
        
        return {"status": "synced", "bot_id": bot_id}
    except Exception as e:
        logger.error(f"Failed to sync bot {bot_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/bots/{bot_id}/analysis")
async def get_bot_analysis(bot_id: str):
    """Get AI analysis for a specific bot"""
    try:
        bot_config = await trading_engine.get_bot_config(bot_id)
        analysis = await ai_service.analyze_bot_performance(bot_config)
        return analysis
    except Exception as e:
        logger.error(f"Failed to get analysis for bot {bot_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/bots/{bot_id}/start")
async def start_bot(bot_id: str):
    """Start a trading bot"""
    try:
        result = await trading_engine.start_bot(bot_id)
        return {"status": "started", "bot_id": bot_id, "result": result}
    except Exception as e:
        logger.error(f"Failed to start bot {bot_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/bots/{bot_id}/stop")
async def stop_bot(bot_id: str):
    """Stop a trading bot"""
    try:
        result = await trading_engine.stop_bot(bot_id)
        return {"status": "stopped", "bot_id": bot_id, "result": result}
    except Exception as e:
        logger.error(f"Failed to stop bot {bot_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Market Data Endpoints
@app.get("/api/market/{symbol}")
async def get_market_data(symbol: str, timeframe: str = "1h", limit: int = 100):
    """Get market data for a symbol"""
    try:
        data = await market_data_service.get_historical_data(symbol, timeframe, limit)
        return data
    except Exception as e:
        logger.error(f"Failed to get market data for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/market/{symbol}/analysis")
async def get_market_analysis(symbol: str):
    """Get AI market analysis for a symbol"""
    try:
        market_data = await market_data_service.get_latest_data(symbol)
        analysis = await ai_service.analyze_market_conditions(symbol, market_data)
        return analysis
    except Exception as e:
        logger.error(f"Failed to get market analysis for {symbol}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# WebSocket for Real-time Updates
@app.websocket("/ws/trading/{user_id}")
async def trading_websocket(websocket: WebSocket, user_id: str):
    """Real-time trading updates via WebSocket"""
    await websocket.accept()
    logger.info(f"WebSocket connection established for user {user_id}")
    
    try:
        while True:
            # Get real-time updates for user's bots
            updates = await trading_engine.get_user_updates(user_id)
            
            if updates:
                await websocket.send_json({
                    "type": "trading_update",
                    "timestamp": pd.Timestamp.now().isoformat(),
                    "data": updates
                })
            
            await asyncio.sleep(1)  # Update every second
            
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
    finally:
        logger.info(f"WebSocket connection closed for user {user_id}")


@app.websocket("/ws/market/{symbol}")
async def market_websocket(websocket: WebSocket, symbol: str):
    """Real-time market data via WebSocket"""
    await websocket.accept()
    logger.info(f"Market WebSocket connection established for {symbol}")
    
    try:
        async for market_update in market_data_service.stream_market_data(symbol):
            await websocket.send_json({
                "type": "market_update",
                "symbol": symbol,
                "timestamp": pd.Timestamp.now().isoformat(),
                "data": market_update
            })
            
    except Exception as e:
        logger.error(f"Market WebSocket error for {symbol}: {e}")
    finally:
        logger.info(f"Market WebSocket connection closed for {symbol}")


# AI Analysis Endpoints
@app.post("/api/ai/analyze")
async def analyze_with_ai(request: Dict[str, Any]):
    """General AI analysis endpoint"""
    try:
        analysis_type = request.get("type", "market_analysis")
        data = request.get("data", {})
        
        if analysis_type == "market_analysis":
            result = await ai_service.analyze_market_conditions(data.get("symbol"), data)
        elif analysis_type == "risk_assessment":
            result = await ai_service.assess_risk(data)
        elif analysis_type == "strategy_optimization":
            result = await ai_service.optimize_strategy(data)
        else:
            raise HTTPException(status_code=400, detail="Invalid analysis type")
            
        return result
    except Exception as e:
        logger.error(f"AI analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )