import logging
from app.db import SessionLocal
from app.models import Bot
from app.signals import BacktestEngine
import sys

logging.basicConfig(level=logging.DEBUG)
db = SessionLocal()

bot = db.query(Bot).filter(Bot.name == "Runner").first()
if not bot:
    print("Runner bot not found")
    sys.exit(0)

manifest = bot.signal_manifest or []
stack_ids = []
for entry in manifest:
    if isinstance(entry, dict):
        stack_ids.append(int(entry.get("id", 0)))
    else:
        stack_ids.append(int(entry))
        
if not stack_ids:
    stack_ids = [s.id for s in bot.signals]

print(f"Testing Runner on AAPL with stack_ids {stack_ids}")

engine = BacktestEngine(db)
result = engine.run(
    stack_ids=stack_ids,
    symbol="AAPL",
    days=365,
    take_profit=0,
    stop_loss=0,
    initial_capital=10000,
    is_wasm=bot.is_wasm,
    wasm_base64=bot.wasm_base64
)

print(f"Total Return: {result.total_return_pct}%")
print(f"Total Trades: {result.total_trades}")

# print first 10 and last 10 trades
if len(engine.logs) > 0:
    trades_logs = [l for l in engine.logs if "BUY" in l or "SELL" in l]
    print("First 10 trades:")
    for l in trades_logs[:10]: print(l)
    print("Last 10 trades:")
    for l in trades_logs[-10:]: print(l)
