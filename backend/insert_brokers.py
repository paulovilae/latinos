import sys
import os
from sqlalchemy.orm import Session
from app.db import SessionLocal
from app.models import User, BrokerConnection

def main():
    db = SessionLocal()
    try:
        # 1. Find the main user (usually ID 1 or the one with admin role)
        user = db.query(User).filter(User.email.like('%@%')).first()
        if not user:
            print("No user found in database!")
            return

        print(f"Injecting keys for User: {user.email} (ID: {user.id})")

        # 2. Add Alpaca Connection
        alpaca = db.query(BrokerConnection).filter_by(user_id=user.id, broker_name='alpaca').first()
        if not alpaca:
            alpaca = BrokerConnection(
                user_id=user.id,
                broker_name='alpaca',
                is_paper=True,
                status='active'
            )
            db.add(alpaca)
        
        alpaca.api_key_encrypted = "PKYWB3Q3EXQALJ3UBYSRQDEG5M"
        alpaca.api_secret_encrypted = "FzunuomyE5ZNvcGx6MiWk6xTVmHbBgoAm8qnVsQiRkPy"

        # 3. Add TradingView Connection
        tv = db.query(BrokerConnection).filter_by(user_id=user.id, broker_name='tradingview').first()
        if not tv:
            tv = BrokerConnection(
                user_id=user.id,
                broker_name='tradingview',
                is_paper=True,
                status='active'
            )
            db.add(tv)
        
        tv.api_key_encrypted = "latinos-webhook"
        tv.api_secret_encrypted = "GoldenGooseWebhook2026"  # This is the passphrase they will use in TV

        db.commit()
        print("Successfully installed Alpaca and TradingView broker connections!")
        
    finally:
        db.close()

if __name__ == "__main__":
    main()
