"""Tests for config.py — environment variable loading and constants."""
import os
import sys
import pytest
from unittest.mock import patch


class TestConfigConstants:
    def test_draWDOWN_THRESHOLD_value(self):
        from config import DRAWDOWN_THRESHOLD
        assert DRAWDOWN_THRESHOLD == 0.02

    def test_otm_buffer_value(self):
        from config import OTM_BUFFER
        assert OTM_BUFFER == 0.05

    def test_days_to_expiry_value(self):
        from config import DAYS_TO_EXPIRY
        assert DAYS_TO_EXPIRY == 14

    def test_poll_interval_value(self):
        from config import POLL_INTERVAL_SECONDS
        assert POLL_INTERVAL_SECONDS == 10

    def test_max_retries_value(self):
        from config import MAX_RETRIES
        assert MAX_RETRIES == 3

    def test_retry_delay_value(self):
        from config import RETRY_DELAY_SECONDS
        assert RETRY_DELAY_SECONDS == 30

    def test_database_url_default(self):
        from config import DATABASE_URL
        assert "sqlite" in DATABASE_URL

    def test_log_level(self):
        from config import LOG_LEVEL
        assert LOG_LEVEL == "INFO"

    def test_put_premium(self):
        from config import PUT_PREMIUM
        assert PUT_PREMIUM == 50.0

    def test_alpaca_base_url(self):
        from config import ALPACA_BASE_URL
        assert ALPACA_BASE_URL == "https://paper-api.alpaca.markets"


class TestConfigEnvVars:
    def test_api_key_loaded(self):
        from config import ALPACA_API_KEY
        assert ALPACA_API_KEY is not None

    def test_secret_key_loaded(self):
        from config import ALPACA_SECRET_KEY
        assert ALPACA_SECRET_KEY is not None

    def test_hedgify_api_key_loaded(self):
        from config import HEDGIFY_API_KEY
        assert HEDGIFY_API_KEY is not None
