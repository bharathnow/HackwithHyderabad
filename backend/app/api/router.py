from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.agent.incident_agent import incident_agent
from app.agent.deploy_warning import deploy_warning_agent
from app.memory.hindsight_wrapper import hindsight_wrapper
from app.memory.seed_pipeline import seed_synthetic_incidents
from app.data.stats_store import stats_store

router = APIRouter(prefix="/api")

class AlertAnalyzeRequest(BaseModel):
    service: str
    error_code: str
    log_snippet: str
    memory_enabled: bool = True

class FeedbackRequest(BaseModel):
    incident_id: Optional[str] = "ALERT-CURRENT"
    service: str
    fix_applied: str
    outcome: str # "worked" | "failed"
    engineer: Optional[str] = "On-Call Engineer"
    notes: Optional[str] = ""

class ProactiveWarningRequest(BaseModel):
    deployment_description: str

@router.post("/alerts/analyze")
def analyze_alert(req: AlertAnalyzeRequest):
    try:
        res = incident_agent.analyze_alert(
            service=req.service,
            error_code=req.error_code,
            log_snippet=req.log_snippet,
            memory_enabled=req.memory_enabled
        )
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/feedback")
def submit_feedback(req: FeedbackRequest):
    """
    Retains feedback ("Fix worked" / "Fix failed") to Hindsight so memory self-corrects.
    """
    try:
        content = (
            f"Feedback Update for Incident {req.incident_id} | Service: {req.service}\n"
            f"Fix Applied: {req.fix_applied}\n"
            f"Outcome: {req.outcome.upper()} | Engineer: {req.engineer}\n"
            f"Notes: {req.notes or 'User provided feedback in UI'}"
        )
        
        # Retain into Hindsight memory
        retain_res = hindsight_wrapper.retain(
            content=content,
            context=f"feedback_{req.service}",
            timestamp=datetime.utcnow(),
            metadata={
                "incident_id": req.incident_id,
                "service": req.service,
                "fix_applied": req.fix_applied,
                "outcome": req.outcome,
                "engineer": req.engineer
            }
        )
        
        # Update learning curve stats
        stats_res = stats_store.record_feedback(
            service=req.service,
            fix_applied=req.fix_applied,
            outcome=req.outcome,
            memory_enabled=True
        )

        return {
            "status": "success",
            "message": f"Retained feedback outcome '{req.outcome}' into Hindsight memory. Memory self-corrected!",
            "hindsight_retain": retain_res,
            "stats": stats_res
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/proactive-warning")
def proactive_warning(req: ProactiveWarningRequest):
    try:
        return deploy_warning_agent.analyze_deployment_risk(req.deployment_description)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/seed")
def seed_data():
    try:
        return seed_synthetic_incidents()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/memories")
def get_memories(limit: int = 50):
    try:
        return {"memories": hindsight_wrapper.list_memories(limit=limit)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
def get_stats():
    try:
        return stats_store.get_learning_curve()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
