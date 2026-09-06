"""
Shared test fixtures — in-memory SQLite, mocked Alpaca client, and FastAPI TestClient.
"""
import os
import sys
import pytest
from contextlib import asynccontextmanager
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

# Set env vars BEFORE importing any app modules (config.py calls sys.exit if missing)
os.environ.setdefault("ALPACA_API_KEY", "test-api-key")
os.environ.setdefault("ALPACA_SECRET_KEY", "test-secret-key")
os.environ.setdefault("HEDGIFY_API_KEY", "test-hedgify-key")

# Ensure backend is on sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Create in-memory test engine with StaticPool so all connections share the same DB
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from models.database import Base

_test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
Base.metadata.create_all(bind=_test_engine)
_TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_test_engine)


@pytest.fixture(autouse=True)
def _patch_config():
    """Patch config.py so tests never call sys.exit."""
    with patch("config.ALPACA_API_KEY", "test-api-key"), \
         patch("config.ALPACA_SECRET_KEY", "test-secret-key"), \
         patch("config.HEDGIFY_API_KEY", "test-hedgify-key"):
        yield


@pytest.fixture(autouse=True)
def _clean_db():
    """Clean all tables before each test to prevent state leakage."""
    with _test_engine.connect() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
        conn.commit()
    yield
    with _test_engine.connect() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())
        conn.commit()


@pytest.fixture()
def db_session():
    """Provide an isolated in-memory SQLite session for each test."""
    session = _TestSessionLocal()
    yield session
    session.close()


@pytest.fixture()
def db_session_patched(db_session):
    """Alias for backwards compatibility with tests that use db_session_patched."""
    yield db_session


@asynccontextmanager
async def _noop_lifespan(app_instance):
    yield


@pytest.fixture()
def client(db_session, mock_alpaca):
    """Create a FastAPI test client with in-memory DB and mocked Alpaca."""
    from models.database import get_db

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    with patch("models.database.engine", _test_engine), \
         patch("models.database.SessionLocal", _TestSessionLocal), \
         patch("services.app_settings.SessionLocal", _TestSessionLocal), \
         patch("services.event_logger.SessionLocal", _TestSessionLocal), \
         patch("agents.monitor.SessionLocal", _TestSessionLocal), \
         patch("agents.executor.SessionLocal", _TestSessionLocal), \
         patch("services.alpaca_client.alpaca", mock_alpaca), \
         patch("main.SessionLocal", _TestSessionLocal):

        from main import app
        app.router.lifespan_context = _noop_lifespan
        app.dependency_overrides[get_db] = override_get_db

        # Seed test data
        from models.database import PortfolioSnapshot, Alert, Hedge, EventLog
        db_session.add(PortfolioSnapshot(
            portfolio_value=125000, peak_value=127000, drawdown_pct=0.0157
        ))
        db_session.add(Alert(
            stock_symbol="AAPL", current_price=230, drawdown_pct=0.03, status="fired"
        ))
        db_session.add(Hedge(
            stock_symbol="AAPL", strike_price=218.50, expiry_date="2026-09-18",
            quantity=1, premium_paid=345, status="active"
        ))
        db_session.add(EventLog(
            agent="Monitor", event_type="PORTFOLIO_CHECK", message="Test log"
        ))
        db_session.commit()

        from fastapi.testclient import TestClient
        with TestClient(app, raise_server_exceptions=False) as c:
            yield c

        app.dependency_overrides.clear()


@pytest.fixture()
def mock_alpaca():
    """Mock the Alpaca HTTP client to avoid real API calls."""
    mock = AsyncMock()
    mock.get_account = AsyncMock(return_value={
        "portfolio_value": "125000.00",
        "cash": "50000.00",
    })
    mock.get_positions = AsyncMock(return_value=[
        {"symbol": "AAPL", "current_price": "230.00", "market_value": "23000.00", "qty": "100"}
    ])
    mock.get_latest_price = AsyncMock(return_value={"last_trade": {"price": 230.0}})
    mock.submit_option_order = AsyncMock(return_value={
        "success": True,
        "order_id": "test-order-123",
        "premium": 345.00,
        "status": "filled",
    })
    mock._find_put_contract = AsyncMock(return_value={
        "symbol": "AAPL260918P00218000",
        "ask": 3.45,
    })
    mock.close = AsyncMock()
    mock.client = MagicMock()
    mock.client.delete = AsyncMock(return_value=MagicMock(status_code=200))
    mock.data_client = MagicMock()
    return mock


@pytest.fixture()
def mock_websocket_manager():
    """Mock the WebSocket manager."""
    mock = AsyncMock()
    mock.broadcast = AsyncMock()
    mock.connect = AsyncMock()
    mock.disconnect = AsyncMock()
    mock.connections = []
    return mock
