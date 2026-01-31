import sqlite3
import json

def inspect_pro():
    print("🔍 Inspecting Pro Signals...")
    conn = sqlite3.connect('users.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Check for specific pro names
    targets = ["RSI Bullish Divergence", "Golden Cross (SMA 50/200)", "Whale Hunter"]
    
    cursor.execute("SELECT id, type, delivery_status, payload FROM signals")
    rows = cursor.fetchall()
    
    found_count = 0
    for row in rows:
        payload = row['payload']
        try:
             p = json.loads(payload) if isinstance(payload, str) else payload
             name = p.get('name', 'Unknown')
        except:
             name = "Parse Error"
        
        # Check against target list or if it looks like a Pro signal
        if name in targets or "Divergence" in name:
            print(f"   found: ID: {row['id']} | Status: {row['delivery_status']} | Name: {name}")
            found_count += 1
            
    print(f"Total Found matching keywords: {found_count}")
    conn.close()

if __name__ == "__main__":
    inspect_pro()
