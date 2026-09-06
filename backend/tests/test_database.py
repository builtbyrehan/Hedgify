"""Tests for models/database.py — SQLAlchemy models and DB operations."""
import pytest
from datetime import datetime, timezone
from models.database import PortfolioSnapshot, Alert, Hedge, EventLog, AppSetting


class TestPortfolioSnapshot:
    def test_create_snapshot(self, db_session):
        snap = PortfolioSnapshot(
            portfolio_value=125000.00,
            peak_value=127000.00,
            drawdown_pct=0.0157,
        )
        db_session.add(snap)
        db_session.commit()
        assert snap.id is not None
        assert snap.timestamp is not None

    def test_snapshot_values(self, db_session):
        snap = PortfolioSnapshot(
            portfolio_value=100000.00,
            peak_value=110000.00,
            drawdown_pct=0.0909,
        )
        db_session.add(snap)
        db_session.commit()
        assert float(snap.portfolio_value) == 100000.00
        assert float(snap.peak_value) == 110000.00
        assert snap.drawdown_pct == 0.0909


class TestAlert:
    def test_create_alert(self, db_session):
        alert = Alert(
            stock_symbol="AAPL",
            current_price=230.00,
            drawdown_pct=0.028,
            status="fired",
        )
        db_session.add(alert)
        db_session.commit()
        assert alert.id is not None
        assert alert.status == "fired"

    def test_default_status(self, db_session):
        alert = Alert(
            stock_symbol="MSFT",
            current_price=420.00,
            drawdown_pct=0.03,
        )
        db_session.add(alert)
        db_session.commit()
        assert alert.status == "fired"


class TestHedge:
    def test_create_hedge(self, db_session):
        hedge = Hedge(
            stock_symbol="AAPL",
            strike_price=218.50,
            expiry_date="2026-09-18",
            quantity=1,
            premium_paid=345.00,
            status="active",
        )
        db_session.add(hedge)
        db_session.commit()
        assert hedge.id is not None
        assert hedge.status == "active"

    def test_default_hedge_status(self, db_session):
        hedge = Hedge(
            stock_symbol="TSLA",
            strike_price=237.50,
            expiry_date="2026-09-18",
            quantity=2,
            premium_paid=500.00,
        )
        db_session.add(hedge)
        db_session.commit()
        assert hedge.status == "active"


class TestEventLog:
    def test_create_event_log(self, db_session):
        log = EventLog(
            agent="Monitor",
            event_type="PORTFOLIO_CHECK",
            message="Portfolio healthy",
            severity="info",
        )
        db_session.add(log)
        db_session.commit()
        assert log.id is not None
        assert log.agent == "Monitor"

    def test_default_severity(self, db_session):
        log = EventLog(
            agent="Executor",
            event_type="HEDGE_PLACED",
            message="Put order filled",
        )
        db_session.add(log)
        db_session.commit()
        assert log.severity == "info"


class TestAppSetting:
    def test_create_setting(self, db_session):
        setting = AppSetting(key="drawdown_threshold", value="0.03")
        db_session.add(setting)
        db_session.commit()
        assert setting.key == "drawdown_threshold"
        assert setting.value == "0.03"

    def test_setting_primary_key(self, db_session):
        s1 = AppSetting(key="test_key", value="val1")
        s2 = AppSetting(key="test_key", value="val2")
        db_session.add(s1)
        db_session.commit()
        db_session.add(s2)
        with pytest.raises(Exception):
            db_session.commit()


class TestQueryOperations:
    def test_query_snapshots_order(self, db_session):
        for i in range(5):
            db_session.add(PortfolioSnapshot(
                portfolio_value=100000 + i * 1000,
                peak_value=110000,
                drawdown_pct=0.01,
            ))
        db_session.commit()
        snaps = db_session.query(PortfolioSnapshot).order_by(
            PortfolioSnapshot.timestamp.desc()
        ).all()
        assert len(snaps) == 5

    def test_query_alerts_by_status(self, db_session):
        db_session.add(Alert(stock_symbol="AAPL", current_price=230, drawdown_pct=0.03, status="fired"))
        db_session.add(Alert(stock_symbol="AAPL", current_price=230, drawdown_pct=0.03, status="processed"))
        db_session.commit()
        fired = db_session.query(Alert).filter(Alert.status == "fired").all()
        assert len(fired) == 1

    def test_query_hedges_by_symbol(self, db_session):
        db_session.add(Hedge(stock_symbol="AAPL", strike_price=218, expiry_date="2026-09-18", quantity=1, premium_paid=345, status="active"))
        db_session.add(Hedge(stock_symbol="TSLA", strike_price=237, expiry_date="2026-09-18", quantity=1, premium_paid=400, status="active"))
        db_session.commit()
        aapl = db_session.query(Hedge).filter(Hedge.stock_symbol == "AAPL").all()
        assert len(aapl) == 1
