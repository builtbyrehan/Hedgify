"""
Stress Test Service — synthetic crash simulation.

Compares hedged vs unhedged outcomes for a position hit by a sudden drop.
Uses the same put math as the Hedge Executor (5% OTM strike, flat premium).
"""

from loguru import logger
from services.alpaca_client import alpaca
from config import OTM_BUFFER, PUT_PREMIUM

# Fallback prices for symbols not currently held (demo mode)
DEMO_PRICES = {
    "AAPL": 230.0, "MSFT": 420.0, "GOOGL": 180.0,
    "NVDA": 130.0, "TSLA": 250.0, "AMZN": 185.0, "META": 520.0,
}


async def run_stress_test(symbol: str, drop_pct: float) -> dict:
    """Simulate a crash of drop_pct (fraction, 0.15 = -15%) on symbol."""
    price, shares, has_position = await _find_position(symbol)

    # Simulate the shock
    new_price = round(price * (1 - drop_pct), 2)

    # Unhedged outcome: full loss
    unhedged_loss = round((price - new_price) * shares, 2)

    # Protective put — identical math to executor.py
    strike = round(price * (1 - OTM_BUFFER), 2)
    intrinsic = max(0.0, strike - new_price)
    put_payout = round(intrinsic * shares, 2)
    premium = PUT_PREMIUM

    # Hedged outcome: loss capped by put, minus premium paid
    hedged_loss = round(unhedged_loss + premium - put_payout, 2)
    money_saved = round(max(0.0, put_payout - premium), 2)
    cpr = round(money_saved / unhedged_loss, 4) if unhedged_loss > 0 else 0.0

    logger.info(
        f"Stress test: {symbol} -{drop_pct:.0%} | "
        f"unhedged ${unhedged_loss:,.2f} -> hedged ${hedged_loss:,.2f} | "
        f"saved ${money_saved:,.2f} | CPR {cpr:.1%}"
    )

    return {
        "symbol": symbol,
        "has_position": has_position,
        "shares": shares,
        "current_price": price,
        "new_price": new_price,
        "strike": strike,
        "drop_pct": drop_pct,
        "unhedged_loss": unhedged_loss,
        "hedged_loss": hedged_loss,
        "put_payout": put_payout,
        "premium": premium,
        "money_saved": money_saved,
        "cpr": cpr,
    }


async def _find_position(symbol: str):
    """Return (price, shares, has_position). Real data if held, demo defaults otherwise."""
    try:
        positions = await alpaca.get_positions()
        for pos in positions:
            if pos.get("symbol") == symbol:
                price = float(pos.get("current_price", 0) or 0)
                qty = int(float(pos.get("qty", 0) or 0))
                if price > 0 and qty > 0:
                    return price, qty, True
    except Exception as e:
        logger.warning(f"Position lookup failed for {symbol}: {e}")

    return DEMO_PRICES.get(symbol.upper(), 100.0), 100, False