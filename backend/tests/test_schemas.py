"""Tests for Pydantic schemas in schemas/events.py."""
import pytest
from datetime import datetime, timezone
from schemas.events import DrawdownEvent, HedgeIntent, OrderConfirmation


class TestDrawdownEvent:
    def test_create_valid_event(self):
        event = DrawdownEvent(
            event_id="evt-001",
            timestamp=datetime.now(timezone.utc),
            stock_symbol="AAPL",
            current_price=230.0,
            shares_held=100,
            portfolio_value=125000.0,
            peak_value=127000.0,
            drawdown_pct=0.0157,
            trigger_threshold=0.02,
        )
        assert event.event_id == "evt-001"
        assert event.event_type == "DRAWDOWN"
        assert event.stock_symbol == "AAPL"
        assert event.current_price == 230.0

    def test_default_event_type(self):
        event = DrawdownEvent(
            event_id="evt-002",
            timestamp=datetime.now(timezone.utc),
            stock_symbol="MSFT",
            current_price=420.0,
            shares_held=50,
            portfolio_value=125000.0,
            peak_value=127000.0,
            drawdown_pct=0.0157,
            trigger_threshold=0.02,
        )
        assert event.event_type == "DRAWDOWN"

    def test_missing_required_field_raises(self):
        with pytest.raises(Exception):
            DrawdownEvent(event_id="evt-003")


class TestHedgeIntent:
    def test_create_valid_intent(self):
        intent = HedgeIntent(
            symbol="AAPL",
            strike_price=218.50,
            expiration_date="2026-09-18",
            quantity=1,
        )
        assert intent.symbol == "AAPL"
        assert intent.strike_price == 218.50
        assert intent.expiration_date == "2026-09-18"
        assert intent.quantity == 1

    def test_missing_symbol_raises(self):
        with pytest.raises(Exception):
            HedgeIntent(strike_price=218.50, expiration_date="2026-09-18", quantity=1)


class TestOrderConfirmation:
    def test_create_valid_confirmation(self):
        conf = OrderConfirmation(
            order_id="ord-001",
            status="filled",
            filled_price=218.50,
            timestamp=datetime.now(timezone.utc),
        )
        assert conf.order_id == "ord-001"
        assert conf.status == "filled"
        assert conf.filled_price == 218.50

    def test_optional_filled_price(self):
        conf = OrderConfirmation(
            order_id="ord-002",
            status="pending",
            timestamp=datetime.now(timezone.utc),
        )
        assert conf.filled_price is None
