from sqlalchemy import create_engine, text
from app.db import database_url

print("Connecting to database...")
engine = create_engine(database_url)

try:
    with engine.connect() as conn:
        print("Creating broker_connections table if missing...")
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS broker_connections (
                id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                broker_name VARCHAR,
                api_key_encrypted VARCHAR,
                api_secret_encrypted VARCHAR,
                is_paper BOOLEAN,
                status VARCHAR,
                created_at DATETIME,
                FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        """))
        
        print("Adding live_trading to bots if missing...")
        try:
            conn.execute(text("ALTER TABLE bots ADD COLUMN live_trading BOOLEAN DEFAULT 0"))
        except Exception as e:
            print("live_trading column might already exist:", str(e))
            
        try:
            conn.execute(text("ALTER TABLE bots ADD COLUMN live_trading_connection_id INTEGER REFERENCES broker_connections(id) ON DELETE SET NULL"))
        except Exception as e:
            print("live_trading_connection_id column might already exist:", str(e))
            
        conn.commit()
    print("Database sync complete.")
except Exception as e:
    print(f"Failed: {e}")
