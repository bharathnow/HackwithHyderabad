import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    res = client.get("/")
    assert res.status_code == 200

def test_seed_endpoint():
    res = client.post("/api/seed")
    assert res.status_code == 200
    assert res.json()["status"] == "success"

def test_analyze_alert_with_memory():
    payload = {
        "service": "payment-gateway",
        "error_code": "PGW_CONN_POOL_EXHAUSTED",
        "log_snippet": "org.postgresql.util.PSQLException: FATAL: sorry, too many clients already",
        "memory_enabled": True
    }
    res = client.post("/api/alerts/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "likely_root_cause" in data
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0

def test_analyze_alert_without_memory():
    payload = {
        "service": "payment-gateway",
        "error_code": "PGW_CONN_POOL_EXHAUSTED",
        "log_snippet": "FATAL: sorry, too many clients already",
        "memory_enabled": False
    }
    res = client.post("/api/alerts/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["memory_enabled"] is False

def test_feedback_loop():
    payload = {
        "incident_id": "INC-TEST-001",
        "service": "payment-gateway",
        "fix_applied": "Deployed PgBouncer connection pooler",
        "outcome": "worked",
        "engineer": "Priya Sharma"
    }
    res = client.post("/api/feedback", json=payload)
    assert res.status_code == 200
    assert res.json()["status"] == "success"

def test_proactive_warning():
    payload = {
        "deployment_description": "Increasing Postgres max_connections to 500 without PgBouncer"
    }
    res = client.post("/api/proactive-warning", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "risk_score" in data

def test_memories_and_stats():
    res_mems = client.get("/api/memories")
    assert res_mems.status_code == 200
    assert "memories" in res_mems.json()

    res_stats = client.get("/api/stats")
    assert res_stats.status_code == 200
    assert "current_success_rate" in res_stats.json()
