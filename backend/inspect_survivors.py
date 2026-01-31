import sqlite3
import json

def inspect_survivors():
    print("Inspecting survivor signals...")
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    cursor.execute("SELECT id, type, delivery_status, payload FROM signals")
    rows = cursor.fetchall()
    
    for row in rows:
        payload = row['payload']
        # Try to extract name
        try:
             p = json.loads(payload) if isinstance(payload, str) else payload
             name = p.get('name', 'Unknown')
        except:
             name = "Parse Error"
             
        print(f"ID: {row['id']} | Status: {row['delivery_status']} | Name: {name}")
    
    conn.close()

if __name__ == "__main__":
    inspect_survivors()
