"""Tests for agents/executor.py — hedge order executor."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
import agents.executor as executor_module
from agents.executor import HedgeExecutor
from models.database import Alert, Hedge


class TestHedgeExecutorInit:
    def test_init(self):
        executor = HedgeExecutor()
        assert executor is not None


class TestUpdateAlertStatus:
    def test_update_status(self, db_session):
        alert = Alert(stock_symbol="AAPL", current_price=230, drawdown_pct=0.03, status="fired")
        db_session.add(alert)
        db_session.commit()
        executor = HedgeExecutor()
        executor._update_alert_status(db_session, alert.id, "processed")
        db_session.expire_all()
        updated = db_session.query(Alert).filter(Alert.id == alert.id).first()
        assert updated.status == "processed"

    def test_update_nonexistent_alert(self, db_session):
        executor = HedgeExecutor()
        executor._update_alert_status(db_session, 99999, "processed")


class TestProcessAlert:
    @pytest.mark.asyncio
    async def test_kill_switch_disabled(self, db_session):
        alert = Alert(stock_symbol="AAPL", current_price=230, drawdown_pct=0.03, status="fired")
        db_session.add(alert)
        db_session.commit()
        alert_id = alert.id

        with patch.object(executor_module, "SessionLocal", return_value=db_session), \
             patch.object(executor_module, "get_setting", return_value=False), \
             patch.object(executor_module, "websocket_manager", new_callable=lambda: AsyncMock) as mock_ws:
            mock_ws.broadcast = AsyncMock()
            executor = HedgeExecutor()
            await executor.process_alert(alert_id, "AAPL", 230.0, 0.03)
            db_session.expire_all()
            updated = db_session.query(Alert).filter(Alert.id == alert_id).first()
            assert updated.status == "skipped"

    @pytest.mark.asyncio
    async def test_idempotency_guard(self, db_session):
        hedge = Hedge(
            stock_symbol="AAPL", strike_price=218.50, expiry_date="2026-09-18",
            quantity=1, premium_paid=345, status="active"
        )
        db_session.add(hedge)
        alert = Alert(stock_symbol="AAPL", current_price=230, drawdown_pct=0.03, status="fired")
        db_session.add(alert)
        db_session.commit()
        alert_id = alert.id

        settings = {"autonomous_hedging": True, "otm_buffer": 0.05, "expiry_days": 14, "max_premium": 500.0}

        def mock_get_setting(k, d=None):
            return settings.get(k, d)

        with patch.object(executor_module, "SessionLocal", return_value=db_session), \
             patch.object(executor_module, "get_setting", side_effect=mock_get_setting), \
             patch.object(executor_module, "websocket_manager", new_callable=lambda: AsyncMock) as mock_ws:
            mock_ws.broadcast = AsyncMock()
            executor = HedgeExecutor()
            await executor.process_alert(alert_id, "AAPL", 230.0, 0.03)
            db_session.expire_all()
            updated = db_session.query(Alert).filter(Alert.id == alert_id).first()
            assert updated.status == "skipped"

    @pytest.mark.asyncio
    async def test_budget_check_rejects_expensive_order(self, db_session):
        alert = Alert(stock_symbol="AAPL", current_price=500, drawdown_pct=0.03, status="fired")
        db_session.add(alert)
        db_session.commit()
        alert_id = alert.id

        settings = {"autonomous_hedging": True, "otm_buffer": 0.05, "expiry_days": 14, "max_premium": 100.0}

        def mock_get_setting(k, d=None):
            return settings.get(k, d)

        with patch.object(executor_module, "SessionLocal", return_value=db_session), \
             patch.object(executor_module, "get_setting", side_effect=mock_get_setting), \
             patch("services.app_settings.get_setting", side_effect=mock_get_setting), \
             patch.object(executor_module, "websocket_manager", new_callable=lambda: AsyncMock) as mock_ws:
            mock_ws.broadcast = AsyncMock()
            executor = HedgeExecutor()
            await executor.process_alert(alert_id, "AAPL", 500.0, 0.03)
            db_session.expire_all()
            updated = db_session.query(Alert).filter(Alert.id == alert_id).first()
            assert updated.status == "failed"

    @pytest.mark.asyncio
    async def test_successful_simulated_order(self, db_session):
        alert = Alert(stock_symbol="AAPL", current_price=230, drawdown_pct=0.03, status="fired")
        db_session.add(alert)
        db_session.commit()
        alert_id = alert.id

        settings = {"autonomous_hedging": True, "otm_buffer": 0.05, "expiry_days": 14, "max_premium": 500.0, "real_options_orders": False}

        def mock_get_setting(k, d=None):
            return settings.get(k, d)

        with patch.object(executor_module, "SessionLocal", return_value=db_session), \
             patch.object(executor_module, "get_setting", side_effect=mock_get_setting), \
             patch("services.app_settings.get_setting", side_effect=mock_get_setting), \
             patch.object(executor_module, "websocket_manager", new_callable=lambda: AsyncMock) as mock_ws:
            mock_ws.broadcast = AsyncMock()
            executor = HedgeExecutor()
            await executor.process_alert(alert_id, "AAPL", 230.0, 0.03)
            db_session.expire_all()
            updated = db_session.query(Alert).filter(Alert.id == alert_id).first()
            assert updated.status == "processed"
            hedges = db_session.query(Hedge).all()
            assert len(hedges) >= 1
            assert hedges[0].stock_symbol == "AAPL"
