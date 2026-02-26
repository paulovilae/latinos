import psycopg2
import os
import json

DB_URL = "postgresql://postgres:difyai123456@127.0.0.1:5433/dify"
with psycopg2.connect(DB_URL) as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT graph FROM workflows WHERE app_id = '2e93fbed-992e-4c75-ae47-e385f7425f18' ORDER BY updated_at DESC LIMIT 1;")
        row = cur.fetchone()
        if row:
            graph = row[0]
            with open("dify_template.json", "w") as f:
                f.write(graph if isinstance(graph, str) else json.dumps(graph, indent=2))
            print(f"Extracted graph ({len(graph)} chars) -> dify_template.json")
        else:
            print("No workflow found for that app_id")
