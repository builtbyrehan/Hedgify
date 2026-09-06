"""Tests for api/routes.py — REST endpoints."""
import pytest
from unittest.mock import patch


HEADERS = {"X-API-Key": "test-hedgify-key"}


class TestHealthCheck:
    def test_health_endpoint(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["service"] == "hedgify"
        assert data["database"] in ("ok", "unreachable")


class TestPortfolioEndpoints:
    def test_get_portfolio(self, client):
        resp = client.get("/api/v1/portfolio", headers=HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        assert "portfolio_value" in data
        assert "peak_value" in data
        assert "drawdown" in data

    def test_get_portfolio_no_auth(self, client):
        resp = client.get("/api/v1/portfolio")
        assert resp.status_code == 401

    def test_get_portfolio_wrong_key(self, client):
        resp = client.get("/api/v1/portfolio", headers={"X-API-Key": "wrong-key"})
        assert resp.status_code == 401

    def test_get_portfolio_history(self, client):
        resp = client.get("/api/v1/portfolio/history", headers=HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_get_portfolio_history_with_limit(self, client):
        resp = client.get("/api/v1/portfolio/history?limit=5", headers=HEADERS)
        assert resp.status_code == 200


class TestAlertsEndpoint:
    def test_get_alerts(self, client):
        resp = client.get("/api/v1/alerts", headers=HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["symbol"] == "AAPL"

    def test_get_alerts_no_auth(self, client):
        resp = client.get("/api/v1/alerts")
        assert resp.status_code == 401


class TestHedgesEndpoint:
    def test_get_hedges(self, client):
        resp = client.get("/api/v1/hedges", headers=HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert data[0]["symbol"] == "AAPL"

    def test_get_hedges_no_auth(self, client):
        resp = client.get("/api/v1/hedges")
        assert resp.status_code == 401


class TestStressTestEndpoint:
    def test_stress_test_valid(self, client):
        resp = client.post("/api/v1/stress-test", json={
            "symbol": "AAPL",
            "drawdown_pct": 0.15,
        }, headers=HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "AAPL"
        assert "unhedged_loss" in data
        assert "hedged_loss" in data

    def test_stress_test_invalid_drawdown_too_high(self, client):
        resp = client.post("/api/v1/stress-test", json={
            "symbol": "AAPL",
            "drawdown_pct": 1.5,
        }, headers=HEADERS)
        assert resp.status_code == 400

    def test_stress_test_no_auth(self, client):
        resp = client.post("/api/v1/stress-test", json={
            "symbol": "AAPL",
            "drawdown_pct": 0.15,
        })
        assert resp.status_code == 401


class TestLogsEndpoint:
    def test_get_logs(self, client):
        resp = client.get("/api/v1/logs", headers=HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)

    def test_get_logs_with_limit(self, client):
        resp = client.get("/api/v1/logs?limit=10", headers=HEADERS)
        assert resp.status_code == 200

    def test_get_logs_no_auth(self, client):
        resp = client.get("/api/v1/logs")
        assert resp.status_code == 401


class TestConfigEndpoint:
    def test_get_config(self, client):
        resp = client.get("/api/v1/config", headers=HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        assert "autonomous_hedging" in data
        assert "drawdown_threshold" in data

    def test_update_config(self, client):
        resp = client.put("/api/v1/config", json={
            "updates": {"drawdown_threshold": 0.04}
        }, headers=HEADERS)
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True
        assert data["settings"]["drawdown_threshold"] == 0.04

    def test_update_config_invalid_key(self, client):
        resp = client.put("/api/v1/config", json={
            "updates": {"bad_key": "value"}
        }, headers=HEADERS)
        assert resp.status_code == 400

    def test_get_config_no_auth(self, client):
        resp = client.get("/api/v1/config")
        assert resp.status_code == 401
