"""Tests for services/app_settings.py — runtime config CRUD."""
import pytest
from unittest.mock import patch
from services.app_settings import get_setting, get_all_settings, set_settings, SETTING_DEFS

import tests.conftest as _conftest
_TestSessionLocal = _conftest._TestSessionLocal


@pytest.fixture(autouse=True)
def _patch_app_settings_session():
    """Patch the SessionLocal used by app_settings to use our test DB."""
    with patch("services.app_settings.SessionLocal", _TestSessionLocal):
        yield


class TestGetSetting:
    def test_returns_default_for_unknown_key(self, db_session):
        result = get_setting("nonexistent_key", "fallback")
        assert result == "fallback"

    def test_returns_registry_default(self, db_session):
        result = get_setting("drawdown_threshold")
        assert result == 0.02

    def test_returns_registry_default_bool(self, db_session):
        result = get_setting("autonomous_hedging")
        assert result is True

    def test_returns_registry_default_int(self, db_session):
        result = get_setting("expiry_days")
        assert result == 14

    def test_reads_stored_value(self, db_session):
        set_settings({"drawdown_threshold": 0.05})
        result = get_setting("drawdown_threshold")
        assert result == 0.05


class TestGetAllSettings:
    def test_returns_all_keys(self, db_session):
        settings = get_all_settings()
        for key in SETTING_DEFS:
            assert key in settings

    def test_returns_correct_defaults(self, db_session):
        settings = get_all_settings()
        assert settings["autonomous_hedging"] is True
        assert settings["drawdown_threshold"] == 0.02
        assert settings["otm_buffer"] == 0.05
        assert settings["expiry_days"] == 14
        assert settings["max_premium"] == 500.0
        assert settings["poll_interval_seconds"] == 10


class TestSetSettings:
    def test_update_single_setting(self, db_session):
        result = set_settings({"drawdown_threshold": 0.05})
        assert result["drawdown_threshold"] == 0.05

    def test_update_multiple_settings(self, db_session):
        result = set_settings({
            "drawdown_threshold": 0.04,
            "otm_buffer": 0.10,
        })
        assert result["drawdown_threshold"] == 0.04
        assert result["otm_buffer"] == 0.10

    def test_update_bool_setting(self, db_session):
        result = set_settings({"autonomous_hedging": False})
        assert result["autonomous_hedging"] is False

    def test_update_int_setting(self, db_session):
        result = set_settings({"expiry_days": 30})
        assert result["expiry_days"] == 30

    def test_unknown_key_raises(self, db_session):
        with pytest.raises(ValueError, match="Unknown setting"):
            set_settings({"bad_key": "value"})

    def test_value_below_min_raises(self, db_session):
        with pytest.raises(ValueError, match="must be >="):
            set_settings({"drawdown_threshold": 0.0001})

    def test_value_above_max_raises(self, db_session):
        with pytest.raises(ValueError, match="must be <="):
            set_settings({"drawdown_threshold": 1.0})

    def test_invalid_type_raises(self, db_session):
        with pytest.raises(ValueError, match="must be"):
            set_settings({"expiry_days": "not_a_number"})


class TestCoerce:
    def test_coerce_bool_true(self, db_session):
        from services.app_settings import _coerce
        assert _coerce("autonomous_hedging", "true") is True
        assert _coerce("autonomous_hedging", "1") is True
        assert _coerce("autonomous_hedging", "yes") is True

    def test_coerce_bool_false(self, db_session):
        from services.app_settings import _coerce
        assert _coerce("autonomous_hedging", "false") is False
        assert _coerce("autonomous_hedging", "0") is False

    def test_coerce_int(self, db_session):
        from services.app_settings import _coerce
        assert _coerce("expiry_days", "30") == 30
        assert _coerce("expiry_days", "14.5") == 14

    def test_coerce_float(self, db_session):
        from services.app_settings import _coerce
        assert _coerce("drawdown_threshold", "0.05") == 0.05
