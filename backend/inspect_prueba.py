import sqlite3
import json

def inspect_prueba():
    print("Inspecting 'prueba' bot in users.db...")
    try:
        conn = sqlite3.connect('users.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name, status, signal_manifest FROM bots WHERE name = 'prueba'")
        rows = cursor.fetchall()
        
        if not rows:
            print("❌ Bot 'prueba' not found.")
        
        for row in rows:
            manifest = row['signal_manifest']
            print(f"Bot ID: {row['id']}")
            print(f"  Name: {row['name']}")
            print(f"  Manifest Raw: {manifest}")
            print(f"  Manifest Type: {type(manifest)}")
            
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    inspect_prueba()
