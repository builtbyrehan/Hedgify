"""Tests for agents/bridge.py — MCP bridge, order routing, hallucination guard."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from agents.bridge import (
    build_option_symbol,
    HedgeOrderResult,
    OrderStatus,
    _map_status,
    simulated_order,
    MCPClient,
)
from config import MAX_RETRIES


class TestBuildOptionSymbol:
    def test_standard_format(self):
        result = build_option_symbol("AAPL", "2026-09-18", 218.50, "P")
        assert result.startswith("AAPL  ")
        assert "260918" in result
        assert "P" in result
        assert "00218500" in result

    def test_different_symbol(self):
        result = build_option_symbol("MSFT", "2026-12-19", 400.0, "C")
        assert "MSFT" in result
        assert "261219" in result
        assert "C" in result

    def test_strike_zero_padded(self):
        result = build_option_symbol("T", "2026-09-18", 25.0, "P")
        assert "00025000" in result

    def test_large_strike(self):
        result = build_option_symbol("AMZN", "2026-09-18", 200.0, "P")
        assert "00200000" in result


class TestMapStatus:
    def test_filled(self):
        assert _map_status("filled") == OrderStatus.FILLED

    def test_pending_statuses(self):
        for s in ["accepted", "new", "pending", "partial_fill"]:
            assert _map_status(s) == OrderStatus.PENDING

    def test_rejected_statuses(self):
        for s in ["canceled", "cancelled", "expired", "rejected"]:
            assert _map_status(s) == OrderStatus.REJECTED

    def test_error(self):
        assert _map_status("error") == OrderStatus.ERROR

    def test_unknown_defaults_to_pending(self):
        assert _map_status("some_unknown_status") == OrderStatus.PENDING


class TestHedgeOrderResult:
    def test_create_success_result(self):
        result = HedgeOrderResult(
            success=True,
            order_id="ord-123",
            status=OrderStatus.FILLED,
            premium=345.0,
            path_used="mcp",
            symbol="AAPL",
            strike_price=218.5,
            expiry_date="2026-09-18",
            quantity=1,
        )
        assert result.success is True
        assert result.premium == 345.0
        assert result.path_used == "mcp"

    def test_create_failure_result(self):
        result = HedgeOrderResult(
            success=False,
            status=OrderStatus.REJECTED,
            error="Contract not found",
            path_used="rejected",
        )
        assert result.success is False
        assert result.error == "Contract not found"


class TestSimulatedOrder:
    def test_simulated_always_succeeds(self):
        result = simulated_order("AAPL", 218.5, "2026-09-18", 1)
        assert result.success is True
        assert result.path_used == "simulated"
        assert result.status == OrderStatus.FILLED

    def test_simulated_has_order_id(self):
        result = simulated_order("AAPL", 218.5, "2026-09-18", 1)
        assert result.order_id is not None
        assert len(result.order_id) > 0

    def test_simulated_premium_calculation(self):
        result = simulated_order("AAPL", 200.0, "2026-09-18", 1)
        expected_premium = 200.0 * 0.02 * 100
        assert result.premium == expected_premium

    def test_simulated_preserves_params(self):
        result = simulated_order("TSLA", 250.0, "2026-12-19", 2)
        assert result.symbol == "TSLA"
        assert result.strike_price == 250.0
        assert result.expiry_date == "2026-12-19"
        assert result.quantity == 2


class TestMCPClient:
    @pytest.mark.asyncio
    async def test_mcp_buy_put_success(self):
        client = MCPClient()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "status": "filled",
            "order_id": "mcp-ord-123",
            "filled_price": 3.45,
        }
        mock_resp.raise_for_status = MagicMock()
        client.client.post = AsyncMock(return_value=mock_resp)

        result = await client.buy_protective_put("AAPL", 218.5, "2026-09-18", 1)
        assert result.success is True
        assert result.path_used == "mcp"
        assert result.premium == 345.0  # 3.45 * 100

        await client.close()

    @pytest.mark.asyncio
    async def test_mcp_buy_put_error_response(self):
        client = MCPClient()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {"error": "Insufficient buying power"}
        mock_resp.raise_for_status = MagicMock()
        client.client.post = AsyncMock(return_value=mock_resp)

        result = await client.buy_protective_put("AAPL", 218.5, "2026-09-18", 1)
        assert result.success is False
        assert "Insufficient" in result.error

        await client.close()


class TestStatusEnum:
    def test_all_values(self):
        assert OrderStatus.FILLED.value == "filled"
        assert OrderStatus.PENDING.value == "pending"
        assert OrderStatus.REJECTED.value == "rejected"
        assert OrderStatus.ERROR.value == "error"
