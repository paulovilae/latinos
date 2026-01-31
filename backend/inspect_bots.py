import sqlite3
import json

def inspect_bots():
    print("Inspecting bots in users.db...")
    try:
        conn = sqlite3.connect('users.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("SELECT id, name, status, signal_manifest FROM bots ORDER BY id DESC LIMIT 5")
        rows = cursor.fetchall()
        
        for row in rows:
            manifest = row['signal_manifest']
            print(f"Bot ID: {row['id']}")
            print(f"  Name: {row['name']}")
            print(f"  Status: {row['status']}")
            print(f"  Manifest: {manifest} (Type: {type(manifest)})")
            
            # Additional check for legacy signals relation?
            # It's hard to check via raw SQL without joining, but let's check manifest first.
        
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    inspect_bots()
