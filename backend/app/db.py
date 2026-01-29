from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Use localhost for local dev if DATABASE_URL refers to 'db' host
database_url = os.getenv("DATABASE_URL", "postgresql://app:secret@localhost:5432/app")
if "db" in database_url and not os.getenv("DOCKER_ENV"):
    # Fallback to localhost if running locally outside docker network
    database_url = "postgresql://app:secret@localhost:5432/app"

engine = create_engine(database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
