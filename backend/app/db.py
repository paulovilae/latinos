from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Use SQLite for local dev (matches docker-compose volume mount)
database_url = os.getenv("DATABASE_URL", "sqlite:///./users.db")

engine = create_engine(database_url, connect_args={"check_same_thread": False} if "sqlite" in database_url else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
