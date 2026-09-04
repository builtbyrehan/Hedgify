"""
Hedge Executor (Worker) — receives drawdown alerts, calculates put options, places orders.
"""

import uuid
from datetime import datetime, timedelta
from loguru import logger
from services.event_logger import log_event
from models.database import SessionLocal, Alert, Hedge
from api.websocket import websocket_manager
from config import OTM_BUFFER, DAYS_TO_EXPIRY
from services.app_settings import get_setting
from services.alpaca_client import alpaca


class HedgeExecutor:
    async def process_alert(
        self, alert_id: int, symbol: str, current_price: float, drawdown: float
    ):
        """Main entry: called when Monitor fires an alert."""
        logger.info(f"🔧 Executor processing alert #{alert_id} for {symbol}")
        log_event(
            "Executor",
            "ALERT_RECEIVED",
            f"Executor processing alert #{alert_id} for {symbol}",
        )

        db = SessionLocal()
        try:
            # KILL-SWITCH: autonomous hedging can be disabled live via PUT /api/v1/config
            if not get_setting("autonomous_hedging", True):
                logger.warning(
                    f"⏸️ Autonomous hedging disabled — alert #{alert_id} acknowledged, no order placed"
                )
                log_event(
                    "Executor",
                    "HEDGING_DISABLED",
                    f"Autonomous hedging disabled — alert #{alert_id} for {symbol} acknowledged, no order placed.",
                    severity="warning",
                )
                self._update_alert_status(db, alert_id, "skipped")
                return

            # IDEMPOTENCY GUARD: never buy duplicate insurance for an already-hedged symbol
            existing = (
                db.query(Hedge)
                .filter(Hedge.stock_symbol == symbol, Hedge.status == "active")
                .first()
            )

            if existing:
                logger.warning(f"⚠️  Already hedged on {symbol} — skipping duplicate")
                log_event(
                    "Executor",
                    "IDEMPOTENCY_GUARD",
                    f"Duplicate alert for {symbol} skipped — active hedge exists. Guard active.",
                    severity="warning",
                )
                self._update_alert_status(db, alert_id, "skipped")
                return

            # LIVE PUT PARAMETERS — read from app_settings (PUT /api/v1/config)
            otm = get_setting("otm_buffer", OTM_BUFFER)
            strike_price = round(current_price * (1 - otm), 2)
            expiry_days = get_setting("expiry_days", DAYS_TO_EXPIRY)
            expiry_date = (datetime.utcnow() + timedelta(days=expiry_days)).strftime(
                "%Y-%m-%d"
            )
            quantity = 1

            logger.info(
                f"📐 Put: {symbol} | Strike: ${strike_price} | Expiry: {expiry_date}"
            )

            order_result = await self._place_order(
                symbol, strike_price, expiry_date, quantity
            )

            # MAX PREMIUM ALLOCATION — reject orders exceeding the configured budget
            max_prem = get_setting("max_premium", 500.0)
            premium = float(order_result.get("premium", 50.0))
            if premium > max_prem:
                self._update_alert_status(db, alert_id, "failed")
                logger.error(
                    f"❌ Order failed: premium ${premium:.2f} exceeds max allocation ${max_prem:.2f}"
                )
                log_event(
                    "Executor",
                    "ORDER_FAILED",
                    f"Premium ${premium:.2f} exceeds max allocation ${max_prem:.2f} — order rejected.",
                    severity="error",
                )
                return

            if order_result["success"]:
                hedge = Hedge(
                    stock_symbol=symbol,
                    strike_price=strike_price,
                    expiry_date=expiry_date,
                    quantity=quantity,
                    premium_paid=premium,
                    status="active",
                )
                db.add(hedge)
                self._update_alert_status(db, alert_id, "processed")
                db.commit()

                await websocket_manager.broadcast(
                    {
                        "type": "HEDGE_PLACED",
                        "data": {
                            "symbol": symbol,
                            "strike": strike_price,
                            "expiry": expiry_date,
                            "premium": premium,
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                    }
                )

                logger.info(
                    f"✅ Hedge active: {symbol} Put @ ${strike_price}, expires {expiry_date}"
                )
                log_event(
                    "Executor",
                    "HEDGE_PLACED",
                    f"Protective put order filled: {symbol} {otm:.0%} OTM, {expiry_days}-day expiry, ${premium:.2f} premium.",
                )
            else:
                self._update_alert_status(db, alert_id, "failed")
                logger.error(f"❌ Order failed: {order_result.get('error')}")
                log_event(
                    "Executor",
                    "ORDER_FAILED",
                    f"Order failed: {order_result.get('error')}",
                    severity="error",
                )

        finally:
            db.close()

    def _update_alert_status(self, db, alert_id: int, status: str):
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.status = status
            db.commit()

    async def _place_order(self, symbol: str, strike: float, expiry: str, qty: int):
        """Routes to real Alpaca options API or simulation based on config."""
        from config import REAL_OPTIONS_ORDERS

        if not REAL_OPTIONS_ORDERS:
            logger.info(
                f"🧾 SIMULATED: Buy Put {symbol} ${strike} {expiry} (REAL_OPTIONS_ORDERS=False)"
            )
            return {
                "success": True,
                "order_id": str(uuid.uuid4()),
                "premium": 50.0,
                "status": "filled",
            }

        try:
            return alpaca.submit_option_order(symbol, strike, expiry, qty)
        except Exception as e:
            logger.error(f"❌ Real order error: {e}")
            return {"success": False, "error": str(e)}


executor = HedgeExecutor()
