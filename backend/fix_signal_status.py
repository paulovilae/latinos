import sqlite3

def fix_status():
    print("🔧 Fixing Signal Statuses...")
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        # Set all signals to 'active' so they show up in the library
        cursor.execute("UPDATE signals SET delivery_status = 'active'")
        rows = cursor.rowcount
        
        conn.commit()
        print(f"✅ Updated {rows} signals to 'active'.")
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix_status()
