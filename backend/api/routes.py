"""
FastAPI REST routes — portfolio data, alerts, stress test endpoints.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from models.database import get_db, PortfolioSnapshot, Alert, Hedge

router = APIRouter()


@router.get("/portfolio")
async def get_portfolio(db: Session = Depends(get_db)):
    """Get latest portfolio snapshot."""
    latest = db.query(PortfolioSnapshot).order_by(
        PortfolioSnapshot.timestamp.desc()
    ).first()
    if not latest:
        return {"portfolio_value": 0, "peak_value": 0, "drawdown": 0}
    return {
        "portfolio_value": latest.portfolio_value,
        "peak_value": latest.peak_value,
        "drawdown": latest.drawdown_pct
    }


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
            "status": h.status
        }
        for h in hedges
    ]