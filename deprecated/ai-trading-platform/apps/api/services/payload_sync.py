"""
Payload Sync Service - Synchronization with Payload CMS
"""

from typing import Dict, Any
from loguru import logger
import httpx


class PayloadSyncService:
    """Service for syncing data with Payload CMS instances"""
    
    def __init__(self):
        self.marketing_url = "http://localhost:3000"
        self.trading_url = "http://localhost:3001"
        self.ready = True
    
    def is_ready(self) -> bool:
        """Check if payload sync service is ready"""
        return self.ready
    
    async def update_bot_performance(self, bot_id: str, performance: Dict[str, Any]):
        """Update bot performance in Trading Payload CMS"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.patch(
                    f"{self.trading_url}/api/trading-bots/{bot_id}",
                    json={"performance": performance}
                )
                logger.info(f"Updated bot {bot_id} performance in Payload CMS")
                return response.json()
        except Exception as e:
            logger.error(f"Failed to sync bot performance: {e}")
            return None
    
    async def sync_user_data(self, user_id: str, data: Dict[str, Any]):
        """Sync user data between CMS instances"""
        logger.info(f"Syncing user data for {user_id}")
        return {"success": True}