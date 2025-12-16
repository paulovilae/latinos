from apscheduler.schedulers.background import BackgroundScheduler
from environment_config import EnvironmentConfig
from formula_manage.formula_manager import Formula_manager
from formula_manage.scheduler import Scheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from formula_calc.calculate_formulas import determine_formula_output
from api.routes import router as api_router

# Create FastAPI app
app = FastAPI(
    title="AI Trading Bot Platform API",
    description="API for managing trading formulas and system control",
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

# Include API routes
app.include_router(api_router)

# Create an instance of EnvironmentConfig
env_config = EnvironmentConfig()

# This is kept for backward compatibility,
# but formula management is now handled through the API
strategy_list = [determine_formula_output]

# Note: The scheduler is now controlled through the API endpoints
# background_formula_scheduler = BackgroundScheduler()
# formula_scheduler = Scheduler(background_formula_scheduler)
# formula_manager = Formula_manager(strategy_list, formula_scheduler)
# formula_manager.scedule_formulas()

if __name__ == "__main__":
    port = env_config.api_port
    print(f"Starting bot microservice on port {port}")
    
    # Add a health check endpoint directly to the app
    @app.get("/health")
    async def root_health():
        return {"status": "healthy", "timestamp": "now"}
    
    uvicorn.run(app=app, host="0.0.0.0", port=port, log_level="info")
