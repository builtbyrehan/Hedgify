"""Tests for agents/monitor.py — portfolio monitoring agent."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone
from agents.monitor import MonitorAgent
from models.database import PortfolioSnapshot, Alert


class TestMonitorAgentInit:
    def test_init(self):
        agent = MonitorAgent()
        assert agent.running is True
        assert agent._poll_count == 0


class TestGetPeakValue:
    def test_returns_current_when_no_history(self, db_session_patched):
        agent = MonitorAgent()
        peak = agent._get_peak_value(db_session_patched, 125000.0)
        assert peak == 125000.0

    def test_returns_max_of_peak_and_current(self, db_session_patched):
        db_session_patched.add(PortfolioSnapshot(
            portfolio_value=120000, peak_value=127000, drawdown_pct=0.01
        ))
        db_session_patched.commit()
        agent = MonitorAgent()
        peak = agent._get_peak_value(db_session_patched, 125000.0)
        assert peak == 127000.0

    def test_current_exceeds_stored_peak(self, db_session_patched):
        db_session_patched.add(PortfolioSnapshot(
            portfolio_value=120000, peak_value=124000, drawdown_pct=0.01
        ))
        db_session_patched.commit()
        agent = MonitorAgent()
        peak = agent._get_peak_value(db_session_patched, 130000.0)
        assert peak == 130000.0


class TestCheckPortfolio:
    @pytest.mark.asyncio
    async def test_stores_snapshot(self, db_session_patched, mock_alpaca):
        with patch("agents.monitor.alpaca", mock_alpaca), \
             patch("agents.monitor.SessionLocal", return_value=db_session_patched), \
             patch("agents.monitor.websocket_manager", new_callable=lambda: AsyncMock) as mock_ws:
            mock_ws.broadcast = AsyncMock()
            agent = MonitorAgent()
            await agent.check_portfolio()
            snaps = db_session_patched.query(PortfolioSnapshot).all()
            assert len(snaps) >= 1

    @pytest.mark.asyncio
    async def test_no_alert_when_below_threshold(self, db_session_patched, mock_alpaca):
        with patch("agents.monitor.alpaca", mock_alpaca), \
             patch("agents.monitor.SessionLocal", return_value=db_session_patched), \
             patch("agents.monitor.websocket_manager", new_callable=lambda: AsyncMock) as mock_ws:
            mock_ws.broadcast = AsyncMock()
            agent = MonitorAgent()
            await agent.check_portfolio()
            alerts = db_session_patched.query(Alert).all()
            assert len(alerts) == 0

    @pytest.mark.asyncio
    async def test_fires_alert_when_above_threshold(self, db_session_patched, mock_alpaca):
        db_session_patched.add(PortfolioSnapshot(
            portfolio_value=130000, peak_value=130000, drawdown_pct=0.0
        ))
        db_session_patched.commit()

        mock_alpaca.get_account = AsyncMock(return_value={
            "portfolio_value": "100000.00",
            "cash": "50000.00",
        })
        with patch("agents.monitor.alpaca", mock_alpaca), \
             patch("agents.monitor.SessionLocal", return_value=db_session_patched), \
             patch("agents.monitor.websocket_manager", new_callable=lambda: AsyncMock) as mock_ws, \
             patch("agents.executor.executor", new_callable=lambda: AsyncMock) as mock_exec:
            mock_ws.broadcast = AsyncMock()
            mock_exec.process_alert = AsyncMock()
            agent = MonitorAgent()
            await agent.check_portfolio()
            db_session_patched.expire_all()
            alerts = db_session_patched.query(Alert).all()
            assert len(alerts) >= 1
            assert alerts[0].status == "fired"
