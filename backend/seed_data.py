#!/usr/bin/env python3
"""Seed script to create test signals and bots"""

import sys
import os
sys.path.insert(0, '/app')

from app.db import SessionLocal, engine
from app.models import Signal, Bot, User
from sqlalchemy.orm import Session
import json

def seed_data():
    db = SessionLocal()
    
    try:
        # Get first user (or create test user)
        user = db.query(User).first()
        if not user:
            print("No users found. Creating test user...")
            user = User(
                email="test@latinos.com",
                name="Test User",
                hashed_password="hashed",  # Won't be used
                role="user"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        print(f"Using user: {user.email} (id={user.id})")
        
        # Clear existing signals and bots for clean slate
        db.query(Bot).delete()
        db.query(Signal).delete()
        db.commit()
        
        # Create test signals (library signals - not attached to any bot initially)
        signals_data = [
            {
                "type": "formula",
                "payload": {
                    "name": "MA Golden Cross",
                    "code": "MA(close, 50) > MA(close, 200)",
                    "description": "Bullish when 50-day MA crosses above 200-day MA"
                },
                "mode": "simulation"
            },
            {
                "type": "formula",
                "payload": {
                    "name": "RSI Oversold",
                    "code": "RSI(close, 14) < 30",
                    "description": "Buy signal when RSI below 30"
                },
                "mode": "simulation"
            },
            {
                "type": "formula",
                "payload": {
                    "name": "RSI Overbought",
                    "code": "RSI(close, 14) > 70",
                    "description": "Sell signal when RSI above 70"
                },
                "mode": "simulation"
            },
            {
                "type": "python",
                "payload": {
                    "name": "MACD Crossover",
                    "code": "def strategy(data):\\n    macd = data['macd']\\n    signal = data['macd_signal']\\n    return 'buy' if macd > signal else 'sell'",
                    "description": "MACD crosses signal line"
                },
                "mode": "simulation"
            },
            {
                "type": "formula",
                "payload": {
                    "name": "Volume Spike",
                    "code": "volume > MA(volume, 20) * 2",
                    "description": "Volume exceeds 20-day average by 2x"
                },
                "mode": "simulation"
            }
        ]
        
        signals = []
        for sig_data in signals_data:
            signal = Signal(
                type=sig_data["type"],
                payload=sig_data["payload"],
                mode=sig_data["mode"]
            )
            db.add(signal)
            signals.append(signal)
        
        db.commit()
        print(f"✅ Created {len(signals)} signals")
        
        # Refresh to get IDs
        for s in signals:
            db.refresh(s)
        
        # Create test bots
        bots_data = [
            {
                "name": "Trend Following Bot",
                "description": "Combines MA crossover with RSI confirmation",
                "tags": ["trend", "momentum"],
                "owner_id": user.id,
                "signal_ids": [signals[0].id, signals[1].id]  # MA + RSI Oversold
            },
            {
                "name": "Mean Reversion Bot",
                "description": "Buys oversold, sells overbought",
                "tags": ["mean-reversion", "contrarian"],
                "owner_id": user.id,
                "signal_ids": [signals[1].id, signals[2].id]  # RSI Oversold + Overbought
            },
            {
                "name": "Momentum Scanner",
                "description": "Combines MACD with volume confirmation",
                "tags": ["momentum", "volume"],
                "owner_id": user.id,
                "signal_ids": [signals[3].id, signals[4].id]  # MACD + Volume
            }
        ]
        
        bots = []
        for bot_data in bots_data:
            signal_ids = bot_data.pop("signal_ids", [])
            bot = Bot(**bot_data)
            db.add(bot)
            db.commit()
            db.refresh(bot)
            
            # Link signals to bot
            if signal_ids:
                bot_signals = [db.query(Signal).get(sid) for sid in signal_ids]
                bot.signals = [s for s in bot_signals if s]
                db.commit()
            
            bots.append(bot)
        
        print(f"✅ Created {len(bots)} bots")
        
        # Verify
        total_signals = db.query(Signal).count()
        total_bots = db.query(Bot).count()
        print(f"\n📊 Final counts:")
        print(f"   Signals: {total_signals}")
        print(f"   Bots: {total_bots}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("🌱 Seeding database with test data...")
    success = seed_data()
    sys.exit(0 if success else 1)
