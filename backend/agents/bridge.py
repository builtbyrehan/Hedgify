"""
MCP Bridge — translates hedge intent into Alpaca orders.

Primary path: Alpaca MCP Server (natural language intent).
Fallback path: Direct Alpaca SDK (graceful degradation).
Hallucination guard: validates strike/expiry against real options chain.
"""

import asyncio
from datetime import datetime, timezone
from enum import Enum
from typing import Optional

import httpx
from loguru import logger
from pydantic import BaseModel, Field

from config import (
    ALPACA_API_KEY,
    ALPACA_SECRET_KEY,
    ALPACA_BASE_URL,
    MAX_RETRIES,
    RETRY_DELAY_SECONDS,
)
from services.event_logger import log_event


# ── Result Model ──────────────────────────────────────────────────────


class OrderStatus(str, Enum):
    FILLED = "filled"
    PENDING = "pending"
    REJECTED = "rejected"
    ERROR = "error"


class HedgeOrderResult(BaseModel):
    """Typed result from MCP bridge — executor.py persists this to SQLite."""

    success: bool
    order_id: Optional[str] = None
    status: OrderStatus = OrderStatus.REJECTED
    filled_price: Optional[float] = None
    premium: Optional[float] = None
    error: Optional[str] = None
    path_used: Optional[str] = None  # "mcp" | "direct_fallback" | "simulated"
    symbol: str = ""
    strike_price: float = 0.0
    expiry_date: str = ""
    quantity: int = 0


# ── OCC Symbol Builder ────────────────────────────────────────────────


def build_option_symbol(
    underlying: str, expiry: str, strike: float, option_type: str = "P"
) -> str:
    """
    Build an OCC-style option symbol from components.

    OCC format: AAPL260918P00190000
      - 6 chars: underlying (padded with spaces if < 6)
      - 6 chars: YYMMDD expiry
      - 1 char:  C (call) or P (put)
      - 8 chars: strike price * 1000, zero-padded
    """
    yymmdd = expiry.replace("-", "")[2:]  # "2026-09-18" -> "260918"
    strike_int = int(round(strike * 1000))
    strike_str = f"{strike_int:08d}"
    return f"{underlying:<6s}{yymmdd}{option_type}{strike_str}"


# ── MCP Client ────────────────────────────────────────────────────────


class MCPClient:
    """
    Client for Alpaca MCP Server.

    Translates structured hedge intent into natural-language MCP tool calls.
    Falls back gracefully if MCP Server is unavailable.
    """

    def __init__(self):
        self.base_url = "http://localhost:8080"  # MCP Server address
        self.client = httpx.AsyncClient(base_url=self.base_url, timeout=30.0)

    async def close(self):
        await self.client.aclose()

    async def buy_protective_put(
        self,
        symbol: str,
        strike_price: float,
        expiration_date: str,
        quantity: int,
        event_key: str = "",
    ) -> HedgeOrderResult:
        """
        Call MCP Server tool: buy_protective_put.

        Translates structured params into the MCP tool contract.
        """
        intent = (
            f"Buy protective put for {symbol}, "
            f"strike ${strike_price:.2f}, "
            f"expiry {expiration_date}, "
            f"quantity {quantity} contract(s)"
        )

        logger.info(f"MCP call: {intent}")
        log_event(
            "Bridge",
            "MCP_CALL",
            f"Intent: {intent}" + (f" [event={event_key}]" if event_key else ""),
        )

        payload = {
            "tool": "buy_protective_put",
            "parameters": {
                "symbol": symbol,
                "strike_price": strike_price,
                "expiration_date": expiration_date,
                "quantity": quantity,
            },
        }

        resp = await self.client.post("/mcp/call", json=payload)
        resp.raise_for_status()
        data = resp.json()

        return HedgeOrderResult(
            success=data.get("status") == "filled",
            order_id=data.get("order_id"),
            status=OrderStatus(data.get("status", "rejected")),
            filled_price=data.get("filled_price"),
            premium=data.get("filled_price", 0) * 100 if data.get("filled_price") else None,
            path_used="mcp",
            symbol=symbol,
            strike_price=strike_price,
            expiry_date=expiration_date,
            quantity=quantity,
        )


# ── Hallucination Guard ───────────────────────────────────────────────


async def validate_strike_expiry(
    symbol: str, target_strike: float, expiry: str
) -> Optional[str]:
    """
    Validate that the calculated strike/expiry exists in Alpaca's options chain.

    Returns the matching OCC symbol if found, None if not.
    This prevents the system from placing orders for non-existent contracts.
    """
    from services.alpaca_client import alpaca

    contract = await alpaca._find_put_contract(symbol, target_strike, expiry)
    if contract:
        return contract.get("symbol")
    return None


# ── Direct Alpaca Fallback ────────────────────────────────────────────


async def direct_alpaca_order(
    symbol: str,
    strike_price: float,
    expiry_date: str,
    quantity: int,
    event_key: str = "",
) -> HedgeOrderResult:
    """
    Fallback path: direct Alpaca SDK call when MCP Server is unavailable.

    Uses the same economic terms as the MCP path.
    """
    from services.alpaca_client import alpaca

    logger.warning(f"Direct Alpaca fallback: {symbol} Put @ ${strike_price}, expiry {expiry_date}")
    log_event(
        "Bridge",
        "FALLBACK_DIRECT",
        f"MCP unavailable — falling back to direct Alpaca API for {symbol}",
        severity="warning",
    )

    result = await alpaca.submit_option_order(symbol, strike_price, expiry_date, quantity)

    if result.get("success"):
        return HedgeOrderResult(
            success=True,
            order_id=result.get("order_id"),
            status=OrderStatus.FILLED,
            filled_price=result.get("filled_price"),
            premium=result.get("premium"),
            path_used="direct_fallback",
            symbol=symbol,
            strike_price=strike_price,
            expiry_date=expiry_date,
            quantity=quantity,
        )
    else:
        return HedgeOrderResult(
            success=False,
            status=OrderStatus.ERROR,
            error=result.get("error", "Unknown error"),
            path_used="direct_fallback",
            symbol=symbol,
            strike_price=strike_price,
            expiry_date=expiry_date,
            quantity=quantity,
        )


# ── Main Entry Point ──────────────────────────────────────────────────


async def buy_protective_put(
    symbol: str,
    strike_price: float,
    expiry_date: str,
    quantity: int,
    event_key: str = "",
) -> HedgeOrderResult:
    """
    MCP Bridge entry point — buys a protective put option.

    Strategy:
    1. Validate strike/expiry against real options chain (hallucination guard)
    2. Try MCP Server (primary path)
    3. Fall back to direct Alpaca API if MCP unavailable
    4. Retry on transient failures (up to MAX_RETRIES)

    Args:
        symbol: Underlying stock symbol (e.g., AAPL)
        strike_price: Target strike price
        expiry_date: Expiration date (YYYY-MM-DD)
        quantity: Number of contracts (1 = 100 shares)
        event_key: Idempotency key for logging

    Returns:
        HedgeOrderResult with order details or error
    """
    # ── Step 1: Hallucination Guard ───────────────────────────────
    logger.info(f"Validating options chain for {symbol} Put @ ${strike_price}, expiry {expiry_date}")
    actual_symbol = await validate_strike_expiry(symbol, strike_price, expiry_date)

    if not actual_symbol:
        reason = (
            f"No listed put contract for {symbol} @ strike ${strike_price:.2f}, "
            f"expiry {expiry_date} — order rejected (hallucination guard)"
        )
        logger.error(reason)
        log_event(
            "Bridge",
            "HALLUCINATION_GUARD",
            reason,
            severity="error",
        )
        return HedgeOrderResult(
            success=False,
            status=OrderStatus.REJECTED,
            error=reason,
            path_used="rejected",
            symbol=symbol,
            strike_price=strike_price,
            expiry_date=expiry_date,
            quantity=quantity,
        )

    logger.info(f"Hallucination guard passed: {symbol} -> {actual_symbol}")

    # ── Step 2-3: MCP Primary + Direct Fallback with Retry ───────
    last_error = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            # Try MCP Server first
            mcp_client = MCPClient()
            try:
                result = await mcp_client.buy_protective_put(
                    symbol, strike_price, expiry_date, quantity, event_key
                )
                if result.success:
                    logger.info(
                        f"MCP order filled: {actual_symbol} | "
                        f"order_id={result.order_id[:8] if result.order_id else 'N/A'} | "
                        f"premium=${result.premium:,.2f}"
                    )
                    return result
                else:
                    last_error = result.error
                    logger.warning(f"MCP order failed (attempt {attempt}): {result.error}")
            finally:
                await mcp_client.close()

        except (httpx.ConnectError, httpx.TimeoutException, httpx.HTTPStatusError) as e:
            last_error = str(e)
            logger.warning(f"MCP connection failed (attempt {attempt}/{MAX_RETRIES}): {e}")
            log_event(
                "Bridge",
                "MCP_RETRY",
                f"MCP attempt {attempt}/{MAX_RETRIES} failed: {e}",
                severity="warning",
            )
        except Exception as e:
            last_error = str(e)
            logger.error(f"Unexpected MCP error (attempt {attempt}): {e}")
            log_event(
                "Bridge",
                "MCP_ERROR",
                f"Unexpected error on attempt {attempt}: {e}",
                severity="error",
            )

        # If MCP failed, try direct Alpaca fallback
        if attempt == 1:
            logger.info("Attempting direct Alpaca fallback...")
            try:
                result = await direct_alpaca_order(
                    symbol, strike_price, expiry_date, quantity, event_key
                )
                if result.success:
                    return result
                last_error = result.error
            except Exception as e:
                last_error = str(e)
                logger.error(f"Direct fallback also failed: {e}")

        # Wait before retry (except on last attempt)
        if attempt < MAX_RETRIES:
            logger.info(f"Retrying in {RETRY_DELAY_SECONDS}s...")
            await asyncio.sleep(RETRY_DELAY_SECONDS)

    # All retries exhausted
    final_error = f"Order failed after {MAX_RETRIES} attempts: {last_error}"
    logger.error(final_error)
    log_event(
        "Bridge",
        "ORDER_FAILED",
        f"All {MAX_RETRIES} attempts failed for {symbol}: {last_error}",
        severity="error",
    )
    return HedgeOrderResult(
        success=False,
        status=OrderStatus.ERROR,
        error=final_error,
        path_used="exhausted",
        symbol=symbol,
        strike_price=strike_price,
        expiry_date=expiry_date,
        quantity=quantity,
    )


# ── Simulated Order (for testing) ─────────────────────────────────────


def simulated_order(
    symbol: str,
    strike_price: float,
    expiry_date: str,
    quantity: int,
) -> HedgeOrderResult:
    """Generate a simulated order result for testing without Alpaca."""
    import uuid

    logger.info(
        f"SIMULATED: Buy Put {symbol} ${strike_price} {expiry_date} "
        f"(real_options_orders=False)"
    )
    return HedgeOrderResult(
        success=True,
        order_id=str(uuid.uuid4()),
        status=OrderStatus.FILLED,
        filled_price=strike_price * 0.02,  # ~2% of strike as premium
        premium=strike_price * 0.02 * 100,  # 1 contract = 100 shares
        path_used="simulated",
        symbol=symbol,
        strike_price=strike_price,
        expiry_date=expiry_date,
        quantity=quantity,
    )
