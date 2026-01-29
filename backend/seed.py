import requests
import os
import random
from datetime import datetime, timedelta

API_URL = "http://127.0.0.1:8000"
TOKEN = "demo-admin-token"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

def seed():
    print("🌱 Seeding database...")
    
    # 1. Create a Bot
    bot_payload = {
        "name": "BTC Trend Master",
        "description": "Simple Moving Average crossover strategy for Bitcoin.",
        "script": "def strategy(data):\n    return data['close'] > data['ma50']"
    }
    
    # Check if exists first (simple check)
    bots = requests.get(f"{API_URL}/bots", headers=headers).json()
    if not bots:
        print("  Creating Bot...")
        resp = requests.post(f"{API_URL}/bots", json=bot_payload, headers=headers)
        print(f"Bot creation response: {resp.status_code} {resp.text}")
        bot = resp.json()
        bot_id = bot['id']
    else:
        print("  Bot exists, using first one.")
        bot_id = bots[0]['id']

    # 2. Create Formulas
    print("  Creating Formulas...")
    requests.post(f"{API_URL}/bots/{bot_id}/formulas", json={
        "payload": {"indicator": "RSI", "period": 14, "threshold": 30},
        "version": 1
    }, headers=headers)
    
    # Published formula
    f2 = requests.post(f"{API_URL}/bots/{bot_id}/formulas", json={
        "payload": {"indicator": "RSI", "period": 14, "threshold": 70},
        "version": 2
    }, headers=headers).json()
    requests.post(f"{API_URL}/formulas/{f2['id']}/publish", json={"published": True}, headers=headers)

    # 3. Create Signals
    print("  Creating Signals...")
    types = ["buy", "sell", "info"]
    for i in range(5):
        requests.post(f"{API_URL}/webhooks/signal", json={
            "bot_id": bot_id,
            "type": random.choice(types),
            "payload": {"price": 45000 + i*100, "reason": "Moving Average Crossover"},
            "mode": "live"
        }, headers=headers)

    # 4. Create Backtests
    print("  Creating Backtest...")
    requests.post(f"{API_URL}/backtests", json={
        "bot_id": bot_id,
        "range": "1M",
        "market": "BTC-USD",
        "formula_version_id": f2['id'] 
    }, headers=headers)

    print("✅ Seeding complete!")

if __name__ == "__main__":
    seed()
