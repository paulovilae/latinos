from app.db import SessionLocal
from app import models

db = SessionLocal()
email = "vilapaulo@gmail.com"
user = db.query(models.User).filter(models.User.email == email).first()

if user:
    user.role = "admin"
    db.commit()
    print(f"✅ Successfully promoted {email} to admin.")
else:
    print(f"❌ User {email} not found. Have you logged in yet?")
