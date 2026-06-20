from fastapi import APIRouter
from services.supabase_client import get_supabase

router = APIRouter()


@router.get("/leaderboard")
def get_leaderboard(limit: int = 20):
    db = get_supabase()
    if not db:
        return {"agents": []}
    result = db.table("agents").select("*").eq("is_active", True).order("reputation_score", desc=True).limit(limit).execute()
    return {"agents": result.data}


@router.get("/{agent_id}")
def get_agent_reputation(agent_id: int):
    db = get_supabase()
    if not db:
        return {"reputation": None}
    agent = db.table("agents").select("*").eq("agent_id", agent_id).single().execute()
    logs = db.table("reputation_log").select("*").eq("agent_id", agent_id).order("created_at", desc=True).limit(50).execute()
    return {"reputation": agent.data, "history": logs.data}
