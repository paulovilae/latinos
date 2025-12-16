"""
WebSocket Manager - Real-time communication and notifications
"""

import asyncio
import json
from typing import Dict, Any, List, Set, Optional, Callable
from datetime import datetime
from dataclasses import dataclass, asdict
from enum import Enum
import uuid

from fastapi import WebSocket, WebSocketDisconnect
from loguru import logger
from config.settings import get_settings

settings = get_settings()


class MessageType(Enum):
    """WebSocket message types"""
    TRADING_UPDATE = "trading_update"
    MARKET_DATA = "market_data"
    BOT_STATUS = "bot_status"
    PORTFOLIO_UPDATE = "portfolio_update"
    ALERT = "alert"
    NOTIFICATION = "notification"
    HEARTBEAT = "heartbeat"
    ERROR = "error"
    SYSTEM_STATUS = "system_status"


class AlertLevel(Enum):
    """Alert severity levels"""
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


@dataclass
class WebSocketMessage:
    """WebSocket message structure"""
    type: MessageType
    data: Dict[str, Any]
    timestamp: datetime
    user_id: Optional[str] = None
    tenant_id: Optional[str] = None
    message_id: str = None
    
    def __post_init__(self):
        if self.message_id is None:
            self.message_id = str(uuid.uuid4())


@dataclass
class ConnectionInfo:
    """WebSocket connection information"""
    websocket: WebSocket
    user_id: str
    tenant_id: str
    connection_id: str
    connected_at: datetime
    last_heartbeat: datetime
    subscriptions: Set[str]
    
    def __post_init__(self):
        if not hasattr(self, 'subscriptions'):
            self.subscriptions = set()


class WebSocketManager:
    """Advanced WebSocket manager for real-time features"""
    
    def __init__(self):
        # Connection management
        self.connections: Dict[str, ConnectionInfo] = {}
        self.user_connections: Dict[str, Set[str]] = {}  # user_id -> connection_ids
        self.tenant_connections: Dict[str, Set[str]] = {}  # tenant_id -> connection_ids
        
        # Subscription management
        self.topic_subscribers: Dict[str, Set[str]] = {}  # topic -> connection_ids
        
        # Message queues and handlers
        self.message_queue: asyncio.Queue = asyncio.Queue()
        self.message_handlers: Dict[MessageType, List[Callable]] = {}
        
        # Background tasks
        self.heartbeat_task: Optional[asyncio.Task] = None
        self.message_processor_task: Optional[asyncio.Task] = None
        self.cleanup_task: Optional[asyncio.Task] = None
        
        # Configuration
        self.heartbeat_interval = 30  # seconds
        self.connection_timeout = 300  # 5 minutes
        self.max_connections_per_user = 5
        
        self.ready = False
    
    async def initialize(self):
        """Initialize WebSocket manager"""
        logger.info("🔌 Initializing WebSocket Manager...")
        
        try:
            # Start background tasks
            self.heartbeat_task = asyncio.create_task(self._heartbeat_loop())
            self.message_processor_task = asyncio.create_task(self._process_messages())
            self.cleanup_task = asyncio.create_task(self._cleanup_connections())
            
            # Register default message handlers
            self._register_default_handlers()
            
            self.ready = True
            logger.info("✅ WebSocket Manager initialized")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize WebSocket manager: {e}")
            self.ready = False
    
    def is_ready(self) -> bool:
        """Check if WebSocket manager is ready"""
        return self.ready
    
    async def connect(self, websocket: WebSocket, user_id: str, tenant_id: str) -> str:
        """Handle new WebSocket connection"""
        try:
            await websocket.accept()
            
            # Check connection limits
            user_connection_count = len(self.user_connections.get(user_id, set()))
            if user_connection_count >= self.max_connections_per_user:
                await websocket.close(code=1008, reason="Too many connections")
                return None
            
            # Create connection info
            connection_id = str(uuid.uuid4())
            connection_info = ConnectionInfo(
                websocket=websocket,
                user_id=user_id,
                tenant_id=tenant_id,
                connection_id=connection_id,
                connected_at=datetime.now(),
                last_heartbeat=datetime.now(),
                subscriptions=set()
            )
            
            # Store connection
            self.connections[connection_id] = connection_info
            
            # Update user and tenant mappings
            if user_id not in self.user_connections:
                self.user_connections[user_id] = set()
            self.user_connections[user_id].add(connection_id)
            
            if tenant_id not in self.tenant_connections:
                self.tenant_connections[tenant_id] = set()
            self.tenant_connections[tenant_id].add(connection_id)
            
            # Send welcome message
            await self.send_to_connection(connection_id, WebSocketMessage(
                type=MessageType.SYSTEM_STATUS,
                data={
                    "status": "connected",
                    "connection_id": connection_id,
                    "server_time": datetime.now().isoformat(),
                    "features": ["trading_updates", "market_data", "notifications", "alerts"]
                },
                timestamp=datetime.now(),
                user_id=user_id,
                tenant_id=tenant_id
            ))
            
            logger.info(f"✅ WebSocket connected: {connection_id} (user: {user_id})")
            return connection_id
            
        except Exception as e:
            logger.error(f"❌ WebSocket connection failed: {e}")
            return None
    
    async def disconnect(self, connection_id: str):
        """Handle WebSocket disconnection"""
        try:
            if connection_id not in self.connections:
                return
            
            connection_info = self.connections[connection_id]
            user_id = connection_info.user_id
            tenant_id = connection_info.tenant_id
            
            # Remove from subscriptions
            for topic in connection_info.subscriptions:
                if topic in self.topic_subscribers:
                    self.topic_subscribers[topic].discard(connection_id)
                    if not self.topic_subscribers[topic]:
                        del self.topic_subscribers[topic]
            
            # Remove from mappings
            if user_id in self.user_connections:
                self.user_connections[user_id].discard(connection_id)
                if not self.user_connections[user_id]:
                    del self.user_connections[user_id]
            
            if tenant_id in self.tenant_connections:
                self.tenant_connections[tenant_id].discard(connection_id)
                if not self.tenant_connections[tenant_id]:
                    del self.tenant_connections[tenant_id]
            
            # Remove connection
            del self.connections[connection_id]
            
            logger.info(f"🔌 WebSocket disconnected: {connection_id}")
            
        except Exception as e:
            logger.error(f"❌ WebSocket disconnection error: {e}")
    
    async def handle_message(self, connection_id: str, message: str):
        """Handle incoming WebSocket message"""
        try:
            if connection_id not in self.connections:
                return
            
            # Parse message
            data = json.loads(message)
            message_type = data.get('type')
            payload = data.get('data', {})
            
            connection_info = self.connections[connection_id]
            
            # Update heartbeat
            connection_info.last_heartbeat = datetime.now()
            
            # Handle different message types
            if message_type == 'subscribe':
                await self._handle_subscription(connection_id, payload)
            elif message_type == 'unsubscribe':
                await self._handle_unsubscription(connection_id, payload)
            elif message_type == 'heartbeat':
                await self._handle_heartbeat(connection_id)
            elif message_type == 'trading_command':
                await self._handle_trading_command(connection_id, payload)
            else:
                logger.warning(f"Unknown message type: {message_type}")
            
        except json.JSONDecodeError:
            await self.send_error(connection_id, "Invalid JSON message")
        except Exception as e:
            logger.error(f"Message handling error: {e}")
            await self.send_error(connection_id, str(e))
    
    async def _handle_subscription(self, connection_id: str, payload: Dict[str, Any]):
        """Handle subscription request"""
        topics = payload.get('topics', [])
        connection_info = self.connections[connection_id]
        
        for topic in topics:
            # Add to connection subscriptions
            connection_info.subscriptions.add(topic)
            
            # Add to topic subscribers
            if topic not in self.topic_subscribers:
                self.topic_subscribers[topic] = set()
            self.topic_subscribers[topic].add(connection_id)
        
        # Send confirmation
        await self.send_to_connection(connection_id, WebSocketMessage(
            type=MessageType.SYSTEM_STATUS,
            data={
                "action": "subscribed",
                "topics": topics,
                "total_subscriptions": len(connection_info.subscriptions)
            },
            timestamp=datetime.now(),
            user_id=connection_info.user_id,
            tenant_id=connection_info.tenant_id
        ))
        
        logger.info(f"📡 Subscribed {connection_id} to topics: {topics}")
    
    async def _handle_unsubscription(self, connection_id: str, payload: Dict[str, Any]):
        """Handle unsubscription request"""
        topics = payload.get('topics', [])
        connection_info = self.connections[connection_id]
        
        for topic in topics:
            # Remove from connection subscriptions
            connection_info.subscriptions.discard(topic)
            
            # Remove from topic subscribers
            if topic in self.topic_subscribers:
                self.topic_subscribers[topic].discard(connection_id)
                if not self.topic_subscribers[topic]:
                    del self.topic_subscribers[topic]
        
        # Send confirmation
        await self.send_to_connection(connection_id, WebSocketMessage(
            type=MessageType.SYSTEM_STATUS,
            data={
                "action": "unsubscribed",
                "topics": topics,
                "total_subscriptions": len(connection_info.subscriptions)
            },
            timestamp=datetime.now(),
            user_id=connection_info.user_id,
            tenant_id=connection_info.tenant_id
        ))
    
    async def _handle_heartbeat(self, connection_id: str):
        """Handle heartbeat message"""
        await self.send_to_connection(connection_id, WebSocketMessage(
            type=MessageType.HEARTBEAT,
            data={"server_time": datetime.now().isoformat()},
            timestamp=datetime.now()
        ))
    
    async def _handle_trading_command(self, connection_id: str, payload: Dict[str, Any]):
        """Handle trading command from client"""
        # This would integrate with the trading engine
        command = payload.get('command')
        bot_id = payload.get('bot_id')
        
        if command == 'start_bot':
            # Start trading bot
            await self.send_to_connection(connection_id, WebSocketMessage(
                type=MessageType.BOT_STATUS,
                data={
                    "bot_id": bot_id,
                    "status": "starting",
                    "message": "Bot start command received"
                },
                timestamp=datetime.now()
            ))
        elif command == 'stop_bot':
            # Stop trading bot
            await self.send_to_connection(connection_id, WebSocketMessage(
                type=MessageType.BOT_STATUS,
                data={
                    "bot_id": bot_id,
                    "status": "stopping",
                    "message": "Bot stop command received"
                },
                timestamp=datetime.now()
            ))
    
    async def send_to_connection(self, connection_id: str, message: WebSocketMessage):
        """Send message to specific connection"""
        try:
            if connection_id not in self.connections:
                return False
            
            connection_info = self.connections[connection_id]
            websocket = connection_info.websocket
            
            # Prepare message
            message_data = {
                "type": message.type.value,
                "data": message.data,
                "timestamp": message.timestamp.isoformat(),
                "message_id": message.message_id
            }
            
            if message.user_id:
                message_data["user_id"] = message.user_id
            if message.tenant_id:
                message_data["tenant_id"] = message.tenant_id
            
            # Send message
            await websocket.send_text(json.dumps(message_data))
            return True
            
        except WebSocketDisconnect:
            await self.disconnect(connection_id)
            return False
        except Exception as e:
            logger.error(f"Failed to send message to {connection_id}: {e}")
            return False
    
    async def send_to_user(self, user_id: str, message: WebSocketMessage):
        """Send message to all connections of a user"""
        if user_id not in self.user_connections:
            return 0
        
        sent_count = 0
        connection_ids = list(self.user_connections[user_id])  # Copy to avoid modification during iteration
        
        for connection_id in connection_ids:
            if await self.send_to_connection(connection_id, message):
                sent_count += 1
        
        return sent_count
    
    async def send_to_tenant(self, tenant_id: str, message: WebSocketMessage):
        """Send message to all connections of a tenant"""
        if tenant_id not in self.tenant_connections:
            return 0
        
        sent_count = 0
        connection_ids = list(self.tenant_connections[tenant_id])
        
        for connection_id in connection_ids:
            if await self.send_to_connection(connection_id, message):
                sent_count += 1
        
        return sent_count
    
    async def broadcast_to_topic(self, topic: str, message: WebSocketMessage):
        """Broadcast message to all subscribers of a topic"""
        if topic not in self.topic_subscribers:
            return 0
        
        sent_count = 0
        connection_ids = list(self.topic_subscribers[topic])
        
        for connection_id in connection_ids:
            if await self.send_to_connection(connection_id, message):
                sent_count += 1
        
        return sent_count
    
    async def broadcast_to_all(self, message: WebSocketMessage):
        """Broadcast message to all connected clients"""
        sent_count = 0
        connection_ids = list(self.connections.keys())
        
        for connection_id in connection_ids:
            if await self.send_to_connection(connection_id, message):
                sent_count += 1
        
        return sent_count
    
    async def send_alert(self, user_id: str, level: AlertLevel, title: str, message: str, data: Dict[str, Any] = None):
        """Send alert to user"""
        alert_message = WebSocketMessage(
            type=MessageType.ALERT,
            data={
                "level": level.value,
                "title": title,
                "message": message,
                "data": data or {},
                "alert_id": str(uuid.uuid4())
            },
            timestamp=datetime.now(),
            user_id=user_id
        )
        
        return await self.send_to_user(user_id, alert_message)
    
    async def send_notification(self, user_id: str, title: str, message: str, data: Dict[str, Any] = None):
        """Send notification to user"""
        notification_message = WebSocketMessage(
            type=MessageType.NOTIFICATION,
            data={
                "title": title,
                "message": message,
                "data": data or {},
                "notification_id": str(uuid.uuid4())
            },
            timestamp=datetime.now(),
            user_id=user_id
        )
        
        return await self.send_to_user(user_id, notification_message)
    
    async def send_error(self, connection_id: str, error_message: str):
        """Send error message to connection"""
        error_msg = WebSocketMessage(
            type=MessageType.ERROR,
            data={
                "error": error_message,
                "timestamp": datetime.now().isoformat()
            },
            timestamp=datetime.now()
        )
        
        return await self.send_to_connection(connection_id, error_msg)
    
    async def _heartbeat_loop(self):
        """Background task to send heartbeats and check connection health"""
        while self.ready:
            try:
                current_time = datetime.now()
                stale_connections = []
                
                # Check for stale connections
                for connection_id, connection_info in self.connections.items():
                    time_since_heartbeat = (current_time - connection_info.last_heartbeat).total_seconds()
                    
                    if time_since_heartbeat > self.connection_timeout:
                        stale_connections.append(connection_id)
                
                # Remove stale connections
                for connection_id in stale_connections:
                    logger.warning(f"Removing stale connection: {connection_id}")
                    await self.disconnect(connection_id)
                
                # Send heartbeat to active connections
                heartbeat_message = WebSocketMessage(
                    type=MessageType.HEARTBEAT,
                    data={"server_time": current_time.isoformat()},
                    timestamp=current_time
                )
                
                await self.broadcast_to_all(heartbeat_message)
                
                await asyncio.sleep(self.heartbeat_interval)
                
            except Exception as e:
                logger.error(f"Heartbeat loop error: {e}")
                await asyncio.sleep(5)
    
    async def _process_messages(self):
        """Background task to process message queue"""
        while self.ready:
            try:
                # Process queued messages
                message = await asyncio.wait_for(self.message_queue.get(), timeout=1.0)
                
                # Handle message based on type
                if message.type in self.message_handlers:
                    for handler in self.message_handlers[message.type]:
                        try:
                            await handler(message)
                        except Exception as e:
                            logger.error(f"Message handler error: {e}")
                
                self.message_queue.task_done()
                
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Message processing error: {e}")
                await asyncio.sleep(1)
    
    async def _cleanup_connections(self):
        """Background task to cleanup disconnected connections"""
        while self.ready:
            try:
                await asyncio.sleep(60)  # Run every minute
                
                # Clean up any orphaned connections
                # This is a safety net for connections that weren't properly cleaned up
                
            except Exception as e:
                logger.error(f"Connection cleanup error: {e}")
    
    def _register_default_handlers(self):
        """Register default message handlers"""
        self.register_handler(MessageType.TRADING_UPDATE, self._handle_trading_update)
        self.register_handler(MessageType.MARKET_DATA, self._handle_market_data)
        self.register_handler(MessageType.BOT_STATUS, self._handle_bot_status)
    
    def register_handler(self, message_type: MessageType, handler: Callable):
        """Register message handler"""
        if message_type not in self.message_handlers:
            self.message_handlers[message_type] = []
        self.message_handlers[message_type].append(handler)
    
    async def _handle_trading_update(self, message: WebSocketMessage):
        """Handle trading update message"""
        # Broadcast to trading topic subscribers
        await self.broadcast_to_topic("trading_updates", message)
    
    async def _handle_market_data(self, message: WebSocketMessage):
        """Handle market data message"""
        # Broadcast to market data subscribers
        symbol = message.data.get('symbol', 'unknown')
        await self.broadcast_to_topic(f"market_data_{symbol}", message)
    
    async def _handle_bot_status(self, message: WebSocketMessage):
        """Handle bot status message"""
        # Send to bot owner
        bot_id = message.data.get('bot_id')
        if bot_id and message.user_id:
            await self.send_to_user(message.user_id, message)
    
    async def queue_message(self, message: WebSocketMessage):
        """Queue message for processing"""
        await self.message_queue.put(message)
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get connection statistics"""
        return {
            "total_connections": len(self.connections),
            "users_connected": len(self.user_connections),
            "tenants_connected": len(self.tenant_connections),
            "active_topics": len(self.topic_subscribers),
            "queued_messages": self.message_queue.qsize(),
            "uptime": datetime.now().isoformat() if self.ready else None
        }
    
    async def cleanup(self):
        """Cleanup WebSocket manager resources"""
        logger.info("🧹 Cleaning up WebSocket Manager...")
        
        self.ready = False
        
        # Cancel background tasks
        if self.heartbeat_task:
            self.heartbeat_task.cancel()
        if self.message_processor_task:
            self.message_processor_task.cancel()
        if self.cleanup_task:
            self.cleanup_task.cancel()
        
        # Close all connections
        for connection_id in list(self.connections.keys()):
            await self.disconnect(connection_id)
        
        # Clear all data structures
        self.connections.clear()
        self.user_connections.clear()
        self.tenant_connections.clear()
        self.topic_subscribers.clear()
        self.message_handlers.clear()


# Global WebSocket manager instance
websocket_manager = WebSocketManager()


async def get_websocket_manager() -> WebSocketManager:
    """Get WebSocket manager instance"""
    if not websocket_manager.ready:
        await websocket_manager.initialize()
    return websocket_manager