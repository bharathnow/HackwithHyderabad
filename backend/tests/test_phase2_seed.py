import pytest
from app.memory.seed_pipeline import seed_synthetic_incidents
from app.memory.hindsight_wrapper import hindsight_wrapper

def test_seed_pipeline():
    res = seed_synthetic_incidents()
    assert res["status"] == "success"
    assert res["count"] >= 30

    # Test recall after seeding
    recalled = hindsight_wrapper.recall(query="PGW_CONN_POOL_EXHAUSTED", limit=5)
    assert isinstance(recalled, list)
    assert len(recalled) > 0
    assert any("PGW_CONN_POOL_EXHAUSTED" in item["text"] or "payment-gateway" in item["text"] for item in recalled)
