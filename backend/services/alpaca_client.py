"""
Alpaca HTTP client — direct REST API via httpx.
Trading API: paper-api.alpaca.markets | Options data API: data-api.alpaca.markets
"""

import time

import httpx
from loguru import logger
from config import ALPACA_API_KEY, ALPACA_SECRET_KEY, ALPACA_BASE_URL

ALPACA_DATA_URL = "https://data.alpaca.markets"


class AlpacaClient:
    def __init__(self):
        headers = {
            "APCA-API-KEY-ID": ALPACA_API_KEY,
            "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
        }
        self.client = httpx.Client(base_url=ALPACA_BASE_URL, headers=headers)
        self.data_client = httpx.Client(base_url=ALPACA_DATA_URL, headers=headers)
        self.last_chain_error = None

    def get_account(self):
        """Fetch paper account details."""
        resp = self.client.get("/v2/account")
        resp.raise_for_status()
        return resp.json()

    def get_positions(self):
        """Fetch current stock holdings."""
        resp = self.client.get("/v2/positions")
        resp.raise_for_status()
        return resp.json()

    def get_latest_price(self, symbol: str):
        """Fetch real-time stock quote."""
        resp = self.client.get(f"/v2/assets/{symbol}")
        resp.raise_for_status()
        return resp.json()

    def _find_put_contract(self, symbol: str, target_strike: float, expiry: str):
        """Find the REAL listed put contract closest to our target strike (options data API)."""
        try:
            yymmdd = expiry.replace("-", "")[2:]
            snapshots = {}
            page_token = None
            for _page in range(10):  # safety cap: 10 pages x 500 = 5000 contracts
                params = {"type": "put", "expiration_date": expiry, "limit": 500}
                if page_token:
                    params["page_token"] = page_token
                resp = self.data_client.get(
                    f"/v1beta1/options/snapshots/{symbol}", params=params
                )
                if resp.status_code >= 400:
                    self.last_chain_error = (
                        f"chain API {resp.status_code}: {resp.text[:200]}"
                    )
                    logger.error(
                        f"Chain API error for {symbol}: {self.last_chain_error}"
                    )
                    return None

                data = resp.json()
                snapshots.update(data.get("snapshots", {}))

                # early stop once our expiry shows up among the OCC keys
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
            logger.info(
                f"Chain lookup {symbol}: scanned {len(snapshots)} rows, "
                f"{len(filtered)} puts expiring {expiry}"
            )
            if not filtered:
                self.last_chain_error = (
                    f"0 put contracts for {symbol} {expiry} "
                    f"after scanning {len(snapshots)} rows"
                )
                return None

            best, best_diff, best_ask = None, float("inf"), 0.0
            for occ, snap in filtered.items():
                # strike parsed from OCC symbol itself — always present, no trust needed
                s = float(snap.get("strike_price") or int(occ[-8:]) / 1000)
                diff = abs(s - target_strike)
                if diff < best_diff:
                    best, best_diff = occ, diff
                    best_ask = float(
                        snap.get("latest_quote", {}).get("ask_price", 0) or 0
                    )

            self.last_chain_error = None
            logger.info(
                f"🔎 Chain match for {symbol}: {best} "
                f"(target ${target_strike}, ask ${best_ask})"
            )
            return {"symbol": best, "ask": best_ask}

        except Exception as e:
            self.last_chain_error = str(e)
            logger.warning(f"Chain lookup failed for {symbol}: {e}")
            return None

    def submit_option_order(
        self, symbol: str, strike: float, expiry: str, qty: int = 1
    ):
        """Submit a protective PUT order — uses the REAL listed contract closest to target strike."""
        contract = self._find_put_contract(symbol, strike, expiry)
        if not contract:
            reason = self.last_chain_error or "unknown reason"
            return {
                "success": False,
                "error": f"No usable puts for {symbol} {expiry} — {reason}",
            }

        payload = {
            "symbol": contract["symbol"],
            "qty": str(qty),
            "side": "buy",
            "type": "market",
            "time_in_force": "day",
            "position_intent": "buy_to_open",
        }
        resp = self.client.post("/v2/orders", json=payload)
        if resp.status_code >= 400:
            detail = resp.text[:300]
            logger.error(
                f"❌ Alpaca rejected {contract['symbol']}: {resp.status_code} {detail}"
            )
            return {"success": False, "error": f"Alpaca {resp.status_code}: {detail}"}

        data = resp.json()
        order_id = data.get("id", "")
        status = data.get("status", "accepted")

        # Market orders fill asynchronously — poll briefly for the real fill price
        filled_price = float(data.get("filled_avg_price") or 0)
        for _ in range(4):
            if filled_price > 0:
                break
            time.sleep(2)
            try:
                check = self.client.get(f"/v2/orders/{order_id}")
                if check.status_code < 400:
                    od = check.json()
                    filled_price = float(od.get("filled_avg_price") or 0)
                    status = od.get("status", status)
            except Exception:
                pass

        premium = (filled_price or contract["ask"]) * 100  # 1 contract = 100 shares
        logger.info(
            f"🧾 REAL ORDER: {contract['symbol']} | id={order_id[:8]} status={status} | "
            f"fill=${filled_price} | premium=${premium:,.2f}"
        )
        return {
            "success": True,
            "order_id": order_id,
            "premium": premium,
            "status": status,
        }


# Singleton instance
alpaca = AlpacaClient()