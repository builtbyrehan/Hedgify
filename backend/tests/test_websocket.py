"""Tests for api/websocket.py — WebSocket manager."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from api.websocket import WebSocketManager


class TestWebSocketManager:
    def test_init(self):
        mgr = WebSocketManager()
        assert mgr.connections == []

    @pytest.mark.asyncio
    async def test_connect(self):
        mgr = WebSocketManager()
        ws = AsyncMock()
        await mgr.connect(ws)
        assert ws in mgr.connections
        ws.accept.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_disconnect(self):
        mgr = WebSocketManager()
        ws = AsyncMock()
        mgr.connections = [ws]
        await mgr.disconnect(ws)
        assert ws not in mgr.connections

    @pytest.mark.asyncio
    async def test_disconnect_nonexistent_is_safe(self):
        mgr = WebSocketManager()
        ws = AsyncMock()
        await mgr.disconnect(ws)  # Should not raise

    @pytest.mark.asyncio
    async def test_broadcast_to_single_client(self):
        mgr = WebSocketManager()
        ws = AsyncMock()
        mgr.connections = [ws]
        await mgr.broadcast({"type": "ALERT", "data": "test"})
        ws.send_json.assert_awaited_once_with({"type": "ALERT", "data": "test"})

    @pytest.mark.asyncio
    async def test_broadcast_to_multiple_clients(self):
        mgr = WebSocketManager()
        ws1 = AsyncMock()
        ws2 = AsyncMock()
        ws3 = AsyncMock()
        mgr.connections = [ws1, ws2, ws3]
        await mgr.broadcast({"type": "PING"})
        ws1.send_json.assert_awaited_once()
        ws2.send_json.assert_awaited_once()
        ws3.send_json.assert_awaited_once()

    @pytest.mark.asyncio
    async def test_broadcast_removes_dead_connections(self):
        mgr = WebSocketManager()
        dead_ws = AsyncMock()
        dead_ws.send_json = AsyncMock(side_effect=Exception("connection closed"))
        alive_ws = AsyncMock()
        mgr.connections = [dead_ws, alive_ws]

        await mgr.broadcast({"type": "ALERT"})

        assert dead_ws not in mgr.connections
        assert alive_ws in mgr.connections

    @pytest.mark.asyncio
    async def test_broadcast_empty_connections(self):
        mgr = WebSocketManager()
        await mgr.broadcast({"type": "PING"})  # Should not raise
