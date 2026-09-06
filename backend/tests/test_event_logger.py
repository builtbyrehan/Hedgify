"""Tests for services/event_logger.py — telemetry logging."""
import pytest
from unittest.mock import patch, MagicMock
from services.event_logger import log_event
from models.database import EventLog


@pytest.fixture(autouse=True)
def _patch_event_logger_session():
    """Patch the SessionLocal used by event_logger to use our test DB."""
    with patch("services.event_logger.SessionLocal", _TestSessionLocal):
        yield


# Import the test SessionLocal from conftest
import tests.conftest as _conftest
_TestSessionLocal = _conftest._TestSessionLocal


class TestLogEvent:
    def test_creates_event_log_in_db(self, db_session):
        log_event("Monitor", "PORTFOLIO_CHECK", "Portfolio healthy")
        logs = db_session.query(EventLog).all()
        assert len(logs) == 1
        assert logs[0].agent == "Monitor"
        assert logs[0].event_type == "PORTFOLIO_CHECK"
        assert logs[0].message == "Portfolio healthy"
        assert logs[0].severity == "info"

    def test_custom_severity(self, db_session):
        log_event("Executor", "ORDER_FAILED", "Order rejected", severity="error")
        logs = db_session.query(EventLog).filter(EventLog.severity == "error").all()
        assert len(logs) == 1

    def test_warning_severity(self, db_session):
        log_event("Monitor", "DRAWDOWN_ALERT", "Drawdown breached", severity="warning")
        logs = db_session.query(EventLog).filter(EventLog.severity == "warning").all()
        assert len(logs) == 1

    def test_multiple_events(self, db_session):
        log_event("Monitor", "EVENT_1", "Message 1")
        log_event("Executor", "EVENT_2", "Message 2")
        log_event("Bridge", "EVENT_3", "Message 3")
        logs = db_session.query(EventLog).all()
        assert len(logs) == 3

    def test_never_raises_on_db_error(self):
        """Event logger must not raise even if DB is broken."""
        with patch("services.event_logger.SessionLocal", side_effect=Exception("DB down")):
            log_event("Monitor", "TEST", "This should not crash")
