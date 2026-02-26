import psycopg2
import os

DB_URL = os.environ.get("DIFY_DATABASE_URL", "postgresql://postgres:difyai123456@127.0.0.1:5433/dify")
with psycopg2.connect(DB_URL) as conn:
    with conn.cursor() as cur:
        # Find the corrupted app and delete it and its workflows
        cur.execute("SELECT id FROM apps WHERE name = 'Zen Master RSI Breakout';")
        rows = cur.fetchall()
        for r in rows:
            app_id = r[0]
            print(f"Deleting corrupted App ID: {app_id}")
            cur.execute("DELETE FROM workflows WHERE app_id = %s;", (app_id,))
            cur.execute("DELETE FROM apps WHERE id = %s;", (app_id,))
        conn.commit()
print("Cleaned up corrupted workflows.")
