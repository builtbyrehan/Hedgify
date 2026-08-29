"""
Hedge Executor (Worker) — receives drawdown alerts, calculates put options, places orders.
"""

import uuid
from datetime import datetime, timedelta
from loguru import logger

from models.database import SessionLocal, Alert, Hedge
from api.websocket import websocket_manager
from config import OTM_BUFFER, DAYS_TO_EXPIRY


class HedgeExecutor:
    async def process_alert(self, alert_id: int, symbol: str, current_price: float, drawdown: float):
        """Main entry: called when Monitor fires an alert."""
        logger.info(f"🔧 Executor processing alert #{alert_id} for {symbol}")

        db = SessionLocal()
        try:
            existing = db.query(Hedge).filter(
                Hedge.stock_symbol == symbol,
                Hedge.status == "active"
            ).first()

            if existing:
                logger.warning(f"⚠️  Already hedged on {symbol} — skipping duplicate")
                self._update_alert_status(db, alert_id, "skipped")
                return

            strike_price = round(current_price * (1 - OTM_BUFFER), 2)
            expiry_date = (datetime.utcnow() + timedelta(days=DAYS_TO_EXPIRY)).strftime("%Y-%m-%d")
            quantity = 1

            logger.info(f"📐 Put: {symbol} | Strike: ${strike_price} | Expiry: {expiry_date}")

            order_result = await self._place_order(symbol, strike_price, expiry_date, quantity)

            if order_result["success"]:
                hedge = Hedge(
                    stock_symbol=symbol,
                    strike_price=strike_price,
                    expiry_date=expiry_date,
                    quantity=quantity,
                    premium_paid=order_result.get("premium", 50.0),
                    status="active"
                )
                db.add(hedge)
                self._update_alert_status(db, alert_id, "processed")
                db.commit()

                await websocket_manager.broadcast({
                    "type": "HEDGE_PLACED",
                    "data": {
                        "symbol": symbol,
                        "strike": strike_price,
                        "expiry": expiry_date,
                        "premium": order_result.get("premium", 50.0),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                })

                logger.info(f"✅ Hedge active: {symbol} Put @ ${strike_price}, expires {expiry_date}")
            else:
                self._update_alert_status(db, alert_id, "failed")
                logger.error(f"❌ Order failed: {order_result.get('error')}")

        finally:
            db.close()

    def _update_alert_status(self, db, alert_id: int, status: str):
        alert = db.query(Alert).filter(Alert.id == alert_id).first()
        if alert:
            alert.status = status
            db.commit()

    async def _place_order(self, symbol: str, strike: float, expiry: str, qty: int):
        """SIMULATION: Returns mock success. Replace with real Alpaca Options API later."""
        logger.info(f"🧾 SIMULATED: Buy Put {symbol} ${strike} {expiry}")
        return {
            "success": True,
            "order_id": str(uuid.uuid4()),
            "premium": 50.0,
            "status": "filled"
        }


executor = HedgeExecutor()