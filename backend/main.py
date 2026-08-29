"""
Hedgify FastAPI Application — Entry point.
Boots the API, WebSocket, background agent loop, and SQLite database.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio

from models.database import init_db
from api.routes import router as api_router
from api.websocket import websocket_manager
from agents.monitor import MonitorAgent


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: init DB + spawn Monitor Agent background loop."""
    init_db()
    monitor = MonitorAgent()
    task = asyncio.create_task(monitor.run_loop())
    yield
    # Shutdown: cancel background task gracefully
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


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

app.include_router(api_router, prefix="/api/v1")
app.add_api_websocket_route("/ws", websocket_manager.endpoint)


@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "hedgify"}