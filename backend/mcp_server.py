"""
MCP Proxy Server — translates natural-language hedge intent into Alpaca API calls.

Run: python mcp_server.py
Port: 8080

This server implements the MCP tool contract for Hedgify:
  - buy_protective_put: Purchase a protective put option via Alpaca

It acts as a proxy between the Hedge Executor and Alpaca's REST API,
translating structured tool calls into precise brokerage API requests.
"""

import asyncio
import os
import sys
from datetime import datetime, timezone
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from loguru import logger
from pydantic import BaseModel, Field

# ── Load Environment ──────────────────────────────────────────────────

load_dotenv()

ALPACA_API_KEY = os.getenv("ALPACA_API_KEY")
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET_KEY")
ALPACA_BASE_URL = "https://paper-api.alpaca.markets"
ALPACA_DATA_URL = "https://data.alpaca.markets"

if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
    print("FATAL: ALPACA_API_KEY and ALPACA_SECRET_KEY required", file=sys.stderr)
    sys.exit(1)


# ── App ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Hedgify MCP Server",
    description="MCP proxy for protective put orders",
    version="1.0.0",
)

headers = {
    "APCA-API-KEY-ID": ALPACA_API_KEY,
    "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
}

trading_client = httpx.AsyncClient(base_url=ALPACA_BASE_URL, headers=headers)
data_client = httpx.AsyncClient(base_url=ALPACA_DATA_URL, headers=headers)


# ── Request/Response Models ───────────────────────────────────────────


class BuyProtectivePutParams(BaseModel):
    symbol: str = Field(..., description="Underlying stock symbol (e.g., AAPL)")
    strike_price: float = Field(..., description="Strike price for the put option")
    expiration_date: str = Field(..., description="Expiration date (YYYY-MM-DD)")
    quantity: int = Field(..., description="Number of contracts (1 = 100 shares)")


class MCPToolCall(BaseModel):
    tool: str = Field(..., description="MCP tool name")
    parameters: dict = Field(..., description="Tool parameters")


class MCPResponse(BaseModel):
    order_id: str
    status: str  # "filled" | "pending" | "rejected"
    filled_price: Optional[float] = None
    timestamp: str


class MCPError(BaseModel):
    error: str
    code: str = "TOOL_ERROR"


# ── Options Chain Lookup ──────────────────────────────────────────────


async def find_put_contract(
    symbol: str, target_strike: float, expiry: str
) -> Optional[dict]:
    """Find the closest listed put contract to our target strike."""
    yymmdd = expiry.replace("-", "")[2:]
    snapshots = {}
    page_token = None

    for _ in range(10):
        params = {"type": "put", "expiration_date": expiry, "limit": 500}
        if page_token:
            params["page_token"] = page_token

        resp = await data_client.get(
            f"/v1beta1/options/snapshots/{symbol}", params=params
        )
        if resp.status_code >= 400:
            logger.error(f"Chain API error: {resp.status_code}")
            return None

        data = resp.json()
        snapshots.update(data.get("snapshots", {}))

        have = any(
            len(occ) > 15 and occ[-9] == "P" and occ[-15:-9] == yymmdd
            for occ in snapshots
        )
        if have:
            break
        page_token = data.get("next_page_token")
        if not page_token:
            break

    filtered = {
        occ: snap
        for occ, snap in snapshots.items()
        if len(occ) > 15 and occ[-9] == "P" and occ[-15:-9] == yymmdd
    }

    if not filtered:
        return None

    best, best_diff, best_ask = None, float("inf"), 0.0
    for occ, snap in filtered.items():
        s = float(snap.get("strike_price") or int(occ[-8:]) / 1000)
        diff = abs(s - target_strike)
        if diff < best_diff:
            best, best_diff = occ, diff
            best_ask = float(
                snap.get("latest_quote", {}).get("ask_price", 0) or 0
            )

    return {"symbol": best, "ask": best_ask}


# ── Order Placement ───────────────────────────────────────────────────


async def place_order(
    contract_symbol: str, qty: int
) -> dict:
    """Place a market order for the put option."""
    payload = {
        "symbol": contract_symbol,
        "qty": str(qty),
        "side": "buy",
        "type": "market",
        "time_in_force": "day",
        "position_intent": "buy_to_open",
    }

    resp = await trading_client.post("/v2/orders", json=payload)
    if resp.status_code >= 400:
        return {"error": f"Alpaca {resp.status_code}: {resp.text[:200]}"}

    data = resp.json()
    order_id = data.get("id", "")
    status = data.get("status", "accepted")
    filled_price = float(data.get("filled_avg_price") or 0)

    # Poll for fill (market orders fill async)
    for _ in range(4):
        if filled_price > 0:
            break
        await asyncio.sleep(2)
        try:
            check = await trading_client.get(f"/v2/orders/{order_id}")
            if check.status_code < 400:
                od = check.json()
                filled_price = float(od.get("filled_avg_price") or 0)
                status = od.get("status", status)
        except Exception:
            pass

    return {
        "order_id": order_id,
        "status": status,
        "filled_price": filled_price,
    }


# ── MCP Tool Handlers ─────────────────────────────────────────────────


async def handle_buy_protective_put(params: dict) -> dict:
    """Handle buy_protective_put tool call."""
    symbol = params.get("symbol")
    strike_price = params.get("strike_price")
    expiration_date = params.get("expiration_date")
    quantity = params.get("quantity", 1)

    logger.info(
        f"MCP tool: buy_protective_put({symbol}, ${strike_price}, "
        f"{expiration_date}, {quantity})"
    )

    # Validate strike/expiry exists in chain
    contract = await find_put_contract(symbol, strike_price, expiration_date)
    if not contract:
        return {
            "error": f"No listed put for {symbol} @ ${strike_price} exp {expiration_date}",
            "code": "CONTRACT_NOT_FOUND",
        }

    # Use the actual listed strike (may differ from target)
    actual_strike = float(
        contract["symbol"][-13:-5]  # parse from OCC symbol
    ) / 1000 if len(contract["symbol"]) >= 21 else strike_price

    logger.info(
        f"Chain match: {contract['symbol']} (target ${strike_price}, "
        f"actual ${actual_strike}, ask ${contract['ask']})"
    )

    # Place order
    result = await place_order(contract["symbol"], quantity)

    if "error" in result:
        return result

    premium = (result["filled_price"] or contract["ask"]) * 100

    return {
        "order_id": result["order_id"],
        "status": result["status"],
        "filled_price": result["filled_price"],
        "premium": premium,
        "contract_symbol": contract["symbol"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ── MCP Endpoints ─────────────────────────────────────────────────────


@app.post("/mcp/call")
async def mcp_call(request: MCPToolCall):
    """MCP tool call endpoint — routes to appropriate handler."""
    try:
        if request.tool == "buy_protective_put":
            result = await handle_buy_protective_put(request.parameters)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown tool: {request.tool}")

        if "error" in result:
            return MCPError(
                error=result["error"],
                code=result.get("code", "TOOL_ERROR"),
            )

        return MCPResponse(
            order_id=result.get("order_id", ""),
            status=result.get("status", "rejected"),
            filled_price=result.get("filled_price"),
            timestamp=result.get("timestamp", datetime.now(timezone.utc).isoformat()),
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MCP error: {e}")
        return MCPError(error=str(e), code="INTERNAL_ERROR")


@app.get("/mcp/tools")
async def list_tools():
    """List available MCP tools."""
    return {
        "tools": [
            {
                "name": "buy_protective_put",
                "description": "Purchase a protective put option via Alpaca",
                "parameters": {
                    "symbol": {"type": "string", "description": "Underlying stock symbol"},
                    "strike_price": {"type": "number", "description": "Strike price"},
                    "expiration_date": {"type": "string", "description": "Expiration date (YYYY-MM-DD)"},
                    "quantity": {"type": "integer", "description": "Number of contracts"},
                },
            }
        ]
    }


@app.get("/health")
async def health():
    """Health check."""
    return {"status": "ok", "service": "hedgify-mcp-server"}


# ── Shutdown ──────────────────────────────────────────────────────────


@app.on_event("shutdown")
async def shutdown():
    await trading_client.aclose()
    await data_client.aclose()


# ── Main ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Hedgify MCP Server on port 8080")
    uvicorn.run(app, host="0.0.0.0", port=8080)
