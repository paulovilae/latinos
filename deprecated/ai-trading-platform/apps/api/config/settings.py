"""
Configuration settings for the AI Trading Platform API
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    DATABASE_URL: str = "postgresql://trading_user:trading_pass@localhost:5432/trading_platform"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # InfluxDB
    INFLUXDB_URL: str = "http://localhost:8086"
    INFLUXDB_TOKEN: str = "trading-platform-token"
    INFLUXDB_ORG: str = "trading-platform"
    INFLUXDB_BUCKET: str = "market-data"
    
    # Ollama AI
    OLLAMA_URL: str = "http://localhost:11434"
    
    # External APIs
    ALPHA_VANTAGE_API_KEY: Optional[str] = "demo"
    ALPACA_API_KEY: Optional[str] = None
    ALPACA_SECRET_KEY: Optional[str] = None
    ALPACA_BASE_URL: str = "https://paper-api.alpaca.markets"
    
    # Frontend URLs
    FRONTEND_URL: str = "http://localhost:3001"
    MARKETING_URL: str = "http://localhost:3000"
    
    # Payload CMS URLs
    MARKETING_PAYLOAD_URL: str = "http://localhost:3000"
    TRADING_PAYLOAD_URL: str = "http://localhost:3001"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True


def get_settings() -> Settings:
    """Get application settings"""
    return Settings()