"""Fix broken MACD signal and add auto-type detection"""
import sys
sys.path.insert(0, "/app")
from app.db import SessionLocal
from app.models import Signal

db = SessionLocal()

# Fix Signal ID 4 - MACD Crossover (type=python, broken code)
sig4 = db.query(Signal).filter(Signal.id == 4).first()
if sig4:
    sig4.payload = {
        "name": "MACD Crossover",
        "code": "macd = ta.macd(data['close'])\nif macd['macd'].iloc[idx] > macd['signal'].iloc[idx] and macd['macd'].iloc[idx-1] <= macd['signal'].iloc[idx-1]:\n    result = True",
        "description": "MACD line crosses above Signal line - bullish momentum"
    }
    print(f"✅ Fixed Signal ID 4 (MACD Crossover)")

# Fix Signal ID 92 - MACD Crossover (type=buy, uses undefined vars)
sig92 = db.query(Signal).filter(Signal.id == 92).first()
if sig92:
    sig92.type = "buy"
    sig92.payload = {
        "name": "MACD Crossover",
        "code": "macd = ta.macd(data['close'])\nif macd['macd'].iloc[idx] > macd['signal'].iloc[idx]:\n    result = True",
        "description": "MACD line is above Signal line",
        "price": sig92.payload.get("price", 0)
    }
    print(f"✅ Fixed Signal ID 92 (MACD Crossover)")

# Fix Signal ID 71 - Moving Avg Cross (type=buy, uses undefined ma_50/ma_200)
sig71 = db.query(Signal).filter(Signal.id == 71).first()
if sig71:
    sig71.payload = {
        "name": "Moving Avg Cross",
        "code": "sma50 = ta.sma(data['close'], 50)\nsma200 = ta.sma(data['close'], 200)\nif sma50.iloc[idx] > sma200.iloc[idx]:\n    result = True",
    }
    print(f"✅ Fixed Signal ID 71 (Moving Avg Cross)")

# Fix Signal ID 87 - Bollinger Breakout (type=buy, uses undefined vars)
sig87 = db.query(Signal).filter(Signal.id == 87).first()
if sig87:
    sig87.payload = {
        "name": "Bollinger Breakout",
        "code": "bb = ta.bbands(data['close'], 20)\nif data['close'].iloc[idx] > bb['upper'].iloc[idx]:\n    result = True",
        "description": "Price breaks above upper Bollinger Band",
        "price": sig87.payload.get("price", 0)
    }
    print(f"✅ Fixed Signal ID 87 (Bollinger Breakout)")

# Fix Signal ID 89 - RSI Overbought (type=sell, uses undefined rsi)
sig89 = db.query(Signal).filter(Signal.id == 89).first()
if sig89:
    sig89.payload = {
        "name": "RSI Overbought",
        "code": "rsi = ta.rsi(data['close'], 14)\nif rsi.iloc[idx] > 70:\n    result = True",
        "description": "RSI above 70 - overbought",
        "price": sig89.payload.get("price", 0)
    }
    print(f"✅ Fixed Signal ID 89 (RSI Overbought)")

# Fix Signal ID 94 - RSI Oversold (type=buy, uses undefined rsi)
sig94 = db.query(Signal).filter(Signal.id == 94).first()
if sig94:
    sig94.payload = {
        "name": "RSI Oversold",
        "code": "rsi = ta.rsi(data['close'], 14)\nif rsi.iloc[idx] < 30:\n    result = True",
        "description": "RSI below 30 - oversold",
        "price": sig94.payload.get("price", 0)
    }
    print(f"✅ Fixed Signal ID 94 (RSI Oversold)")

db.commit()
db.close()
print("\n🎉 All broken signals fixed!")
