"""One-shot: backfill real fill prices into hedge rows + sync Alpaca order status."""
import sqlite3

from services.alpaca_client import alpaca

ORDERS = {o["symbol"]: o for o in alpaca.client.get(
    "/v2/orders", params={"status": "all", "limit": 50}
).json()}

db = sqlite3.connect("portfolio_state.db")
rows = db.execute(
    "SELECT id, stock_symbol, expiry_date FROM hedges WHERE premium_paid = 0.0"
).fetchall()

for hid, symbol, expiry in rows:
    yymmdd = expiry.replace("-", "")[2:]
    match = next(
        (o for occ, o in ORDERS.items()
         if occ.startswith(symbol) and occ[-15:-9] == yymmdd and occ[-9] == "P"),
        None,
    )
    if match:
        fill = float(match.get("filled_avg_price") or 0)
        premium = fill * 100
        db.execute(
            "UPDATE hedges SET premium_paid = ?, status = ? WHERE id = ?",
            (premium, match.get("status", "active"), hid),
        )
        print(f"hedge #{hid} {symbol}: premium -> ${premium:.2f} (fill ${fill})")

db.commit()
db.close()