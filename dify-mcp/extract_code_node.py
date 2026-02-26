import psycopg2
import json

DB_URL = "postgresql://postgres:difyai123456@127.0.0.1:5433/dify"
with psycopg2.connect(DB_URL) as conn:
    with conn.cursor() as cur:
        cur.execute("SELECT graph FROM workflows WHERE app_id = '098d8fbc-9463-470d-88d1-4da75a22faf1' ORDER BY updated_at DESC LIMIT 1;")
        row = cur.fetchone()
        if row:
            graph = row[0]
            if isinstance(graph, str):
                parsed = json.loads(graph)
            else:
                parsed = graph
            # Print ALL nodes fully
            for n in parsed.get("nodes", []):
                print(json.dumps(n, indent=2))
                print("---")
            print("\n=== EDGES ===")
            for e in parsed.get("edges", []):
                print(json.dumps(e, indent=2))
