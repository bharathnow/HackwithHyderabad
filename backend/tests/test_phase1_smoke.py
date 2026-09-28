import pytest
from app.agent.llm_wrapper import llm_wrapper, repair_json
from app.memory.hindsight_wrapper import hindsight_wrapper

def test_json_repair():
    raw_markdown = """```json
    {
        "status": "ok",
        "count": 42,
    }
    ```"""
    parsed = repair_json(raw_markdown)
    assert parsed["status"] == "ok"
    assert parsed["count"] == 42

def test_llm_wrapper_fallback():
    fallback = {"status": "default_fallback"}
    res = llm_wrapper.generate_json(
        system_prompt="Test system",
        user_prompt="Test user prompt",
        fallback_default=fallback
    )
    assert isinstance(res, dict)
    assert len(res) > 0

def test_hindsight_wrapper_smoke():
    # Test retain
    ret_res = hindsight_wrapper.retain(
        content="Incident #101: payment-gateway DB pool exhausted during peak sales.",
        context="test_incident",
        metadata={"service": "payment-gateway", "fix": "Increased max_connections to 150"}
    )
    assert ret_res["status"] == "success"

    # Test recall
    rec_res = hindsight_wrapper.recall(query="payment-gateway DB pool", limit=2)
    assert isinstance(rec_res, list)
    assert len(rec_res) > 0
    assert "payment-gateway" in rec_res[0]["text"]

    # Test reflect
    refl_res = hindsight_wrapper.reflect(query="What caused payment-gateway outage?")
    assert isinstance(refl_res, str)
    assert len(refl_res) > 0

    # Test list memories
    mems = hindsight_wrapper.list_memories(limit=10)
    assert isinstance(mems, list)
    assert len(mems) > 0
