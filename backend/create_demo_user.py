#!/usr/bin/env python3
"""
Create demo user for testing
Email: demo@latinos.trade
Password: demo123
"""
import sys
sys.path.insert(0, '/app')

from app.db import SessionLocal
from app.models import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_demo_user():
    db = SessionLocal()
    try:
        # Check if demo user exists
        existing = db.query(User).filter(User.email == "demo@latinos.trade").first()
        if existing:
            print("✅ Demo user already exists")
            return
        
        # Create demo user
        demo_user = User(
            email="demo@latinos.trade",
            name="Demo User",
            password_hash=pwd_context.hash("demo123"),
            role="admin",
            subscription_tier="pro",
            subscription_status="active"
        )
        db.add(demo_user)
        db.commit()
        print("✅ Demo user created successfully!")
        print("   Email: demo@latinos.trade")
        print("   Password: demo123")
    except Exception as e:
        print(f"❌ Error creating demo user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_user()
