"""
VRYS AI — Human Handoff & Escalation Engine (Step 8)
Detects high-risk customer sentiments (anger, refund demands, legal disputes, negotiation)
and immediately transfers conversation control to human staff.
"""
from typing import Dict, Any, Tuple

class HumanHandoffManager:
    def __init__(self):
        self.escalation_keywords = [
            "refund", "money back", "cancel order", "paisa wapas",
            "fraud", "scam", "lawyer", "police", "court", "legal notice",
            "angry", "terrible service", "complaint", "talk to manager", "human"
        ]

    def evaluate_incoming_message(self, text: str, confidence_score: float = 0.95) -> Dict[str, Any]:
        """
        Evaluates incoming customer message for human escalation triggers.
        """
        text_lower = text.lower().strip()

        # 1. Keyword-based Escalation Trigger
        for kw in self.escalation_keywords:
            if kw in text_lower:
                return {
                    "requires_handoff": True,
                    "reason": f"Customer mentioned sensitive keyword: '{kw}'",
                    "escalation_tier": "IMMEDIATE_HUMAN_TAKEOVER",
                    "conversation_status": "HUMAN_CONTROLLED"
                }

        # 2. Confidence-based Fallback Trigger
        if confidence_score < 0.65:
            return {
                "requires_handoff": True,
                "reason": "AI confidence fell below safety threshold (< 0.65)",
                "escalation_tier": "OPERATOR_REVIEW",
                "conversation_status": "HUMAN_CONTROLLED"
            }

        return {
            "requires_handoff": False,
            "reason": "Routine conversational query",
            "conversation_status": "AI_ACTIVE"
        }

human_handoff_manager = HumanHandoffManager()
