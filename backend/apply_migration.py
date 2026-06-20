import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found.")
    exit(1)

MIGRATION_FILE = "../supabase/migrations/005_freelancer_workflow.sql"

with open(MIGRATION_FILE, "r", encoding="utf-8") as f:
    sql = f.read()

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

try:
    print("Applying migration...")
    cur.execute(sql)
    print("Migration applied successfully!")
except Exception as e:
    print(f"Error applying migration: {e}")
finally:
    cur.close()
    conn.close()
