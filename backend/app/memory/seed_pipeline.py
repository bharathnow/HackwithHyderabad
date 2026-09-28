import json
import os
import logging
from typing import Dict, Any, List
from app.memory.hindsight_wrapper import hindsight_wrapper

logger = logging.getLogger("incidentmind.seed")

def seed_synthetic_incidents() -> Dict[str, Any]:
    """
    Loads synthetic incident history from data/synthetic_incidents.json
    and retains it into the Hindsight memory bank.
    """
    json_path = os.path.join(os.path.dirname(__file__), "..", "data", "synthetic_incidents.json")
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Synthetic dataset not found at {json_path}")
        
    with open(json_path, "r", encoding="utf-8") as f:
        incidents = json.load(f)
        
    items_to_retain = []
    for inc in incidents:
        content = (
            f"Incident ID: {inc['id']} | Service: {inc['service']} | Error Code: {inc['error_code']}\n"
            f"Log Snippet: {inc['log_snippet']}\n"
            f"Root Cause: {inc['root_cause']}\n"
            f"Fix Applied: {inc['fix_applied']}\n"
            f"Outcome: {inc['outcome'].upper()} | Responding Engineer: {inc['engineer']}\n"
            f"Notes: {inc.get('notes', 'None')}"
        )
        items_to_retain.append({
            "content": content,
            "context": f"incident_{inc['service']}",
            "timestamp": inc.get("timestamp"),
            "document_id": inc["id"],
            "metadata": {
                "incident_id": inc["id"],
                "service": inc["service"],
                "error_code": inc["error_code"],
                "engineer": inc["engineer"],
                "outcome": inc["outcome"],
                "fix_applied": inc["fix_applied"]
            }
        })
        
    res = hindsight_wrapper.retain_batch(items_to_retain, document_id="synthetic_history_seed_v1")
    logger.info(f"Seeded {len(incidents)} synthetic incidents into Hindsight.")
    return {
        "status": "success",
        "count": len(incidents),
        "details": res
    }

if __name__ == "__main__":
    seed_synthetic_incidents()
