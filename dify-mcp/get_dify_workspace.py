import psycopg2
import os

DB_URL = os.environ.get("DIFY_DATABASE_URL", "postgresql://postgres:difyai123456@127.0.0.1:5433/dify")
with psycopg2.connect(DB_URL) as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT id, name FROM tenants;")
        rows = cur.fetchall()
        for r in rows:
            print(f"ID: {r[0]} NAME: {r[1]}")
