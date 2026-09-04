"""
FastAPI REST routes — portfolio data, alerts, stress test endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from pydantic import BaseModel
from services.stress_test import run_stress_test


from models.database import get_db, PortfolioSnapshot, Alert, Hedge, SessionLocal, EventLog
from api.websocket import websocket_manager
from services.alpaca_client import alpaca

router = APIRouter()


@router.get("/portfolio")
async def get_portfolio(db: Session = Depends(get_db)):
    """Get latest portfolio snapshot."""
    latest = db.query(PortfolioSnapshot).order_by(
        PortfolioSnapshot.timestamp.desc()
    ).first()
    if not latest:
        return {"portfolio_value": 124382, "peak_value": 127104, "drawdown": 0.0214}
    return {
        "portfolio_value": latest.portfolio_value,
        "peak_value": latest.peak_value,
        "drawdown": latest.drawdown_pct
    }


@router.get("/portfolio/history")
async def get_portfolio_history(limit: int = 30, db: Session = Depends(get_db)):
    """Get recent portfolio snapshots for chart."""
    snaps = db.query(PortfolioSnapshot).order_by(PortfolioSnapshot.timestamp.desc()).limit(limit).all()
    snaps = list(reversed(snaps))
    if not snaps:
        # seed demo history
        now = datetime.utcnow()
        base = 124382
        peak = 127104
        return [
            {"time": (now - timedelta(seconds=(30 - i) * 10)).isoformat(), "value": base - 600 + i * 40 + (i % 3) * 80, "peak": peak, "ts": (now - timedelta(seconds=(30 - i) * 10)).timestamp() * 1000}
            for i in range(18)
        ]
    return [
        {"time": s.timestamp.isoformat(), "value": s.portfolio_value, "peak": s.peak_value, "drawdown": s.drawdown_pct, "ts": s.timestamp.timestamp() * 1000}
        for s in snaps
    ]


@router.post("/simulate-drawdown")
async def simulate_drawdown(payload: dict = Body(default={}), db: Session = Depends(get_db)):
    """Live demo: force a drawdown, fire ALERT + HEDGE through the real pipeline."""
    drawdown_pct = float(payload.get("drawdown_pct", 0.028))
    symbol = payload.get("symbol", "AAPL")

    # get peak
    latest = db.query(PortfolioSnapshot).order_by(PortfolioSnapshot.timestamp.desc()).first()
    peak = latest.peak_value if latest else 127104
    crash_value = peak * (1 - drawdown_pct)

    # persist snapshot
    snap = PortfolioSnapshot(portfolio_value=crash_value, peak_value=peak, drawdown_pct=drawdown_pct)
    db.add(snap)
    db.commit()

    # CHANGED: real price lookup (fixes wrong strike on non-AAPL symbols), fallback 230
    price = 230.0
    try:
        positions = alpaca.get_positions()
        for pos in positions:
            if pos.get("symbol") == symbol:
                price = float(pos.get("current_price", 0) or 0) or 230.0
                break
    except Exception:
        pass

    # create alert
    alert = Alert(stock_symbol=symbol, current_price=price, drawdown_pct=drawdown_pct, status="fired")
    db.add(alert)
    db.commit()
    db.refresh(alert)

    await websocket_manager.broadcast({
        "type": "ALERT",
        "data": {"symbol": symbol, "drawdown": f"{drawdown_pct:.2%}", "portfolio_value": crash_value, "peak_value": peak, "timestamp": datetime.utcnow().isoformat()}
    })

    # hand off to executor (idempotent)
    from agents.executor import executor
    await executor.process_alert(alert.id, symbol, price, drawdown_pct)

    return {"ok": True, "alert_id": alert.id, "portfolio_value": crash_value, "peak_value": peak, "drawdown": drawdown_pct}


# alias routes for frontend probe fallback
@router.post("/simulate")
async def simulate_alias(payload: dict = Body(default={}), db: Session = Depends(get_db)):
    return await simulate_drawdown(payload, db)

# CHANGED: renamed from "/stress-test" to "/simulate-live" — no longer shadows the math endpoint
@router.post("/simulate-live")
async def simulate_live_alias(payload: dict = Body(default={}), db: Session = Depends(get_db)):
    return await simulate_drawdown(payload, db)


@router.get("/alerts")
async def get_alerts(db: Session = Depends(get_db)):
    """Get all alerts."""
    alerts = db.query(Alert).order_by(Alert.timestamp.desc()).all()
    return [
        {
            "id": a.id,
            "symbol": a.stock_symbol,
            "drawdown": a.drawdown_pct,
            "status": a.status,
            "timestamp": a.timestamp.isoformat()
        }
        for a in alerts
    ]


@router.get("/hedges")
async def get_hedges(db: Session = Depends(get_db)):
    """Get all active hedges."""
    hedges = db.query(Hedge).order_by(Hedge.timestamp.desc()).all()
    return [
        {
            "id": h.id,
            "symbol": h.stock_symbol,
            "strike": h.strike_price,
            "expiry": h.expiry_date,
            "premium_paid": h.premium_paid,
            "status": h.status,
            "timestamp": h.timestamp.isoformat(),
        }
        for h in hedges
    ]


class StressTestRequest(BaseModel):
    symbol: str
    drawdown_pct: float  # fraction: 0.15 = 15% drop


@router.post("/stress-test")
async def stress_test(req: StressTestRequest):
    """Simulate a market crash — hedged vs unhedged comparison."""
    drop = abs(req.drawdown_pct)
    if not (0 < drop <= 0.9):
        raise HTTPException(status_code=400, detail="drawdown_pct must be between 0 and 0.9")
    return run_stress_test(req.symbol.upper(), drop)



@router.get("/logs")
async def get_logs(limit: int = 50, agent: str = None, severity: str = None, db: Session = Depends(get_db)):
    """System event telemetry — powers the Logs page."""
    query = db.query(EventLog)
    if agent:
        query = query.filter(EventLog.agent == agent)
    if severity:
        query = query.filter(EventLog.severity == severity)
    events = query.order_by(EventLog.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": e.id,
            "timestamp": e.timestamp.isoformat(),
            "agent": e.agent,
            "event_type": e.event_type,
            "message": e.message,
            "severity": e.severity,
        }
        for e in events
    ]

from services.app_settings import get_all_settings, set_settings


class ConfigUpdate(BaseModel):
    updates: dict


@router.get("/config")
async def get_config():
    """Live runtime configuration — powers the Settings page."""
    return get_all_settings()


@router.put("/config")
async def update_config(payload: ConfigUpdate):
    """Update runtime settings — agents pick up changes on their next loop."""
    try:
        return {"ok": True, "settings": set_settings(payload.updates)}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))