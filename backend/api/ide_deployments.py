"""IDE Deployments router — record and retrieve contract deployments."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Any
from services.supabase_client import get_client

router = APIRouter()


class SaveDeploymentRequest(BaseModel):
    project_id: Optional[str] = None
    user_wallet: str
    chain: str
    chain_id: int
    contract_name: str
    contract_address: str
    tx_hash: str
    abi: List[Any] = []
    bytecode: str = ""


@router.post("/")
async def save_deployment(req: SaveDeploymentRequest):
    """Save a new deployment record after a successful on-chain deploy."""
    supabase = get_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")

    row = {
        "project_id": req.project_id,
        "user_wallet": req.user_wallet,
        "chain": req.chain,
        "chain_id": req.chain_id,
        "contract_name": req.contract_name,
        "contract_address": req.contract_address,
        "tx_hash": req.tx_hash,
        "abi": req.abi,
        "bytecode": req.bytecode,
    }
    result = supabase.table("ide_deployments").insert(row).execute()
    deployment_id = result.data[0]["id"] if result.data else None
    return {"success": True, "deployment_id": deployment_id}


@router.get("/user/{wallet_address}")
async def get_user_deployments(wallet_address: str):
    """Fetch deployment history for a wallet (latest 50)."""
    supabase = get_client()
    if not supabase:
        raise HTTPException(status_code=503, detail="Database unavailable")

    result = (
        supabase.table("ide_deployments")
        .select("id,user_wallet,chain,chain_id,contract_name,contract_address,tx_hash,deployed_at")
        .eq("user_wallet", wallet_address)
        .order("deployed_at", desc=True)
        .limit(50)
        .execute()
    )
    return {"deployments": result.data or []}
