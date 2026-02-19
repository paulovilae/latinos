"""Fix broken signals using raw SQL to avoid heavy imports"""
import sqlite3, json

db = sqlite3.connect("/app/users.db")
cur = db.cursor()

fixes = [
    (4, json.dumps({
        "name": "MACD Crossover",
        "code": "macd = ta.macd(data['close'])\nif macd['macd'].iloc[idx] > macd['signal'].iloc[idx] and macd['macd'].iloc[idx-1] <= macd['signal'].iloc[idx-1]:\n    result = True",
        "description": "MACD line crosses above Signal line - bullish momentum"
    })),
    (71, json.dumps({
        "name": "Moving Avg Cross",
        "code": "sma50 = ta.sma(data['close'], 50)\nsma200 = ta.sma(data['close'], 200)\nif sma50.iloc[idx] > sma200.iloc[idx]:\n    result = True",
    })),
    (87, json.dumps({
        "name": "Bollinger Breakout",
        "code": "bb = ta.bbands(data['close'], 20)\nif data['close'].iloc[idx] > bb['upper'].iloc[idx]:\n    result = True",
        "description": "Price breaks above upper Bollinger Band"
    })),
    (89, json.dumps({
        "name": "RSI Overbought",
        "code": "rsi = ta.rsi(data['close'], 14)\nif rsi.iloc[idx] > 70:\n    result = True",
        "description": "RSI above 70 - overbought"
    })),
    (92, json.dumps({
        "name": "MACD Crossover",
        "code": "macd = ta.macd(data['close'])\nif macd['macd'].iloc[idx] > macd['signal'].iloc[idx]:\n    result = True",
        "description": "MACD line is above Signal line"
    })),
    (94, json.dumps({
        "name": "RSI Oversold",
        "code": "rsi = ta.rsi(data['close'], 14)\nif rsi.iloc[idx] < 30:\n    result = True",
        "description": "RSI below 30 - oversold"
    })),
]

for sig_id, payload in fixes:
    cur.execute("UPDATE signals SET payload = ? WHERE id = ?", (payload, sig_id))
    if cur.rowcount:
        print(f"  ✅ Fixed Signal ID {sig_id}")
    else:
        print(f"  ⚠️  Signal ID {sig_id} not found (skip)")

db.commit()
db.close()
print("\n🎉 Done!")
