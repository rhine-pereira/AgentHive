import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found in .env")
    exit(1)

conn = psycopg2.connect(DATABASE_URL)
conn.autocommit = True
cur = conn.cursor()

try:
    print("Auto-confirming all unconfirmed users in auth.users...")
    cur.execute("""
        UPDATE auth.users 
        SET email_confirmed_at = now()
        WHERE email_confirmed_at IS NULL;
    """)
    print(f"Successfully confirmed {cur.rowcount} users.")
    
    print("\nSetting up auto-confirm trigger for future users...")
    cur.execute("""
        CREATE OR REPLACE FUNCTION public.auto_confirm_user()
        RETURNS trigger AS $$
        BEGIN
          NEW.email_confirmed_at = now();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
    """)
    
    cur.execute("""
        DROP TRIGGER IF EXISTS on_auth_user_created_auto_confirm ON auth.users;
        CREATE TRIGGER on_auth_user_created_auto_confirm
        BEFORE INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.auto_confirm_user();
    """)
    print("Auto-confirm trigger installed successfully. New signups will be instantly confirmed!")
except Exception as e:
    print(f"Error: {e}")
finally:
    cur.close()
    conn.close()
