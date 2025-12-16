"""
Database Connection - PostgreSQL connection management
"""

import asyncio
from typing import Optional
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from loguru import logger

from config.settings import get_settings

settings = get_settings()

# Database engine
engine = None
SessionLocal = None
Base = declarative_base()


class DatabaseManager:
    """Database connection manager"""
    
    def __init__(self):
        self.engine = None
        self.session_factory = None
        self.connected = False
    
    async def initialize(self):
        """Initialize database connection"""
        try:
            # Convert PostgreSQL URL to async
            db_url = settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
            
            self.engine = create_async_engine(
                db_url,
                echo=settings.DEBUG,
                pool_size=10,
                max_overflow=20
            )
            
            self.session_factory = async_sessionmaker(
                self.engine,
                class_=AsyncSession,
                expire_on_commit=False
            )
            
            # Test connection
            async with self.engine.begin() as conn:
                await conn.execute("SELECT 1")
            
            self.connected = True
            logger.info("✅ Database connection established")
            
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            self.connected = False
    
    async def is_connected(self) -> bool:
        """Check if database is connected"""
        if not self.connected or not self.engine:
            return False
        
        try:
            async with self.engine.begin() as conn:
                await conn.execute("SELECT 1")
            return True
        except Exception:
            return False
    
    async def get_session(self) -> AsyncSession:
        """Get database session"""
        if not self.session_factory:
            await self.initialize()
        return self.session_factory()
    
    async def close(self):
        """Close database connection"""
        if self.engine:
            await self.engine.dispose()
            self.connected = False
            logger.info("🔌 Database connection closed")


# Global database manager
db_manager = DatabaseManager()


async def get_database() -> DatabaseManager:
    """Get database manager instance"""
    if not db_manager.connected:
        await db_manager.initialize()
    return db_manager


async def get_db_session() -> AsyncSession:
    """Get database session"""
    return await db_manager.get_session()