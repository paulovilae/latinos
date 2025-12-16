from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime
from enum import Enum
from typing import List, Dict, Any, Optional

# Create FastAPI app
app = FastAPI(
    title="AI Trading Bot Platform Mock API",
    description="Mock API for bot microservice testing",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SystemStatus(str, Enum):
    RUNNING = "running"
    STOPPED = "stopped"
    ERROR = "error"

# Mock data
mock_formulas = []
mock_system_status = {
    "status": SystemStatus.STOPPED,
    "start_time": None,
    "active_formulas": 0,
    "last_execution": None,
    "next_execution": None,
    "error_message": None,
    "updated_at": datetime.now().isoformat()
}

# Health check endpoint
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# System status endpoint
@app.get("/api/system/status")
async def get_system_status():
    return {
        "id": 1,
        "status": mock_system_status["status"],
        "uptime_seconds": 0,
        "active_formulas": mock_system_status["active_formulas"],
        "last_execution": mock_system_status["last_execution"],
        "next_execution": mock_system_status["next_execution"],
        "error_message": mock_system_status.get("error_message"),
        "start_time": mock_system_status["start_time"],
        "updated_at": datetime.now().isoformat()
    }

# System start endpoint
@app.post("/api/system/start")
async def start_system():
    mock_system_status["status"] = SystemStatus.RUNNING
    mock_system_status["start_time"] = datetime.now().isoformat()
    mock_system_status["updated_at"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "data": {
            "id": 1,
            "status": mock_system_status["status"],
            "active_formulas": mock_system_status["active_formulas"],
            "last_execution": mock_system_status["last_execution"],
            "next_execution": mock_system_status["next_execution"],
            "error_message": mock_system_status.get("error_message"),
            "start_time": mock_system_status["start_time"],
            "updated_at": mock_system_status["updated_at"]
        },
        "message": "Trading system started successfully"
    }

# System stop endpoint
@app.post("/api/system/stop")
async def stop_system():
    mock_system_status["status"] = SystemStatus.STOPPED
    mock_system_status["updated_at"] = datetime.now().isoformat()
    
    return {
        "success": True,
        "data": {
            "id": 1,
            "status": mock_system_status["status"],
            "active_formulas": mock_system_status["active_formulas"],
            "last_execution": mock_system_status["last_execution"],
            "next_execution": mock_system_status["next_execution"],
            "error_message": mock_system_status.get("error_message"),
            "start_time": mock_system_status["start_time"],
            "updated_at": mock_system_status["updated_at"]
        },
        "message": "Trading system stopped successfully"
    }

# Formulas endpoints
@app.get("/api/formulas")
async def get_formulas():
    return mock_formulas

# Run server
if __name__ == "__main__":
    uvicorn.run(app=app, host="0.0.0.0", port=5555, log_level="info")