"""
Hedgify FastAPI Application — Entry point.
Boots the API, WebSocket, background agent loop, and SQLite database.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from sqlalchemy import text
import asyncio
import logging

from models.database import init_db, SessionLocal
from api.routes import router as api_router
from api.websocket import websocket_manager
from agents.monitor import MonitorAgent

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB + spawn Monitor Agent background loop."""
    init_db()
    monitor = MonitorAgent()
    task = asyncio.create_task(monitor.run_loop())
    yield
    # Shutdown: cancel background task + close HTTP clients
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass
    from services.alpaca_client import alpaca
    await alpaca.close()


app = FastAPI(
    title="Hedgify API",
    description="Autonomous portfolio hedging system via protective put options",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.include_router(api_router, prefix="/api/v1")
app.add_api_websocket_route("/ws", websocket_manager.endpoint)


@app.get("/api/health")
async def health_check():
    """Health check that verifies DB connectivity."""
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False
    finally:
        db.close()
    return {"status": "ok" if db_ok else "degraded", "service": "hedgify", "database": "ok" if db_ok else "unreachable"}