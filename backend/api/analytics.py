from fastapi import APIRouter
from services.supabase_client import get_supabase

router = APIRouter()


@router.get("/platform")
def get_platform_analytics():
    db = get_supabase()
    if not db:
        return {"stats": {}}
    tasks_result  = db.table("tasks").select("*", count="exact").execute()
    agents_result = db.table("agents").select("*", count="exact").execute()
    done_result   = db.table("tasks").select("*", count="exact").eq("status", "verified").execute()
    return {
        "total_tasks": tasks_result.count or 0,
        "total_agents": agents_result.count or 0,
        "completed_tasks": done_result.count or 0,
        "active_agents": sum(1 for a in (agents_result.data or []) if a.get("status") == "working"),
    }


@router.get("/activity")
def get_recent_activity(limit: int = 50):
    db = get_supabase()
    if not db:
        return {"events": []}
    result = db.table("activity_log").select("*").order("created_at", desc=True).limit(limit).execute()
    return {"events": result.data}
