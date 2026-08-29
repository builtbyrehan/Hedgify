"""
Hedgify Configuration — Single source of truth for all constants.
"""

import os
from dotenv import load_dotenv

load_dotenv()

# Alpaca Paper Trading Credentials
ALPACA_API_KEY = os.getenv("ALPACA_API_KEY")
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET_KEY")
ALPACA_BASE_URL = "https://paper-api.alpaca.markets" # it's the address where the code will send requests to the Alpaca API
ALPACA_DATA_URL = "https://data.alpaca.markets" # it's the address where the code will fetch market data from the Alpaca API


# Hedging Strategy Parameters
DRAWDOWN_THRESHOLD = 0.02          # 2% trigger
OTM_BUFFER = 0.05                  # 5% OTM
DAYS_TO_EXPIRY = 14                # Put option expiry
POLL_INTERVAL_SECONDS = 10        # 15 minutes
MAX_RETRIES = 3                    # API retry count
RETRY_DELAY_SECONDS = 30           # Retry backoff

# Database
DATABASE_URL = "sqlite:///./portfolio_state.db"

# Logging
LOG_LEVEL = "INFO"