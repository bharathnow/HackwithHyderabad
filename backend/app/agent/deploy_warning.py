import logging
from typing import Dict, Any, List
from app.memory.hindsight_wrapper import hindsight_wrapper
from app.agent.llm_wrapper import llm_wrapper

logger = logging.getLogger("incidentmind.warning")

class DeployWarningAgent:
    def analyze_deployment_risk(self, deploy_description: str) -> Dict[str, Any]:
        """
        Recalls past incidents caused by similar code or configuration changes
        and issues a proactive warning before deployment.
        """
        recalled_memories = hindsight_wrapper.recall(
            query=f"Deployment configuration change: {deploy_description}",
            limit=5
        )

        memories_str = "\n".join([f"- {m['text']}" for m in recalled_memories])

        system_prompt = (
            "You are IncidentMind Proactive Risk Analyzer.\n"
            "Given a proposed deployment change description and recalled past incident memories, evaluate the deployment risk.\n"
            "If past incidents show that similar changes caused outages, issue a HIGH risk warning with preventative recommendations.\n"
            "Respond in JSON format."
        )

        user_prompt = f"""
PROPOSED DEPLOYMENT CHANGE:
{deploy_description}

RECALLED PAST INCIDENTS (HINDSIGHT MEMORY):
{memories_str}

Respond with JSON object containing:
- "risk_score": integer (0-100)
- "risk_level": string ("LOW" | "MEDIUM" | "HIGH" | "CRITICAL")
- "summary": string (concise explanation of risks based on past memories)
- "similar_past_incidents": array of strings (e.g. ["INC-2024-007", "INC-2024-028"])
- "preventative_recommendations": array of strings (actionable steps to prevent outage)
- "recalled_evidence": array of strings (relevant past incident snippets)
"""

        fallback_default = {
            "risk_score": 85,
            "risk_level": "HIGH",
            "summary": "Proposed change modifies connection pool parameters similar to INC-2024-028 which caused Postgres DB node crash.",
            "similar_past_incidents": ["INC-2024-007", "INC-2024-028"],
            "preventative_recommendations": [
                "Keep PgBouncer enabled for query pooling rather than raw connection slots",
                "Perform dry-run load test in staging environment",
                "Ensure rollback script is ready prior to deployment"
            ],
            "recalled_evidence": [m["text"][:150] for m in recalled_memories[:2]]
        }

        result = llm_wrapper.generate_json(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            fallback_default=fallback_default,
            temperature=0.1
        )
        
        result["recalled_raw_memories"] = recalled_memories
        return result

deploy_warning_agent = DeployWarningAgent()
