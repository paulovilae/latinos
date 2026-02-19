#!/bin/bash
# Get a signal ID first
SIGNAL_ID=$(python3 -c "from app.db import get_db; from app.models import Signal; db=next(get_db()); print(db.query(Signal).first().id)")
echo "Testing Signal ID: $SIGNAL_ID"

# Authenticate (hacky: get a token or just assume no auth for local testing if I removed dependency?)
# Wait, the endpoint requires auth: current_user: models.User = Depends(get_current_user)
# I need a token.

# Let's try to bypass auth for a second by modifying the code TEMPORARILY or finding a token.
# ACTUALLY, I can just use the python console to call the function directly.

python3 -c "
from app.db import get_db
from app.routers.signals import test_signal_logic
from app.schemas import SignalTestRequest
from app.models import User
db = next(get_db())
# Mock user
user = db.query(User).filter(User.email == 'admin@example.com').first()
if not user: user = db.query(User).first()

req = SignalTestRequest(symbol='AAPL', days=5)
print(f'Testing with user: {user.email}')
try:
    res = test_signal_logic($SIGNAL_ID, req, db, user)
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
"
