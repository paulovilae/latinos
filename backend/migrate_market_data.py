import sqlite3
import psycopg2
from io import StringIO
import time

print("Starting FULL data transfer (market_data + extra tables)...")

# Connect to sqlite
sqlite_conn = sqlite3.connect('/home/paulo/Programs/apps/OS/Apps/Latinos/backend/users.db')
# speed up sqlite reads
sqlite_conn.execute('PRAGMA synchronous = OFF')
sqlite_conn.execute('PRAGMA journal_mode = MEMORY')
sqlite_cursor = sqlite_conn.cursor()

# Connect to postgres
pg_conn = psycopg2.connect("postgresql://directus:directus_password@127.0.0.1:5432/directus")
pg_cursor = pg_conn.cursor()

# 1. MIGRATING BROKER CONNECTIONS
print("Migrating broker_connections...")
pg_cursor.execute("""
CREATE TABLE IF NOT EXISTS broker_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    broker_name VARCHAR(100),
    api_key_encrypted TEXT,
    api_secret_encrypted TEXT,
    is_paper BOOLEAN,
    status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
);
""")
pg_conn.commit()

sqlite_cursor.execute("SELECT id, user_id, broker_name, api_key_encrypted, api_secret_encrypted, is_paper, status, created_at FROM broker_connections")
rows = sqlite_cursor.fetchall()
mapped_rows = []
for r in rows:
    mapped_rows.append((r[0], r[1], r[2], r[3], r[4], bool(r[5]), r[6], r[7]))
if mapped_rows:
    pg_cursor.executemany("""
    INSERT INTO broker_connections (id, user_id, broker_name, api_key_encrypted, api_secret_encrypted, is_paper, status, created_at)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING
    """, mapped_rows)
    pg_conn.commit()
    print(f"Migrated {len(mapped_rows)} broker connections.")

# 2. MIGRATING SUBSCRIPTIONS
print("Migrating subscriptions...")
pg_cursor.execute("""
CREATE TABLE IF NOT EXISTS subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    plan VARCHAR(100),
    status VARCHAR(50),
    limits JSONB
);
""")
pg_conn.commit()

sqlite_cursor.execute('SELECT id, user_id, "plan", status, limits FROM subscriptions')
rows = sqlite_cursor.fetchall()
if rows:
    pg_cursor.executemany("""
    INSERT INTO subscriptions (id, user_id, plan, status, limits)
    VALUES (%s, %s, %s, %s, %s) ON CONFLICT (id) DO NOTHING
    """, rows)
    pg_conn.commit()
    print(f"Migrated {len(rows)} subscriptions.")

# 3. MIGRATING MARKET DATA (985K rows)
print("Migrating market_data (this will take a few seconds using COPY)...")
pg_cursor.execute("""
CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY,
    symbol VARCHAR(50),
    interval VARCHAR(20),
    timestamp TIMESTAMP WITH TIME ZONE,
    open FLOAT,
    high FLOAT,
    low FLOAT,
    close FLOAT,
    volume FLOAT
);
TRUNCATE TABLE market_data;
""")
pg_conn.commit()

# Bulk copy for massive table
sqlite_cursor.execute("SELECT symbol, interval, timestamp, open, high, low, close, volume FROM market_data")

start_time = time.time()
buffer = StringIO()
batch_size = 50000
total_copied = 0

while True:
    batch = sqlite_cursor.fetchmany(batch_size)
    if not batch:
        break
    
    for row in batch:
        # Convert to TSV line
        # handle None values as \N for postgres COPY
        mapped = [str(col) if col is not None else r'\N' for col in row]
        buffer.write('\t'.join(mapped) + '\n')
    
    buffer.seek(0)
    pg_cursor.copy_from(buffer, 'market_data', columns=('symbol', 'interval', 'timestamp', 'open', 'high', 'low', 'close', 'volume'))
    pg_conn.commit()
    
    total_copied += len(batch)
    buffer.truncate(0)
    buffer.seek(0)
    print(f"Copied {total_copied} rows of market_data...")

print(f"Done migrating market_data! Copied {total_copied} rows in {time.time() - start_time:.2f} seconds.")

pg_cursor.close()
pg_conn.close()
sqlite_cursor.close()
sqlite_conn.close()
