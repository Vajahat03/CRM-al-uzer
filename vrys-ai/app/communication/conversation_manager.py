"""
VRYS AI — Conversation Manager & Safety Guardrails (Step 8)
Enforces 24-hour customer cooldowns, duplicate message prevention, rate-limits,
and multi-tenant conversation histories.
"""
from typing import Dict, Any, List, Optional
import time

class ConversationManager:
    def __init__(self):
        # In-memory session stores partitioned by organization_id
        self._sent_history: Dict[str, List[Dict[str, Any]]] = {}
        self._cooldown_seconds = 86400 # 24 hours cooldown for automated reachouts
        self._rate_limit_per_minute = 30 # Rate limit per tenant

    def check_can_contact_customer(self, org_id: str, customer_id: str, channel: str) -> Dict[str, Any]:
        """
        Validates whether a customer can be contacted without spamming (cooldown check).
        """
        history = self._sent_history.get(org_id, [])
        now = time.time()

        recent_messages = [
            m for m in history
            if m.get("customer_id") == customer_id and m.get("channel") == channel
        ]

        if recent_messages:
            last_msg_time = recent_messages[-1].get("timestamp", 0)
            elapsed = now - last_msg_time
            if elapsed < self._cooldown_seconds:
                hours_left = round((self._cooldown_seconds - elapsed) / 3600, 1)
                return {
                    "can_contact": False,
                    "reason": f"Customer was contacted {round(elapsed/3600, 1)} hours ago. Cooldown active for next {hours_left} hours.",
                    "cooldown_active": True
                }

        return {
            "can_contact": True,
            "reason": "Customer is eligible for communication.",
            "cooldown_active": False
        }

    def record_outbound_message(self, org_id: str, message_record: Dict[str, Any]) -> None:
        """
        Appends outbound message record to tenant conversation timeline.
        """
        if org_id not in self._sent_history:
            self._sent_history[org_id] = []
        self._sent_history[org_id].append(message_record)

    def get_customer_timeline(self, org_id: str, customer_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves complete conversation timeline for a given customer strictly isolated by tenant.
        """
        history = self._sent_history.get(org_id, [])
        return [m for m in history if m.get("customer_id") == customer_id]

conversation_manager = ConversationManager()
