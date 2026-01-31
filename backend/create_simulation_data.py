import sys
import os
import random
from datetime import datetime
import asyncio

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal, engine
from app import models

def create_simulation_data():
    db = SessionLocal()
    try:
        print("🚀 Starting simulation data generation...")

        # 1. Create Signals if not exist
        signals_data = [
            {"name": "RSI Overbought", "code": "rsi > 70", "type": "sell"},
            {"name": "RSI Oversold", "code": "rsi < 30", "type": "buy"},
            {"name": "MACD Crossover", "code": "macd_line > signal_line", "type": "buy"},
            {"name": "Bollinger Breakout", "code": "price > upper_band", "type": "buy"},
            {"name": "Moving Avg Cross", "code": "ma_50 > ma_200", "type": "buy"},
        ]
        
        for s_data in signals_data:
            # Check if a signal with this name exists in payload
            # CAST(payload->>'name' AS TEXT) would be ideal but JSON querying varies by DB (SQLite vs PG)
            # Since this is a simulation/seed script, we can fetch all seeded signals and filter in Python
            # causing less dialect friction.
            
            existing_signals = db.query(models.Signal).filter(
                models.Signal.mode == "simulation",
                models.Signal.delivery_status == "seeded"
            ).all()

            already_exists = False
            for es in existing_signals:
                if es.payload and es.payload.get("name") == s_data["name"]:
                    already_exists = True
                    break
            
            if already_exists:
                print(f"🔹 Skipping {s_data['name']} (Already seeded)")
                continue

            sig = models.Signal(
                type=s_data["type"],
                payload={"name": s_data["name"], "code": s_data["code"]},
                emitted_at=datetime.utcnow(),
                mode="simulation",
                delivery_status="seeded"
            )
            db.add(sig)
            db.commit()
            db.refresh(sig)
            print(f"✅ Created Signal: {s_data['name']}")
            created_signals.append(sig)

        # 2. Ensure Default Robots Exist (Optional - just to make sure the standard ones are there)
        default_robots = [
            {"name": "Eagle Eye Alpha", "desc": "High-frequency trend follower", "strategy": "Momentum"},
            {"name": "Quantum Solace", "desc": "Mean reversion strategy", "strategy": "Mean Reversion"},
            {"name": "Vetra Sentinel", "desc": "Conservative long-term accumulator", "strategy": "Trend Following"},
            {"name": "Titan Scalper", "desc": "Aggressive short-term scalping", "strategy": "Scalping"},
        ]

        for r_data in default_robots:
            bot = db.query(models.Bot).filter(models.Bot.name == r_data["name"]).first()
            if not bot:
                bot = models.Bot(
                    name=r_data["name"],
                    description=r_data["desc"],
                    owner_id=1,
                    status="running",
                )
                db.add(bot)
                db.commit()
                print(f"🤖 Created Default Robot: {bot.name}")

        # 3. Emit Recent Signals for ALL Running Bots (including user-created ones like GANDUL)
        print("📡 Emitting recent signals...")
        
        # KEY CHANGE: Query all running bots, don't just use the created_bots list
        active_bots = db.query(models.Bot).filter(models.Bot.status == "running").all()
        print(f"📋 Found {len(active_bots)} active bots to simulate (Including: {[b.name for b in active_bots]})")

        signal_definitions = [
            {"name": "RSI Overbought", "code": "rsi > 70", "type": "sell"},
            {"name": "RSI Oversold", "code": "rsi < 30", "type": "buy"},
            {"name": "MACD Crossover", "code": "macd > signal", "type": "buy"},
            {"name": "Bollinger Breakout", "code": "price > upper", "type": "buy"},
        ]

        for bot in active_bots:
            # Create a "latest" signal for recommendation
            latest_def = random.choice(signal_definitions)
            
            # 1. Latest signal (Active Recommendation)
            sig = models.Signal(
                bot_id=bot.id,
                type=latest_def["type"],
                payload={"name": latest_def["name"], "code": latest_def["code"], "price": random.uniform(20000, 60000)},
                emitted_at=datetime.utcnow(),
                mode="simulation",
                delivery_status="delivered"
            )
            db.add(sig)

            # 2. History signals
            for _ in range(random.randint(2, 5)):
                 hist_def = random.choice(signal_definitions)
                 hist_sig = models.Signal(
                    bot_id=bot.id,
                    type=hist_def["type"],
                    payload={"name": hist_def["name"], "code": hist_def["code"], "price": random.uniform(20000, 60000)},
                    emitted_at=datetime.utcnow(), # In real life would be path, but fine for now
                    mode="simulation",
                    delivery_status="delivered"
                 )
                 db.add(hist_sig)
        
        db.commit()
        print("✅ Simulation data generation complete!")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_simulation_data()
