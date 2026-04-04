import sqlite3
import psycopg2
import json
import datetime

# Connect to sqlite
sqlite_conn = sqlite3.connect('/home/paulo/Programs/apps/OS/Apps/Latinos/backend/users.db')
sqlite_cursor = sqlite_conn.cursor()

# Connect to postgres
pg_conn = psycopg2.connect("postgresql://directus:directus_password@127.0.0.1:5432/directus")
pg_cursor = pg_conn.cursor()

print("Connected to both databases successfully.")

# MIGRATION: BOTS
print("Migrating 'bots' table...")
# 1. Create table in Postgres
pg_cursor.execute("""
CREATE TABLE IF NOT EXISTS bots (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    description TEXT,
    script TEXT,
    status VARCHAR(50),
    owner_id INTEGER,
    tags JSONB,
    signal_manifest JSONB DEFAULT '[]',
    live_trading BOOLEAN DEFAULT FALSE,
    live_trading_connection_id INTEGER,
    live_metrics JSONB DEFAULT '{}',
    is_wasm BOOLEAN DEFAULT FALSE,
    wasm_status VARCHAR(50) DEFAULT 'draft',
    wasm_base64 TEXT,
    wasm_size_bytes INTEGER DEFAULT 0,
    dify_app_id VARCHAR(255),
    python_validated BOOLEAN DEFAULT FALSE,
    wasm_hash TEXT,
    wasm_schema JSONB,
    webhook_secret VARCHAR(255),
    daily_profit FLOAT DEFAULT 0.0,
    total_profit FLOAT DEFAULT 0.0,
    win_rate FLOAT DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
""")
pg_conn.commit()

# 2. Fetch from SQLite
sqlite_cursor.execute("SELECT id, name, description, script, status, owner_id, tags, signal_manifest, live_trading, live_trading_connection_id, live_metrics, is_wasm, wasm_base64, wasm_size_bytes, dify_app_id, python_validated, wasm_hash, wasm_schema, webhook_secret FROM bots")
bots_rows = sqlite_cursor.fetchall()

print(f"Found {len(bots_rows)} bots. Inserting to PostreSQL...")

for row in bots_rows:
    id, name, description, script, status, owner_id, tags, signal_manifest, live_trading, live_trading_connection_id, live_metrics, is_wasm, wasm_base64, wasm_size_bytes, dify_app_id, python_validated, wasm_hash, wasm_schema, webhook_secret = row
    
    # Parse live metrics if any
    metrics = {}
    if live_metrics:
        try:
            metrics = json.loads(live_metrics)
        except:
            pass
            
    daily_profit = metrics.get('daily_profit', 0.0)
    total_profit = metrics.get('total_profit', 0.0)
    win_rate = metrics.get('win_rate', 0.0)
    
    # Evaluate SQLite Booleans (0/1 to False/True)
    live_trading = bool(live_trading) if live_trading is not None else False
    is_wasm = bool(is_wasm) if is_wasm is not None else False
    python_validated = bool(python_validated) if python_validated is not None else False
    
    # Compute wasm_status based on BeanRoastery.tsx legacy logic
    wasm_status_val = "draft"
    if status == "active":
        wasm_status_val = "active"
    elif status == "paused":
        wasm_status_val = "paused"
    elif is_wasm and python_validated:
        wasm_status_val = "roasted"
    elif is_wasm:
        wasm_status_val = "canvas"
        
    pg_cursor.execute("""
    INSERT INTO bots (id, name, description, script, status, owner_id, tags, signal_manifest, live_trading, live_trading_connection_id, live_metrics, is_wasm, wasm_status, wasm_base64, wasm_size_bytes, dify_app_id, python_validated, wasm_hash, wasm_schema, webhook_secret, daily_profit, total_profit, win_rate)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        status = EXCLUDED.status,
        live_metrics = EXCLUDED.live_metrics,
        updated_at = CURRENT_TIMESTAMP
    """, (
        id, name, description, script, status, 1, 
        tags, signal_manifest, live_trading, live_trading_connection_id, live_metrics, 
        is_wasm, wasm_status_val, wasm_base64, wasm_size_bytes, dify_app_id, 
        python_validated, wasm_hash, wasm_schema, webhook_secret,
        daily_profit, total_profit, win_rate
    ))

pg_conn.commit()


# MIGRATION: BACKTESTS
print("Migrating 'backtests' table...")
# 1. Create table in Postgres
pg_cursor.execute("""
CREATE TABLE IF NOT EXISTS formulas (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER,
    version INTEGER,
    payload JSONB,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published BOOLEAN,
    assets JSONB,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS backtests (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER,
    formula_version_id INTEGER,
    range VARCHAR(100),
    market VARCHAR(100),
    status VARCHAR(50),
    results JSONB,
    submitted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS signals (
    id SERIAL PRIMARY KEY,
    bot_id INTEGER,
    type VARCHAR(50),
    payload JSONB,
    emitted_at TIMESTAMP WITH TIME ZONE,
    mode VARCHAR(50),
    delivery_status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS trades (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    bot_id INTEGER,
    signal_id INTEGER,
    symbol VARCHAR(50),
    side VARCHAR(20),
    price FLOAT,
    amount FLOAT,
    status VARCHAR(50),
    timestamp TIMESTAMP WITH TIME ZONE
);
""")
pg_conn.commit()

# Copy backtests
sqlite_cursor.execute("SELECT id, bot_id, formula_version_id, range, market, status, results, submitted_at FROM backtests")
bt_rows = sqlite_cursor.fetchall()
print(f"Found {len(bt_rows)} backtests. Inserting...")
for row in bt_rows:
    pg_cursor.execute("""
    INSERT INTO backtests (id, bot_id, formula_version_id, range, market, status, results, submitted_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (id) DO NOTHING
    """, row)
pg_conn.commit()

# Copy signals
sqlite_cursor.execute("SELECT id, bot_id, type, payload, emitted_at, mode, delivery_status FROM signals")
sig_rows = sqlite_cursor.fetchall()
print(f"Found {len(sig_rows)} signals. Inserting...")
for row in sig_rows:
    pg_cursor.execute("""
    INSERT INTO signals (id, bot_id, type, payload, emitted_at, mode, delivery_status)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    ON CONFLICT (id) DO NOTHING
    """, row)
pg_conn.commit()

print("Done migrating data from SQLite to Postgres!")
