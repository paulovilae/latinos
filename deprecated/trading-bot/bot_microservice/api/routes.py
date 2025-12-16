from fastapi import APIRouter, HTTPException, Depends, Body, Query, Path
from typing import List, Dict, Any, Optional
from datetime import datetime
import pandas as pd
import os
import uuid
from pydantic import BaseModel

from formula_manage.formula_manager import Formula_manager
from formula_manage.scheduler import Scheduler
from formula_calc.calculate_formulas import determine_formula_output
from order_manager.orders import check_orders_trailing_stop, getMoneyInPortfolio
from environment_config import EnvironmentConfig
from .models import (
    FormulaCreate,
    FormulaResponse,
    FormulaUpdate,
    TradeResponse,
    PerformanceMetrics,
    SystemStatusResponse,
    SystemStatus
)
from .database import (
    create_formula,
    get_formula,
    get_all_formulas,
    update_formula,
    delete_formula,
    add_trade,
    get_all_trades,
    get_active_trades,
    update_system_status,
    get_system_status,
    get_performance_metrics,
    update_performance_metrics
)

# Create API router
router = APIRouter(prefix="/api")

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check endpoint for the bot microservice"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Get environment config
env_config = EnvironmentConfig()

# Create scheduler
from apscheduler.schedulers.background import BackgroundScheduler
background_scheduler = BackgroundScheduler()
formula_scheduler = Scheduler(background_scheduler)
formula_manager = Formula_manager([determine_formula_output], formula_scheduler)

# Helper function to read trade data from CSV
def read_trade_data():
    """Read trade data from output.csv if it exists"""
    if os.path.exists("output.csv"):
        try:
            df = pd.read_csv("output.csv")
            return df.to_dict('records')
        except Exception as e:
            print(f"Error reading trade data: {e}")
    return []

# Formula Configuration API
@router.post("/formulas", response_model=FormulaResponse)
async def create_formula_endpoint(formula: FormulaCreate):
    """Create a new trading formula configuration"""
    formula_dict = formula.dict()
    
    # Update environment variables
    os.environ["STOCK"] = formula.symbol
    
    # Create formula in database
    formula_data = create_formula(formula_dict)
    
    return formula_data

@router.get("/formulas", response_model=List[FormulaResponse])
async def get_formulas_endpoint():
    """Get all trading formula configurations"""
    return get_all_formulas()

@router.get("/formulas/{formula_id}", response_model=FormulaResponse)
async def get_formula_endpoint(formula_id: str = Path(..., description="The ID of the formula to retrieve")):
    """Get a specific trading formula configuration"""
    formula_data = get_formula(formula_id)
    if not formula_data:
        raise HTTPException(status_code=404, detail="Formula not found")
    
    return formula_data

@router.put("/formulas/{formula_id}", response_model=FormulaResponse)
async def update_formula_endpoint(
    formula_update: FormulaUpdate,
    formula_id: str = Path(..., description="The ID of the formula to update")
):
    """Update a trading formula configuration"""
    # Update environment variables if symbol is provided
    if formula_update.symbol:
        os.environ["STOCK"] = formula_update.symbol
    
    # Update formula in database
    formula_data = update_formula(formula_id, formula_update.dict(exclude_unset=True))
    if not formula_data:
        raise HTTPException(status_code=404, detail="Formula not found")
    
    return formula_data

@router.delete("/formulas/{formula_id}")
async def delete_formula_endpoint(formula_id: str = Path(..., description="The ID of the formula to delete")):
    """Delete a trading formula configuration"""
    deleted = delete_formula(formula_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Formula not found")
    
    return {"detail": "Formula deleted successfully"}

# Trading Status API
@router.get("/trades", response_model=List[TradeResponse])
async def get_trades_endpoint():
    """Get history of executed trades"""
    # First check if we have trades in our database
    trades = get_all_trades()
    
    # If no trades in database, try to read from CSV for backward compatibility
    if not trades:
        # Read trade data from CSV
        trade_data = read_trade_data()
        
        # Process trades from CSV and add to database
        for trade in trade_data:
            if "execute_trade" in trade and trade["execute_trade"]:
                new_trade = {
                    "symbol": trade.get("stock_symbol", "Unknown"),
                    "side": "buy",  # Assuming buy for now
                    "quantity": 0,  # Would be determined from actual trade
                    "price": float(trade.get("current_price", 0)),
                    "status": "filled",
                    "filled_at": datetime.now(),
                    "stop_loss": float(trade.get("stop_loss_price", 0)) if "stop_loss_price" in trade else None,
                    "take_profit": float(trade.get("selling_price", 0)) if "selling_price" in trade else None,
                    "is_successful": False  # Default until we know outcome
                }
                add_trade(new_trade)
        
        # Get updated trades
        trades = get_all_trades()
    
    return trades

@router.get("/trades/current", response_model=List[TradeResponse])
async def get_current_trades_endpoint():
    """Get currently active trades"""
    # First check if we have active trades in our database
    active_trades = get_active_trades()
    
    # If we have API access, get the latest positions from Alpaca
    try:
        if env_config.alpaca_key and env_config.alpaca_secret:
            import alpaca_trade_api as tradeapi
            
            api = tradeapi.REST(
                env_config.alpaca_key,
                env_config.alpaca_secret,
                "https://paper-api.alpaca.markets",
                api_version="v2"
            )
            
            positions = api.list_positions()
            
            # Clear existing active trades and update with current positions
            active_trades = []
            for position in positions:
                trade_data = {
                    "id": position.asset_id,
                    "symbol": position.symbol,
                    "side": "buy" if float(position.qty) > 0 else "sell",
                    "quantity": abs(float(position.qty)),
                    "price": float(position.avg_entry_price),
                    "status": "open",
                    "created_at": datetime.now(),  # Placeholder
                    "filled_at": None,
                    "stop_loss": None,  # Not directly available from position
                    "take_profit": None  # Not directly available from position
                }
                active_trades.append(trade_data)
                
                # We could also add this to our database
                # add_trade(trade_data)
    except Exception as e:
        print(f"Error fetching positions: {e}")
    
    return active_trades

@router.get("/performance", response_model=PerformanceMetrics)
async def get_performance_endpoint():
    """Get performance metrics"""
    # Get performance metrics from database
    metrics = get_performance_metrics()
    
    # If we need to recalculate metrics based on trade data
    trade_data = read_trade_data()
    
    # Only recalculate if we don't have any metrics yet
    if metrics["total_trades"] == 0 and trade_data:
        total_trades = 0
        successful_trades = 0
        
        for trade in trade_data:
            if "execute_trade" in trade and trade["execute_trade"]:
                total_trades += 1
                # In a real system, we would track if the trade was successful
        
        # Calculate success rate
        success_rate = 0
        if total_trades > 0:
            success_rate = (successful_trades / total_trades) * 100
        
        # Update performance metrics
        update_performance_metrics({
            "total_trades": total_trades,
            "successful_trades": successful_trades,
            "success_rate": success_rate,
            "period_end": datetime.now()
        })
        
        # Get updated metrics
        metrics = get_performance_metrics()
    
    return metrics

# System Control API
@router.post("/system/start")
async def start_system_endpoint():
    """Start the trading system"""
    status = get_system_status()
    
    if status["status"] == SystemStatus.RUNNING:
        return {"detail": "System is already running"}
    
    try:
        # Start the formula scheduler
        formula_manager.scedule_formulas()
        
        # Update system status
        active_formula_count = len(get_all_formulas())
        
        update_system_status({
            "status": SystemStatus.RUNNING,
            "start_time": datetime.now(),
            "active_formulas": active_formula_count
        })
        
        return {"detail": "Trading system started successfully"}
    except Exception as e:
        update_system_status({"status": SystemStatus.ERROR, "error_message": str(e)})
        raise HTTPException(status_code=500, detail=f"Failed to start system: {str(e)}")

@router.post("/system/stop")
async def stop_system_endpoint():
    """Stop the trading system"""
    status = get_system_status()
    
    if status["status"] != SystemStatus.RUNNING:
        return {"detail": "System is not running"}
    
    try:
        # Stop the formula scheduler
        background_scheduler.shutdown()
        
        # Update system status
        update_system_status({"status": SystemStatus.STOPPED})
        
        return {"detail": "Trading system stopped successfully"}
    except Exception as e:
        update_system_status({"status": SystemStatus.ERROR, "error_message": str(e)})
        raise HTTPException(status_code=500, detail=f"Failed to stop system: {str(e)}")

@router.get("/system/status", response_model=SystemStatusResponse)
async def get_system_status_endpoint():
    """Get system status"""
    status = get_system_status()
    
    uptime = None
    if status["start_time"] and status["status"] == SystemStatus.RUNNING:
        uptime = (datetime.now() - status["start_time"]).total_seconds()
    
    return {
        "status": status["status"],
        "uptime_seconds": uptime,
        "active_formulas": status["active_formulas"],
        "last_execution": status["last_execution"],
        "next_execution": status["next_execution"],
        "error_message": status.get("error_message")
    }