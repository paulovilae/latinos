import sys
from sqlalchemy import text
from app.db import engine

def main():
    try:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE bots ADD COLUMN live_metrics JSON DEFAULT '{}';"))
            conn.commit()
        print("Successfully added live_metrics column to bots table.")
    except Exception as e:
        print(f"Error adding column (it might already exist): {e}")

if __name__ == "__main__":
    main()
