"""
App Settings — live runtime configuration stored in SQLite.
Agents read these each loop, so PUT /api/v1/config takes effect immediately.
"""

from datetime import datetime, timezone

from models.database import SessionLocal, AppSetting
import logging

logger = logging.getLogger(__name__)

# Registry: key -> type, default, allowed range
SETTING_DEFS = {
    "autonomous_hedging": {"type": bool, "default": True, "min": None, "max": None},
    "drawdown_threshold": {"type": float, "default": 0.02, "min": 0.001, "max": 0.50},
    "otm_buffer": {"type": float, "default": 0.05, "min": 0.01, "max": 0.25},
    "expiry_days": {"type": int, "default": 14, "min": 1, "max": 90},
    "max_premium": {"type": float, "default": 500.0, "min": 10.0, "max": 10000.0},
    "poll_interval_seconds": {"type": int, "default": 10, "min": 5, "max": 3600},
    "real_options_orders": {"type": bool, "default": True, "min": None, "max": None},
}


def get_setting(key: str, default=None):
    """Read one setting (typed). Precedence: DB row -> registry default -> passed default."""
    try:
        db = SessionLocal()
        try:
            row = db.query(AppSetting).filter(AppSetting.key == key).first()
            if row is not None:
                return _coerce(key, row.value)
        finally:
            db.close()
    except Exception as e:
        logger.warning(f"Failed to read setting '{key}': {e}")
    if key in SETTING_DEFS:
        return SETTING_DEFS[key]["default"]
    return default


def get_all_settings() -> dict:
    return {key: get_setting(key) for key in SETTING_DEFS}


def set_settings(updates: dict) -> dict:
    """Validate + persist a partial update. Raises ValueError on bad key/value."""
    for key, value in updates.items():
        if key not in SETTING_DEFS:
            raise ValueError(f"Unknown setting: {key}")
        _validate(key, value)

    db = SessionLocal()
    try:
        for key, value in updates.items():
            stored = str(value).lower() if isinstance(value, bool) else str(value)
            row = db.query(AppSetting).filter(AppSetting.key == key).first()
            if row:
                row.value = stored
                row.updated_at = datetime.now(timezone.utc)
            else:
                db.add(AppSetting(key=key, value=stored))
        db.commit()
    finally:
        db.close()
    return get_all_settings()


def _coerce(key, raw):
    t = SETTING_DEFS[key]["type"]
    if t is bool:
        return str(raw).lower() in ("true", "1", "yes")
    if t is int:
        return int(float(raw))
    return float(raw)


def _validate(key, value):
    t = SETTING_DEFS[key]["type"]
    lo, hi = SETTING_DEFS[key]["min"], SETTING_DEFS[key]["max"]
    try:
        v = _coerce(key, value)
    except (TypeError, ValueError):
        raise ValueError(f"{key} must be {t.__name__}")
    if lo is not None and v < lo:
        raise ValueError(f"{key} must be >= {lo}")
    if hi is not None and v > hi:
        raise ValueError(f"{key} must be <= {hi}")
