"""
Hedgify Configuration — Single source of truth for all constants.
"""

import os
import sys
from dotenv import load_dotenv

load_dotenv()

# Alpaca Paper Trading Credentials — fail fast if missing
ALPACA_API_KEY = os.getenv("ALPACA_API_KEY")
ALPACA_SECRET_KEY = os.getenv("ALPACA_SECRET_KEY")

if not ALPACA_API_KEY or not ALPACA_SECRET_KEY:
    print("FATAL: ALPACA_API_KEY and ALPACA_SECRET_KEY environment variables are required.", file=sys.stderr)
    sys.exit(1)

ALPACA_BASE_URL = "https://paper-api.alpaca.markets"

# Hedgify API Key — fail fast if missing
HEDGIFY_API_KEY = os.getenv("HEDGIFY_API_KEY")
if not HEDGIFY_API_KEY:
    print("FATAL: HEDGIFY_API_KEY environment variable is required for API authentication.", file=sys.stderr)
    sys.exit(1)

# Hedging Strategy Parameters
DRAWDOWN_THRESHOLD = 0.02          # 2% trigger
OTM_BUFFER = 0.05                  # 5% OTM
DAYS_TO_EXPIRY = 14                # Put option expiry
POLL_INTERVAL_SECONDS = 10   # DEMO interval; production default is 900 (15 min)
MAX_RETRIES = 3                    # API retry count
RETRY_DELAY_SECONDS = 30           # Retry backoff

# Database
DATABASE_URL = "sqlite:///./portfolio_state.db"

# Logging
LOG_LEVEL = "INFO"
PUT_PREMIUM = 50.0
REAL_OPTIONS_ORDERS = os.getenv("REAL_OPTIONS_ORDERS", "true").lower() in ("true", "1", "yes")