"""
Simple in-memory database for the bot microservice.
In a production environment, this would be replaced with a real database.
"""
from datetime import datetime
import uuid
from typing import Dict, List, Optional, Any

# In-memory storage
formulas_db: Dict[str, Dict[str, Any]] = {}
trades_db: List[Dict[str, Any]] = []
performance_data = {
    "total_trades": 0,
    "successful_trades": 0,
    "success_rate": 0.0,
    "total_profit_loss": 0.0,
    "profit_loss_percentage": 0.0,
    "max_drawdown": 0.0,
    "period_start": datetime.now(),
    "period_end": datetime.now(),
    "sharpe_ratio": None
}

# System status tracking
system_status = {
    "status": "stopped",  # "running", "stopped", "error"
    "start_time": None,
    "active_formulas": 0,
    "last_execution": None,
    "next_execution": None,
    "error_message": None
}

# Formula operations
def create_formula(formula_data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new formula and return it with generated ID"""
    formula_id = str(uuid.uuid4())
    now = datetime.now()
    
    new_formula = {
        "id": formula_id,
        "created_at": now,
        "updated_at": now,
        **formula_data
    }
    
    formulas_db[formula_id] = new_formula
    system_status["active_formulas"] = len(formulas_db)
    
    return new_formula

def get_formula(formula_id: str) -> Optional[Dict[str, Any]]:
    """Get a formula by ID"""
    return formulas_db.get(formula_id)

def get_all_formulas() -> List[Dict[str, Any]]:
    """Get all formulas"""
    return list(formulas_db.values())

def update_formula(formula_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update a formula and return the updated formula"""
    if formula_id not in formulas_db:
        return None
    
    formula = formulas_db[formula_id]
    
    # Update fields
    for key, value in update_data.items():
        if value is not None:  # Only update provided fields
            formula[key] = value
    
    formula["updated_at"] = datetime.now()
    
    return formula

def delete_formula(formula_id: str) -> bool:
    """Delete a formula by ID"""
    if formula_id not in formulas_db:
        return False
    
    del formulas_db[formula_id]
    system_status["active_formulas"] = len(formulas_db)
    
    return True

# Trade operations
def add_trade(trade_data: Dict[str, Any]) -> Dict[str, Any]:
    """Add a new trade"""
    trade_id = str(uuid.uuid4())
    now = datetime.now()
    
    new_trade = {
        "id": trade_id,
        "created_at": now,
        **trade_data
    }
    
    trades_db.append(new_trade)
    
    # Update performance metrics
    performance_data["total_trades"] += 1
    if trade_data.get("is_successful", False):
        performance_data["successful_trades"] += 1
    
    if performance_data["total_trades"] > 0:
        performance_data["success_rate"] = (
            performance_data["successful_trades"] / performance_data["total_trades"]
        ) * 100
    
    performance_data["period_end"] = now
    
    return new_trade

def get_all_trades() -> List[Dict[str, Any]]:
    """Get all trades"""
    return trades_db

def get_active_trades() -> List[Dict[str, Any]]:
    """Get active trades"""
    return [trade for trade in trades_db if trade.get("status") == "open"]

# System operations
def update_system_status(status_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update system status"""
    for key, value in status_data.items():
        if key in system_status:
            system_status[key] = value
    
    return system_status

def get_system_status() -> Dict[str, Any]:
    """Get current system status"""
    return system_status

# Performance operations
def get_performance_metrics() -> Dict[str, Any]:
    """Get performance metrics"""
    return performance_data

def update_performance_metrics(metrics_data: Dict[str, Any]) -> Dict[str, Any]:
    """Update performance metrics"""
    for key, value in metrics_data.items():
        if key in performance_data:
            performance_data[key] = value
    
    return performance_data