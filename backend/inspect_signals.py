import sqlite3

def inspect_signals():
    print("Inspecting signals in users.db...")
    try:
        conn = sqlite3.connect('users.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, type, payload FROM signals ORDER BY id DESC LIMIT 10")
        rows = cursor.fetchall()
        
        for row in rows:
            print(f"Signal ID: {row['id']}")
            print(f"  Type: {row['type']}")
            print(f"  Payload: {row['payload']}")
            print("-" * 20)
            
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    inspect_signals()
