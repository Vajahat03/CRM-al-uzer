"""
VRYS AI — Multi-Tenant Isolated Memory Store
Maintains short-term conversation context strictly partitioned by organizationId.
"""
from typing import Dict, List, Any
import time

class TenantMemoryStore:
    def __init__(self):
        # Store layout: { organizationId: [ { query, response, timestamp, userId } ] }
        self._memory_cache: Dict[str, List[Dict[str, Any]]] = {}

    def append_interaction(self, org_id: str, user_id: str, prompt: str, response: str):
        if org_id not in self._memory_cache:
            self._memory_cache[org_id] = []

        self._memory_cache[org_id].append({
            "user_id": user_id,
            "prompt": prompt,
            "response": response,
            "timestamp": time.time()
        })

        # Cap memory buffer per tenant to prevent memory bloat
        if len(self._memory_cache[org_id]) > 50:
            self._memory_cache[org_id] = self._memory_cache[org_id][-50:]

    def get_recent_context(self, org_id: str, limit: int = 5) -> List[Dict[str, Any]]:
        return self._memory_cache.get(org_id, [])[-limit:]

tenant_memory = TenantMemoryStore()
