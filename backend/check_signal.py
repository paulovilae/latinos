import sys
sys.path.insert(0, "/app")
from app.db import SessionLocal
from app.models import Signal
db = SessionLocal()
sig = db.query(Signal).filter(Signal.id == 1).first()
print(f'Signal ID: {sig.id}')
print(f'Type: {sig.type}')
print(f'Payload: {sig.payload}')
db.close()
