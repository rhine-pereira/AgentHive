"""IDE Compile router — Solidity compilation endpoints."""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.solidity_compiler import compile_solidity, get_available_versions

router = APIRouter()


class CompileSolidityRequest(BaseModel):
    source_code: str
    compiler_version: Optional[str] = "0.8.24"
    optimize: Optional[bool] = True
    optimize_runs: Optional[int] = 200


@router.post("/solidity")
async def compile_solidity_endpoint(req: CompileSolidityRequest):
    """Compile Solidity source code server-side."""
    contracts, errors, warnings = compile_solidity(
        source_code=req.source_code,
        compiler_version=req.compiler_version or "0.8.24",
        optimize=req.optimize if req.optimize is not None else True,
        optimize_runs=req.optimize_runs or 200,
    )
    return {
        "success": len(errors) == 0 and len(contracts) > 0,
        "contracts": contracts,
        "errors": errors,
        "warnings": warnings,
    }


@router.get("/versions")
async def list_versions():
    """List available solc compiler versions."""
    return {"versions": get_available_versions()}
