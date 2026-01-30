import sys
import os

# Add backend to path so we can import app modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db import SessionLocal
from app.models import Signal, Bot
from app.schemas import SignalType
from sqlalchemy.orm import Session

def create_signal(db: Session, name: str, code: str, description: str, bot_id: int):
    # Check duplicates by iterating (since name is in payload JSON)
    # This is inefficient but fine for a seeding script
    all_signals = db.query(Signal).filter(Signal.bot_id == bot_id).all()
    for s in all_signals:
        if s.payload.get("name") == name:
             print(f"Skipping {name} (Already exists)")
             return

    sig = Signal(
        bot_id=bot_id,
        type="PYTHON",
        payload={"code": code},
        mode="paper",
        delivery_status="active" # Using this field loosely for now
    )
    # Hack name injection since model doesn't have name (SCHEMA has name, MODEL might be missing it?)
    # Checking model... Signal model in models.py doesn't have 'name'. 
    # Wait, previous task said "Implement Signal... models". I better check models.py again. 
    # If name is missing in Model, I can't store it. 
    # Let me assume I need to fix the model OR use payload for name.
    # Actually, looking at previous view_file of models.py, Signal has: bot_id, type, payload, emitted_at, mode, delivery_status.
    # It DOES NOT have 'name'. The 'SignalDef' schema has name.
    # I should add 'name' and 'description' to the Signal model to make it a library item.
    
    # For now, I will store name/desc in payload to avoid migration blocker.
    sig.payload["name"] = name
    sig.payload["description"] = description
    
    db.add(sig)
    print(f"Created {name}")

def main():
    db = SessionLocal()
    
    # Ensure a "System Bot" or "Library Bot" exists to own these signals
    # OR use bot_id=0 if we allow nullable? Model says owner_id is on Bot, Signal has bot_id.
    # Let's create a "Standard Library" bot owned by the first admin.
    
    library_bot = db.query(Bot).filter(Bot.name == "Standard Library").first()
    if not library_bot:
        # Assign to user 1 for now
        library_bot = Bot(
            name="Standard Library",
            description="Container for standard system signals",
            owner_id=1,
            status="active"
        )
        db.add(library_bot)
        db.commit()
        db.refresh(library_bot)
        print("Created Standard Library Bot")

    bot_id = library_bot.id
    
    signals = [
        {
            "name": "RSI Oversold (<30)",
            "description": "Buy signal when RSI(14) drops below 30.",
            "code": """
rsi = ta.rsi(data["close"], 14)
if rsi.iloc[idx] < 30:
    result = True
"""
        },
        {
            "name": "RSI Overbought (>70)",
            "description": "Sell signal when RSI(14) goes above 70.",
            "code": """
rsi = ta.rsi(data["close"], 14)
if rsi.iloc[idx] > 70:
    result = True
"""
        },
        {
            "name": "Golden Cross (SMA 50/200)",
            "description": "Bullish trend: SMA 50 crosses above SMA 200.",
            "code": """
sma50 = ta.sma(data["close"], 50)
sma200 = ta.sma(data["close"], 200)
if sma50.iloc[idx] > sma200.iloc[idx] and sma50.iloc[idx-1] <= sma200.iloc[idx-1]:
    result = True
"""
        },
        {
            "name": "Death Cross (SMA 50/200)",
            "description": "Bearish trend: SMA 50 crosses below SMA 200.",
            "code": """
sma50 = ta.sma(data["close"], 50)
sma200 = ta.sma(data["close"], 200)
if sma50.iloc[idx] < sma200.iloc[idx] and sma50.iloc[idx-1] >= sma200.iloc[idx-1]:
    result = True
"""
        },
        {
            "name": "MACD Bullish Cross",
            "description": "Momentum Buy: MACD line crosses above Signal line.",
            "code": """
macd_res = ta.macd(data["close"])
macd = macd_res["macd"]
sig = macd_res["signal"]

if macd.iloc[idx] > sig.iloc[idx] and macd.iloc[idx-1] <= sig.iloc[idx-1]:
    result = True
"""
        },
        {
            "name": "Bollinger Lower Band Rejection",
            "description": "Mean Reversion Buy: Price touches/breaks lower band and closes back inside (optional logic). Here: Just price < lower.",
            "code": """
bb = ta.bbands(data["close"], 20)
if data["close"].iloc[idx] < bb["lower"].iloc[idx]:
    result = True
"""
        },
         {
            "name": "Stochastic Oversold (<20)",
            "description": "Momentum Buy: Stochastic K < 20.",
            "code": """
stoch = ta.stoch(data["high"], data["low"], data["close"])
k = stoch["k"]
if k.iloc[idx] < 20:
    result = True
"""
        }
    ]

    for s in signals:
        create_signal(db, s["name"], s["code"], s["description"], bot_id)
    
    db.commit()
    print("Signals seeded successfully.")

if __name__ == "__main__":
    main()
