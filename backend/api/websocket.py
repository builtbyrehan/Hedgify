"""
WebSocket manager — handles live connections from React dashboard.
"""

import asyncio
from fastapi import WebSocket, WebSocketDisconnect
from typing import List
import logging

from config import HEDGIFY_API_KEY

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        self.connections: List[WebSocket] = []
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.connections:
                self.connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Push a message to ALL connected dashboards."""
        dead_connections = []
        async with self._lock:
            conns = list(self.connections)
        for conn in conns:
            try:
                await conn.send_json(message)
            except Exception:
                dead_connections.append(conn)
        # Clean up broken connections
        async with self._lock:
            for dead in dead_connections:
                if dead in self.connections:
                    self.connections.remove(dead)

    async def endpoint(self, websocket: WebSocket):
        """React connects here: ws://localhost:8000/ws?token=<api_key>"""
        # Authenticate via query parameter
        token = websocket.query_params.get("token")
        if not token or token != HEDGIFY_API_KEY:
            await websocket.close(code=4001, reason="Invalid or missing token")
            return

        await self.connect(websocket)
        try:
            while True:
                # Keep connection alive, wait for any message
                data = await websocket.receive_text()
                # Echo back for heartbeat
                await websocket.send_json({"type": "pong", "data": data})
        except WebSocketDisconnect:
            await self.disconnect(websocket)
        except Exception:
            await self.disconnect(websocket)


websocket_manager = WebSocketManager()