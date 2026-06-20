import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase: Client = None


def init_supabase() -> Client:
    global supabase
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_KEY")
    if not url or not key:
        print("⚠️  SUPABASE_URL or SUPABASE_SERVICE_KEY not set — running in mock mode.")
        return None
    supabase = create_client(url, key)
    return supabase


def get_supabase() -> Client:
    global supabase
    if not supabase:
        return init_supabase()
    return supabase


def get_client() -> Client:
    """Alias for get_supabase — backward compatibility for IDE modules."""
    return get_supabase()

