import sqlite3

def count_signals():
    try:
        conn = sqlite3.connect('users.db')
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) FROM signals")
        count = cursor.fetchone()[0]
        print(f"Total Signals: {count}")
        
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    count_signals()
