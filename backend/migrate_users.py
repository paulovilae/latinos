import sqlite3
import psycopg2
import uuid

sqlite_conn = sqlite3.connect('/home/paulo/Programs/apps/OS/Apps/Latinos/backend/users.db')
sqlite_cursor = sqlite_conn.cursor()

pg_conn = psycopg2.connect("postgresql://directus:directus_password@127.0.0.1:5432/directus")
pg_cursor = pg_conn.cursor()

sqlite_cursor.execute("SELECT id, email, name, password_hash, role FROM users")
rows = sqlite_cursor.fetchall()

print(f"Migrating {len(rows)} users to Postgres...")

for row in rows:
    id, email, name, password_hash, role = row
    pid = str(uuid.uuid4())
    # api_key requirement from directus users table
    api_key = f"migrated_latinos_{id}_{str(uuid.uuid4())[:8]}"
    
    pg_cursor.execute("""
    INSERT INTO users (id, pid, email, password, api_key, name)
    VALUES (%s, %s, %s, %s, %s, %s)
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name
    """, (id, pid, email, password_hash, api_key, name))

pg_conn.commit()
print("Users migrated successfully!")
