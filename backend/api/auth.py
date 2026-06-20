from fastapi import APIRouter, Header, HTTPException
from services.supabase_client import get_supabase

router = APIRouter()


@router.get("/me")
async def get_current_user(authorization: str = Header(None)):
    """Return the authenticated user's profile from a Supabase JWT."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")

    token = authorization.split(" ", 1)[1]
    sb = get_supabase()
    if not sb:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    try:
        user_response = sb.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {
            "id": user.id,
            "email": user.email,
            "name": user.user_metadata.get("full_name", ""),
            "role": user.user_metadata.get("role", "client"),
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))
