from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import jwt, JWTError
from typing import Dict, List
import json

from app.config import get_settings

settings = get_settings()

router = APIRouter()

active_connections: Dict[int, List[WebSocket]] = {}
org_connections: Dict[int, List[WebSocket]] = {}


def _verify_ws_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


@router.websocket("/ws/donor/{donor_id}")
async def donor_websocket(websocket: WebSocket, donor_id: int, token: str = Query(default="")):
    payload = _verify_ws_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return
    if int(payload.get("sub")) != donor_id:
        await websocket.close(code=4003, reason="Token does not match donor_id")
        return

    await websocket.accept()
    if donor_id not in active_connections:
        active_connections[donor_id] = []
    active_connections[donor_id].append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        active_connections[donor_id].remove(websocket)
        if not active_connections[donor_id]:
            del active_connections[donor_id]


@router.websocket("/ws/hospital/{org_id}")
async def hospital_websocket(websocket: WebSocket, org_id: int, token: str = Query(default="")):
    payload = _verify_ws_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return
    if int(payload.get("sub")) != payload.get("sub"):
        pass

    await websocket.accept()
    if org_id not in org_connections:
        org_connections[org_id] = []
    org_connections[org_id].append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        org_connections[org_id].remove(websocket)
        if not org_connections[org_id]:
            del org_connections[org_id]


def broadcast_match_to_donor(donor_id: int, message: dict):
    import asyncio
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    if donor_id in active_connections:
        for ws in active_connections[donor_id]:
            try:
                loop.create_task(ws.send_json(message))
            except Exception:
                pass


def broadcast_to_hospital(org_id: int, message: dict):
    import asyncio
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    if org_id in org_connections:
        for ws in org_connections[org_id]:
            try:
                loop.create_task(ws.send_json(message))
            except Exception:
                pass


async def notify_donor(donor_id: int, message: dict):
    if donor_id in active_connections:
        for ws in active_connections[donor_id]:
            try:
                await ws.send_json(message)
            except Exception:
                pass


async def notify_hospital(org_id: int, message: dict):
    if org_id in org_connections:
        for ws in org_connections[org_id]:
            try:
                await ws.send_json(message)
            except Exception:
                pass
