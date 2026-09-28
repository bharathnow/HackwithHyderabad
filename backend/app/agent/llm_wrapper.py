import json
import re
import logging
from typing import Dict, Any, List, Optional
import httpx
from groq import Groq
from app.config import settings

logger = logging.getLogger("incidentmind.llm")

def repair_json(raw_text: str) -> Dict[str, Any]:
    """
    Extracts and repairs JSON output from LLM raw text responses.
    Handles Markdown backticks, invalid quotes, trailing commas, etc.
    """
    if not raw_text:
        raise ValueError("Empty response text from LLM")
        
    cleaned = raw_text.strip()
    
    # Remove markdown code fence if present
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned, re.IGNORECASE)
    if match:
        cleaned = match.group(1).strip()
    
    # Try parsing directly
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass
        
    # Attempt to locate first '{' and last '}'
    start_idx = cleaned.find("{")
    end_idx = cleaned.rfind("}")
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        extracted = cleaned[start_idx:end_idx + 1]
        try:
            return json.loads(extracted)
        except json.JSONDecodeError:
            # Trailing comma fix
            sanitized = re.sub(r",\s*([\}\]])", r"\1", extracted)
            try:
                return json.loads(sanitized)
            except json.JSONDecodeError as e:
                logger.warning(f"JSON repair failed: {e}")
                raise ValueError(f"Unable to parse JSON from response: {cleaned[:100]}...")
                
    raise ValueError(f"No valid JSON structure found in output: {cleaned[:100]}...")

class LLMWrapper:
    """
    Groq LLM wrapper with fallback model retry logic, JSON repair, and crash prevention.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.GROQ_API_KEY
        self.client = None
        if self.api_key and not self.api_key.startswith("gsk_demo_mock"):
            try:
                self.client = Groq(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Groq client init warning: {e}")

    def generate_json(
        self,
        system_prompt: str,
        user_prompt: str,
        fallback_default: Dict[str, Any],
        temperature: float = 0.2
    ) -> Dict[str, Any]:
        """
        Executes completion with primary model -> fallback model -> JSON repair -> default fallback.
        Ensures the app NEVER crashes on an LLM failure.
        """
        models_to_try = [settings.PRIMARY_LLM_MODEL, settings.FALLBACK_LLM_MODEL, "llama-3.3-70b-versatile"]
        
        # If no real API key is configured or client fails, return rule-based fallback response
        if not self.client or not self.api_key or self.api_key.startswith("gsk_demo_mock"):
            logger.info("Using smart mock LLM engine (no active Groq API key set)")
            return self._generate_mock_fallback(system_prompt, user_prompt, fallback_default)
            
        messages = [
            {"role": "system", "content": system_prompt + "\nIMPORTANT: You MUST respond ONLY with valid JSON. Do not include markdown text outside the JSON."},
            {"role": "user", "content": user_prompt}
        ]
        
        for model in models_to_try:
            for attempt in range(2):
                try:
                    logger.info(f"Calling LLM model '{model}' (attempt {attempt + 1})...")
                    chat_completion = self.client.chat.completions.create(
                        messages=messages,
                        model=model,
                        temperature=temperature,
                        response_format={"type": "json_object"}
                    )
                    content = chat_completion.choices[0].message.content
                    if content:
                        parsed = repair_json(content)
                        return parsed
                except Exception as err:
                    logger.warning(f"LLM call error on model '{model}', attempt {attempt + 1}: {err}")
                    
        logger.error("All LLM models and retries failed. Returning safe fallback default.")
        return fallback_default

    def _generate_mock_fallback(self, system_prompt: str, user_prompt: str, default: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates realistic fallback responses when LLM API key is not active.
        """
        if "proactive" in system_prompt.lower() or "deployment risk" in system_prompt.lower():
            return {
                "risk_score": 78,
                "risk_level": "HIGH",
                "summary": "Deployment includes DB pool connection modifications similar to past INC-2024-028 which caused cascading timeouts in payment-gateway.",
                "similar_past_incidents": ["INC-2024-007", "INC-2024-028"],
                "preventative_recommendations": [
                    "Perform dry-run database migration in staging with PgBouncer enabled",
                    "Verify max_connections ceiling on Postgres replica pool before applying change",
                    "Ensure roll-back script is prepared for connection pool config"
                ]
            }
            
        return default

llm_wrapper = LLMWrapper()
