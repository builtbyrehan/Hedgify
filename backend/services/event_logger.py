"""
Event Logger — appends structured telemetry to the event_logs table.
Powers GET /api/v1/logs. Never raises — logging must not break agents.
"""

from datetime import datetime

from loguru import logger as loguru_logger

from models.database import SessionLocal, EventLog


def log_event(agent: str, event_type: str, message: str, severity: str = "info") -> None:
    """Persist a structured event + mirror to console. Swallows DB errors."""
    try:
        db = SessionLocal()
        try:
            db.add(EventLog(
                agent=agent,
                event_type=event_type,
                message=message,
                severity=severity,
                timestamp=datetime.utcnow(),
            ))
            db.commit()
        finally:
            db.close()
        mirror = {"info": loguru_logger.info, "warning": loguru_logger.warning}.get(severity, loguru_logger.error)
        mirror(f"[{agent}] {event_type} — {message}")
    except Exception as exc:
        loguru_logger.error(f"EventLog write failed: {exc}")