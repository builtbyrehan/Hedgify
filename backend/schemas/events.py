"""
Pydantic data models — type-safe contracts for agent communication.
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class DrawdownEvent(BaseModel):
    """Message fired by Monitor Agent when portfolio drops ≥ 2%."""
    event_id: str
    event_type: str = "DRAWDOWN"
    timestamp: datetime
    stock_symbol: str
    current_price: float
    shares_held: int
    portfolio_value: float
    peak_value: float
    drawdown_pct: float
    trigger_threshold: float


class HedgeIntent(BaseModel):
    """Message sent by Hedge Executor to MCP bridge."""
    symbol: str
    strike_price: float
    expiration_date: str  # YYYY-MM-DD
    quantity: int


class OrderConfirmation(BaseModel):
    """Response from Alpaca after executing an order."""
    order_id: str
    status: str  # filled, pending, rejected
    filled_price: Optional[float] = None
    timestamp: datetime