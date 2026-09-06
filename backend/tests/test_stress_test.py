"""Tests for services/stress_test.py — crash simulation engine."""
import pytest
from unittest.mock import patch, AsyncMock
from services.stress_test import run_stress_test, DEMO_PRICES, _find_position


class TestDemoPrices:
    def test_known_symbols(self):
        assert "AAPL" in DEMO_PRICES
        assert "MSFT" in DEMO_PRICES
        assert "GOOGL" in DEMO_PRICES
        assert "NVDA" in DEMO_PRICES
        assert "TSLA" in DEMO_PRICES

    def test_prices_are_positive(self):
        for symbol, price in DEMO_PRICES.items():
            assert price > 0, f"{symbol} price should be positive"


class TestRunStressTest:
    @pytest.mark.asyncio
    async def test_basic_stress_test(self, mock_alpaca):
        with patch("services.stress_test.alpaca", mock_alpaca):
            result = await run_stress_test("AAPL", 0.15)
            assert result["symbol"] == "AAPL"
            assert result["drop_pct"] == 0.15
            assert result["shares"] == 100
            assert result["has_position"] is True
            assert result["unhedged_loss"] > 0

    @pytest.mark.asyncio
    async def test_stress_test_no_position(self, mock_alpaca):
        mock_alpaca.get_positions = AsyncMock(return_value=[])
        with patch("services.stress_test.alpaca", mock_alpaca):
            result = await run_stress_test("AAPL", 0.10)
            assert result["has_position"] is False
            assert result["shares"] == 100  # default demo

    @pytest.mark.asyncio
    async def test_hedged_loss_lower_than_unhedged(self, mock_alpaca):
        with patch("services.stress_test.alpaca", mock_alpaca):
            result = await run_stress_test("AAPL", 0.20)
            assert result["hedged_loss"] <= result["unhedged_loss"]

    @pytest.mark.asyncio
    async def test_put_payout_calculation(self, mock_alpaca):
        with patch("services.stress_test.alpaca", mock_alpaca):
            result = await run_stress_test("AAPL", 0.15)
            strike = result["strike"]
            new_price = result["new_price"]
            expected_intrinsic = max(0, strike - new_price)
            assert result["put_payout"] == round(expected_intrinsic * result["shares"], 2)

    @pytest.mark.asyncio
    async def test_money_saved_non_negative(self, mock_alpaca):
        with patch("services.stress_test.alpaca", mock_alpaca):
            result = await run_stress_test("AAPL", 0.15)
            assert result["money_saved"] >= 0

    @pytest.mark.asyncio
    async def test_unknown_symbol_uses_default_price(self, mock_alpaca):
        mock_alpaca.get_positions = AsyncMock(return_value=[])
        with patch("services.stress_test.alpaca", mock_alpaca):
            result = await run_stress_test("UNKNOWN", 0.10)
            assert result["current_price"] == 100.0  # default fallback

    @pytest.mark.asyncio
    async def test_cpr_calculation(self, mock_alpaca):
        with patch("services.stress_test.alpaca", mock_alpaca):
            result = await run_stress_test("AAPL", 0.30)
            assert 0 <= result["cpr"] <= 1


class TestFindPosition:
    @pytest.mark.asyncio
    async def test_finds_held_position(self, mock_alpaca):
        with patch("services.stress_test.alpaca", mock_alpaca):
            price, shares, has_pos = await _find_position("AAPL")
            assert price == 230.0
            assert shares == 100
            assert has_pos is True

    @pytest.mark.asyncio
    async def test_returns_default_for_unknown(self, mock_alpaca):
        mock_alpaca.get_positions = AsyncMock(return_value=[])
        with patch("services.stress_test.alpaca", mock_alpaca):
            price, shares, has_pos = await _find_position("FAKE")
            assert has_pos is False
            assert price == 100.0

    @pytest.mark.asyncio
    async def test_handles_api_error(self, mock_alpaca):
        mock_alpaca.get_positions = AsyncMock(side_effect=Exception("API down"))
        with patch("services.stress_test.alpaca", mock_alpaca):
            price, shares, has_pos = await _find_position("AAPL")
            assert has_pos is False
