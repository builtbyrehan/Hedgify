"""
WebSocket manager — handles live connections from React dashboard.
"""

from fastapi import WebSocket
from typing import List


class WebSocketManager:
    def __init__(self):
        self.connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.connections:
            self.connections.remove(websocket)

    async def broadcast(self, message: dict):
        """Push a message to ALL connected dashboards."""
        import json
        dead_connections = []
        for conn in self.connections:
            try:
                await conn.send_json(message)
            except Exception:
                dead_connections.append(conn)
        # Clean up broken connections
        for dead in dead_connections:
            self.disconnect(dead)

    async def endpoint(self, websocket: WebSocket):
        """React connects here: ws://localhost:8000/ws"""
        await self.connect(websocket)
        try:
            while True:
                # Keep connection alive, wait for any message
                data = await websocket.receive_text()
                # Echo back for heartbeat
                await websocket.send_json({"type": "pong", "data": data})
        except Exception:
            self.disconnect(websocket)


websocket_manager = WebSocketManager()