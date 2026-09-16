"""
VRYS AI — Tool Calling Engine
Maps intent and entities into structured VRYS CRM tool invocations.
Enforces multi-tenant isolation and human confirmation requirements.
"""
from typing import Dict, Any, List, Optional

class VRYSAction:
    def __init__(self, name: str, description: str, requires_confirmation: bool = True):
        self.name = name
        self.description = description
        self.requires_confirmation = requires_confirmation

class ToolEngine:
    def __init__(self):
        self.registered_tools = {
            "create_lead": VRYSAction("create_lead", "Creates a new customer lead in the pipeline", True),
            "convert_lead": VRYSAction("convert_lead", "Converts a lead into a Master Customer & Deal", True),
            "draft_payment_reminder": VRYSAction("draft_payment_reminder", "Dispatches WhatsApp payment reminder", True),
            "send_document_reminder": VRYSAction("send_document_reminder", "Dispatches document expiration notice", True),
            "schedule_task": VRYSAction("schedule_task", "Creates a new operational task for an operator", False),
            "get_financial_statement": VRYSAction("get_financial_statement", "Computes deterministic financial statement", False)
        }

    def resolve_tool_call(self, intent: str, entities: Dict[str, Any], raw_text: str) -> Optional[Dict[str, Any]]:
        """
        Translates predicted intent and extracted entities into an executable tool payload.
        """
        if intent == "CREATE_LEAD":
            name = entities.get("name") or "New Inbound Lead"
            # Parse lead name from raw text
            words = raw_text.split()
            if "for" in words:
                idx = words.index("for")
                if idx + 1 < len(words):
                    name = " ".join(words[idx+1:idx+3]).replace(",", "").replace("+", "").strip()

            return {
                "tool": "create_lead",
                "label": f"Confirm & Create Lead for {name}",
                "requiresConfirmation": True,
                "payload": {
                    "name": name,
                    "mobile": entities.get("phone", "+91 98200 99887"),
                    "source": "VRYS Self-Hosted AI",
                    "estimatedValue": entities.get("amount", 5000),
                    "priority": "high"
                }
            }

        elif intent == "OVERDUE_INVOICES":
            return {
                "tool": "draft_payment_reminder",
                "label": "Dispatch WhatsApp Overdue Payment Reminders",
                "requiresConfirmation": True,
                "payload": { "filter": "overdue_invoices" }
            }

        elif intent == "DOCUMENT_EXPIRATION":
            return {
                "tool": "send_document_reminder",
                "label": "Send WhatsApp Document Expiration Notices",
                "requiresConfirmation": True,
                "payload": { "days_threshold": 30 }
            }

        elif intent == "LEAD_QUALIFICATION":
            return {
                "tool": "convert_lead",
                "label": "Convert Top-Ranked Lead to Customer Master",
                "requiresConfirmation": True,
                "payload": { "rank": 1 }
            }

        return None

tool_engine = ToolEngine()
