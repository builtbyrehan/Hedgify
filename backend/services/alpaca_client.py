"""
Alpaca HTTP client — direct REST API via httpx.
"""

import httpx
from config import ALPACA_API_KEY, ALPACA_SECRET_KEY, ALPACA_BASE_URL


class AlpacaClient:
    def __init__(self):
        self.client = httpx.Client(
            base_url=ALPACA_BASE_URL,
            headers={
                "APCA-API-KEY-ID": ALPACA_API_KEY,
                "APCA-API-SECRET-KEY": ALPACA_SECRET_KEY,
            }
        )

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


# Singleton instance
alpaca = AlpacaClient()