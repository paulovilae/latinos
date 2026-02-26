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
            # Print just the node types and a snippet of each
            for n in parsed.get("nodes", []):
                ntype = n.get("type", "?")
                dtype = n.get("data", {}).get("type", "?")
                title = n.get("data", {}).get("title", "?")
                print(f"  node_type={ntype}  data.type={dtype}  title={title}")
                # If it's a tool node, print the full data
                if dtype == "tool":
                    print(f"    FULL DATA: {json.dumps(n['data'], indent=2)[:500]}")
            print(f"\n  Edges count: {len(parsed.get('edges', []))}")
        else:
            print("No workflow found")
