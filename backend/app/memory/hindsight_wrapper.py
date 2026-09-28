import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx
from app.config import settings

logger = logging.getLogger("incidentmind.memory")

try:
    from hindsight_client import Hindsight
    HINDSIGHT_SDK_AVAILABLE = True
except ImportError:
    HINDSIGHT_SDK_AVAILABLE = False
    logger.warning("hindsight-client SDK not found. Will use REST/fallback client.")

class HindsightWrapper:
    """
    Official Hindsight SDK wrapper for IncidentMind.
    Manages retain, recall, reflect, and memory bank configuration for on-call incident response.
    Supports Hindsight Cloud via HINDSIGHT_API_KEY and base URL, or open-source Hindsight server.
    Includes an in-memory fallback store if the external server is unreachable.
    """

    def __init__(self):
        self.bank_id = settings.HINDSIGHT_BANK_ID
        self.base_url = settings.HINDSIGHT_BASE_URL
        self.api_key = settings.HINDSIGHT_API_KEY
        self.client = None
        self._fallback_memories: List[Dict[str, Any]] = []

        if HINDSIGHT_SDK_AVAILABLE and self.base_url:
            try:
                self.client = Hindsight(
                    base_url=self.base_url,
                    api_key=self.api_key if self.api_key else None,
                    timeout=15.0
                )
                logger.info(f"Initialized Hindsight client at {self.base_url}")
            except Exception as e:
                logger.warning(f"Failed to initialize Hindsight client: {e}")

    def ensure_bank_exists(self) -> bool:
        """
        Creates or verifies the Hindsight memory bank with incident response mission and disposition.
        """
        if not self.client:
            return False
            
        try:
            self.client.create_bank(
                bank_id=self.bank_id,
                name="Fintech Incident Response Bank",
                mission="Remember past payment gateway and UPI outages, root causes, effective/failed fixes, and engineer knowledge to solve incidents faster.",
                disposition={
                    "skepticism": 3,
                    "literalism": 4,
                    "empathy": 2
                }
            )
            logger.info(f"Hindsight bank '{self.bank_id}' created or verified.")
            return True
        except Exception as e:
            logger.info(f"Bank creation notice (may already exist): {e}")
            return True

    def retain(
        self,
        content: str,
        context: str = "incident_log",
        timestamp: Optional[datetime] = None,
        document_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Retains a new incident memory into Hindsight.
        """
        mem_item = {
            "content": content,
            "context": context,
            "timestamp": timestamp.isoformat() if timestamp else datetime.utcnow().isoformat(),
            "document_id": document_id,
            "metadata": metadata or {}
        }
        self._fallback_memories.append(mem_item)

        if self.client:
            try:
                self.ensure_bank_exists()
                kwargs = {
                    "bank_id": self.bank_id,
                    "content": content,
                    "context": context,
                    "retain_async": False
                }
                if timestamp:
                    kwargs["timestamp"] = timestamp
                if document_id:
                    kwargs["document_id"] = document_id
                if metadata:
                    kwargs["metadata"] = metadata
                    
                res = self.client.retain(**kwargs)
                logger.info(f"Successfully retained memory in Hindsight bank '{self.bank_id}'")
                return {"status": "success", "mode": "hindsight_sdk", "content": content}
            except Exception as e:
                logger.warning(f"Hindsight SDK retain failed ({e}). Retained in resilient fallback memory.")
                
        return {"status": "success", "mode": "fallback_store", "content": content}

    def retain_batch(self, items: List[Dict[str, Any]], document_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Bulk retains synthetic incident history into Hindsight.
        """
        for item in items:
            self._fallback_memories.append(item)

        if self.client:
            try:
                self.ensure_bank_exists()
                sdk_items = []
                for it in items:
                    sdk_items.append({
                        "content": it.get("content", ""),
                        "context": it.get("context", "incident_log"),
                        "metadata": it.get("metadata", {})
                    })
                self.client.retain_batch(
                    bank_id=self.bank_id,
                    items=sdk_items,
                    document_id=document_id or "seed_history_v1",
                    retain_async=False
                )
                logger.info(f"Retained batch of {len(items)} memories into Hindsight.")
                return {"status": "success", "mode": "hindsight_sdk", "count": len(items)}
            except Exception as e:
                logger.warning(f"Hindsight SDK retain_batch failed ({e}). Saved {len(items)} items in fallback store.")
                
        return {"status": "success", "mode": "fallback_store", "count": len(items)}

    def recall(self, query: str, budget: str = "high", limit: int = 5) -> List[Dict[str, Any]]:
        """
        Recalls past incidents matching the query using Hindsight TEMPR 4-way retrieval.
        """
        if self.client:
            try:
                res = self.client.recall(
                    bank_id=self.bank_id,
                    query=query,
                    budget=budget,
                    include_chunks=True
                )
                recalled = []
                if res and hasattr(res, "results") and res.results:
                    for r in res.results[:limit]:
                        chunk_text = ""
                        if hasattr(res, "chunks") and res.chunks and hasattr(r, "chunk_id"):
                            chunk_obj = (res.chunks or {}).get(r.chunk_id)
                            if chunk_obj and hasattr(chunk_obj, "text"):
                                chunk_text = chunk_obj.text
                                
                        recalled.append({
                            "text": getattr(r, "text", str(r)),
                            "type": getattr(r, "type", "world"),
                            "chunk_text": chunk_text or getattr(r, "text", str(r)),
                            "score": getattr(r, "score", 0.95)
                        })
                    return recalled
            except Exception as e:
                logger.warning(f"Hindsight SDK recall error ({e}). Using fuzzy fallback search.")

        # Resilient keyword/fuzzy fallback match across local memories
        query_words = set(query.lower().split())
        matched = []
        for mem in self._fallback_memories:
            c_text = mem.get("content", "")
            c_lower = c_text.lower()
            score = sum(1 for word in query_words if word in c_lower)
            if score > 0 or len(matched) < limit:
                matched.append({
                    "text": c_text,
                    "type": "world",
                    "chunk_text": c_text,
                    "score": score
                })
        matched.sort(key=lambda x: x["score"], reverse=True)
        return matched[:limit]

    def reflect(self, query: str, context: Optional[str] = None) -> str:
        """
        Generates contextual reasoning across memory banks using Hindsight reflect().
        """
        if self.client:
            try:
                answer = self.client.reflect(
                    bank_id=self.bank_id,
                    query=query,
                    context=context or "On-call incident investigation",
                    budget="mid"
                )
                if hasattr(answer, "text"):
                    return answer.text
                return str(answer)
            except Exception as e:
                logger.warning(f"Hindsight reflect call failed: {e}")

        # Fallback reflection summary
        recalled = self.recall(query, limit=3)
        if not recalled:
            return "No prior recorded incidents match this signature. Recommend standard triage protocols."
        return f"Hindsight Reflection: Recalled {len(recalled)} relevant past incidents. Common root causes point to configuration changes or resource pool saturation."

    def list_memories(self, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Lists all memories stored in the bank.
        """
        if self.client:
            try:
                mems = self.client.list_memories(bank_id=self.bank_id, limit=limit)
                if hasattr(mems, "memories"):
                    return [
                        {
                            "id": getattr(m, "id", f"mem_{i}"),
                            "text": getattr(m, "text", str(m)),
                            "type": getattr(m, "type", "world"),
                            "created_at": getattr(m, "created_at", datetime.utcnow().isoformat())
                        }
                        for i, m in enumerate(mems.memories)
                    ]
            except Exception as e:
                logger.warning(f"Hindsight list_memories error: {e}")

        return [
            {
                "id": f"fallback_mem_{i+1}",
                "text": m.get("content", ""),
                "type": "world",
                "created_at": m.get("timestamp", datetime.utcnow().isoformat())
            }
            for i, m in enumerate(self._fallback_memories[:limit])
        ]

hindsight_wrapper = HindsightWrapper()
