"""
SQLite Database Schema — Shared by FastAPI and Agents.
"""


from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Boolean, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
from config import DATABASE_URL

Base = declarative_base()
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshots"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    portfolio_value = Column(Float, nullable=False)
    peak_value = Column(Float, nullable=False)
    drawdown_pct = Column(Float, nullable=False)


class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    stock_symbol = Column(String, nullable=False)
    current_price = Column(Float, nullable=False)
    drawdown_pct = Column(Float, nullable=False)
    status = Column(String, default="fired")  # fired, processed, failed


class Hedge(Base):
    __tablename__ = "hedges"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    stock_symbol = Column(String, nullable=False)
    strike_price = Column(Float, nullable=False)
    expiry_date = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    premium_paid = Column(Float, nullable=False)
    status = Column(String, default="active")  # active, expired, closed


class EventLog(Base):
    __tablename__ = "events"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    event_type = Column(String, nullable=False)
    payload = Column(String, nullable=False)


class EventLog(Base):
    __tablename__ = "event_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    agent = Column(String, index=True)          # "Monitor" | "Executor"
    event_type = Column(String, index=True)     # "PORTFOLIO_CHECK", "HEDGE_PLACED", ...
    message = Column(Text)
    severity = Column(String, default="info")   # "info" | "warning" | "error"


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()