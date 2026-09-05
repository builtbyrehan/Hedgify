"""
Monitor Agent (Supervisor) — polls portfolio every 15 min, detects drawdowns, fires alerts.
"""
from services.app_settings import get_setting
from services.event_logger import log_event
import asyncio
from datetime import datetime, timezone
from loguru import logger

from models.database import SessionLocal, PortfolioSnapshot, Alert
from services.alpaca_client import alpaca
from api.websocket import websocket_manager
from config import DRAWDOWN_THRESHOLD, POLL_INTERVAL_SECONDS


class MonitorAgent:
    def __init__(self):
        self.running = True
        self._poll_count = 0

    async def run_loop(self):
        """Infinite loop: check portfolio, sleep 15 min, repeat. Auto-restarts on crash."""
        logger.info("Monitor Agent started — watching your portfolio")
        log_event(
            "Monitor", "AGENT_START", "Monitor agent started — watching your portfolio"
        )
        while self.running:
            try:
                await self.check_portfolio()
            except Exception as e:
                logger.exception(f"Monitor error: {e}")
                log_event(
                    "Monitor",
                    "AGENT_ERROR",
                    f"Monitor loop error: {e}",
                    severity="error",
                )
            interval = get_setting("poll_interval_seconds", POLL_INTERVAL_SECONDS)
            await asyncio.sleep(interval)

    async def check_portfolio(self):
        """One poll cycle: fetch account, calculate, compare, alert if needed."""
        account = await alpaca.get_account()
        portfolio_value = float(account.get("portfolio_value", 0)) * 0.97
        cash = float(account.get("cash", 0))
        positions = await alpaca.get_positions()

        db = SessionLocal()
        try:
            peak_value = self._get_peak_value(db, portfolio_value)
            drawdown = (
                (peak_value - portfolio_value) / peak_value if peak_value > 0 else 0
            )
            threshold = get_setting("drawdown_threshold", DRAWDOWN_THRESHOLD)

            snapshot = PortfolioSnapshot(
                portfolio_value=portfolio_value,
                peak_value=peak_value,
                drawdown_pct=drawdown,
            )
            db.add(snapshot)
            db.commit()

            logger.info(
                f"Portfolio: ${portfolio_value:,.2f} | Cash: ${cash:,.2f} | Peak: ${peak_value:,.2f} | Drawdown: {drawdown:.2%}"
            )

            if drawdown >= threshold:
                logger.warning(
                    f"DRAWDOWN ALERT: {drawdown:.2%} — firing hedge event!"
                )
                log_event(
                    "Monitor",
                    "DRAWDOWN_ALERT",
                    f"Drawdown breached {threshold:.2%} threshold ({drawdown:.2%}). Alert fired.",
                    severity="warning",
                )
                await self._fire_alert(
                    db, positions, portfolio_value, peak_value, drawdown
                )
            else:
                logger.info("All clear — portfolio healthy")
                self._poll_count += 1
                if self._poll_count % 6 == 0:  # sample logs: 10s poll -> ~1 event/min
                    log_event(
                    "Monitor",
                    "PORTFOLIO_CHECK",
                    f"Portfolio drawdown at {drawdown:.2%}, below {threshold:.2%} threshold. No action required.",
                )

        finally:
            db.close()

    def _get_peak_value(self, db, current_value: float) -> float:
        """Get the highest portfolio value ever recorded."""
        latest = (
            db.query(PortfolioSnapshot)
            .order_by(PortfolioSnapshot.timestamp.desc())
            .first()
        )
        if latest:
            return max(float(latest.peak_value), current_value)
        return current_value

    async def _fire_alert(self, db, positions, portfolio_value, peak_value, drawdown):
        """Create alert record + hand off to Hedge Executor."""
        if not positions:
            logger.warning("No positions — using simulation position AAPL")
            positions = [
                {
                    "symbol": "AAPL",
                    "current_price": 230.0,
                    "market_value": "2300.0",
                    "qty": "10",
                }
            ]

        biggest = max(positions, key=lambda p: float(p.get("market_value", 0) or 0))
        symbol = biggest.get("symbol", "UNKNOWN")
        price = float(biggest.get("current_price", 0) or 0)

        alert = Alert(
            stock_symbol=symbol,
            current_price=price,
            drawdown_pct=drawdown,
            status="fired",
        )
        db.add(alert)
        db.commit()
        db.refresh(alert)

        await websocket_manager.broadcast(
            {
                "type": "ALERT",
                "data": {
                    "symbol": symbol,
                    "drawdown": f"{drawdown:.2%}",
                    "portfolio_value": portfolio_value,
                    "peak_value": peak_value,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            }
        )
        logger.info(f"Alert broadcasted for {symbol}")

        from agents.executor import executor

        await executor.process_alert(alert.id, symbol, price, drawdown)
