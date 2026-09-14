import asyncio
import json
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger("polyman.events")

class EventManager:
    def __init__(self):
        # Map run_id -> set of active WebSocket connections
        self._connections: Dict[str, Set[WebSocket]] = {}
        # Global connections (listening to all runs)
        self._global_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, run_id: str = "global"):
        await websocket.accept()
        if run_id == "global":
            self._global_connections.add(websocket)
        else:
            if run_id not in self._connections:
                self._connections[run_id] = set()
            self._connections[run_id].add(websocket)
        logger.info(f"WebSocket client connected for run: {run_id}")

    def disconnect(self, websocket: WebSocket, run_id: str = "global"):
        if run_id == "global":
            self._global_connections.discard(websocket)
        elif run_id in self._connections:
            self._connections[run_id].discard(websocket)
            if not self._connections[run_id]:
                del self._connections[run_id]
        logger.info(f"WebSocket client disconnected from run: {run_id}")

    async def broadcast(self, run_id: str, event_type: str, data: dict):
        payload = {
            "run_id": run_id,
            "type": event_type,
            "data": data
        }
        text_data = json.dumps(payload)

        # Broadcast to specific run listeners
        targets = set(self._connections.get(run_id, [])) | self._global_connections
        dead_sockets = set()
        
        for ws in targets:
            try:
                await ws.send_text(text_data)
            except Exception as e:
                dead_sockets.add(ws)

        for dead in dead_sockets:
            self._global_connections.discard(dead)
            if run_id in self._connections:
                self._connections[run_id].discard(dead)

event_manager = EventManager()
