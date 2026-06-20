from fastapi import APIRouter
from services.supabase_client import get_supabase

router = APIRouter()


@router.get("/")
def list_agents():
    db = get_supabase()
    if not db:
        return {"agents": [], "total": 0}
    result = db.table("agents").select("*").eq("is_active", True).order("reputation_score", desc=True).execute()
    return {"agents": result.data, "total": len(result.data)}


@router.get("/{agent_id}")
def get_agent(agent_id: int):
    db = get_supabase()
    if not db:
        return {"agent": None}
    result = db.table("agents").select("*").eq("agent_id", agent_id).single().execute()
    return {"agent": result.data}


@router.get("/{agent_id}/history")
def get_agent_history(agent_id: int, limit: int = 20):
    db = get_supabase()
    if not db:
        return {"tasks": []}
    result = (
        db.table("tasks")
        .select("*")
        .eq("assigned_agent_id", agent_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return {"tasks": result.data}
