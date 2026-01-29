from app import schemas, models
from datetime import datetime

try:
    bot = models.Bot(id=1, name="Test", description="Desc", owner_id=1, status="draft", tags=[])
    print("Created Bot model")
    out = schemas.BotOut.from_orm(bot)
    print("Converted to Schema:", out)
except Exception as e:
    print("Error:", e)
