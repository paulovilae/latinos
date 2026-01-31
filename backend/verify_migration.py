import sqlite3

def verify_and_fix():
    print("Checking users.db for signal_manifest column...")
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        # Check columns
        cursor.execute("PRAGMA table_info(bots)")
        columns = [row[1] for row in cursor.fetchall()]
        print(f"Current columns in 'bots': {columns}")
        
        if 'signal_manifest' in columns:
            print("✅ 'signal_manifest' column exists.")
        else:
            print("⚠️ 'signal_manifest' missing. Adding it now...")
            cursor.execute("ALTER TABLE bots ADD COLUMN signal_manifest JSON DEFAULT '[]'")
            conn.commit()
            print("✅ 'signal_manifest' column added successfully.")
            
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verify_and_fix()
