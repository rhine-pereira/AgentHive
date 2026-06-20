"""IDE Projects router — project CRUD for the smart contract IDE."""

import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from services.supabase_client import get_client

router = APIRouter()


class FileItem(BaseModel):
    name: str
    content: str
    language: str  # "solidity" | "rust" | "javascript"


class CreateProjectRequest(BaseModel):
    name: str
    chain: str
    language: str
    user_wallet: str
    files: Optional[List[FileItem]] = None


class UpdateProjectRequest(BaseModel):
    name: Optional[str] = None
    files: Optional[List[FileItem]] = None


@router.post("/")
async def create_project(req: CreateProjectRequest):
    """Create a new IDE project with optional initial files."""
    supabase = get_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")

    project_id = str(uuid.uuid4())
    project_data = {
        "id": project_id,
        "name": req.name,
        "chain": req.chain,
        "language": req.language,
        "user_wallet": req.user_wallet,
    }
    supabase.table("ide_projects").insert(project_data).execute()

    if req.files:
        file_rows = [
            {
                "project_id": project_id,
                "name": f.name,
                "content": f.content,
                "language": f.language,
            }
            for f in req.files
        ]
        supabase.table("ide_files").insert(file_rows).execute()

    return {"success": True, "project_id": project_id}


@router.get("/user/{wallet_address}")
async def get_user_projects(wallet_address: str):
    """Fetch all projects for a given wallet address."""
    supabase = get_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")

    result = (
        supabase.table("ide_projects")
        .select("*")
        .eq("user_wallet", wallet_address)
        .order("updated_at", desc=True)
        .execute()
    )
    return {"projects": result.data or []}


@router.get("/{project_id}")
async def get_project(project_id: str):
    """Fetch a single project with its files."""
    supabase = get_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")

    proj = supabase.table("ide_projects").select("*").eq("id", project_id).single().execute()
    if not proj.data:
        raise HTTPException(status_code=404, detail="Project not found")

    files = supabase.table("ide_files").select("*").eq("project_id", project_id).execute()
    return {"project": proj.data, "files": files.data or []}


@router.put("/{project_id}")
async def update_project(project_id: str, req: UpdateProjectRequest):
    """Update project name and/or files (files are fully replaced)."""
    supabase = get_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")

    if req.name:
        supabase.table("ide_projects").update({"name": req.name}).eq("id", project_id).execute()

    if req.files is not None:
        supabase.table("ide_files").delete().eq("project_id", project_id).execute()
        if req.files:
            file_rows = [
                {
                    "project_id": project_id,
                    "name": f.name,
                    "content": f.content,
                    "language": f.language,
                }
                for f in req.files
            ]
            supabase.table("ide_files").insert(file_rows).execute()

    return {"success": True}


@router.delete("/{project_id}")
async def delete_project(project_id: str):
    """Delete a project and cascade its files."""
    supabase = get_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")

    supabase.table("ide_projects").delete().eq("id", project_id).execute()
    return {"success": True}
