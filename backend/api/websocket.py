from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import asyncio, json
from services.supabase_client import get_supabase

router = APIRouter()

active_connections: List[WebSocket] = []


@router.websocket("/live")
async def websocket_live_feed(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        while True:
            # Keep alive ping
            await asyncio.sleep(30)
            await websocket.send_json({"type": "ping"})
    except WebSocketDisconnect:
        active_connections.remove(websocket)


async def broadcast(event: dict):
    """Broadcast an event to all connected WebSocket clients."""
    dead = []
    for ws in active_connections:
        try:
            await ws.send_json(event)
        except Exception:
            dead.append(ws)
    for ws in dead:
        active_connections.remove(ws)
