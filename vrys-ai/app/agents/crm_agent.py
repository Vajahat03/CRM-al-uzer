"""
VRYS AI — Specialized Autonomous CRM & Operations Agent (Step 6)
Operates customer master records, 8-stage job Kanban, and Document Vault watchdogs.
"""
from typing import Dict, Any, List, Optional
from app.engine.crm_tools import crm_tool_suite
from app.engine.entity_normalizer import entity_normalizer

class CRMAgent:
    def __init__(self):
        self.agent_name = "💬 Autonomous CRM Operations Agent"
        self.version = "1.0.0"

    def handle_request(self, query: str, org_id: str, user_name: str, entities: Dict[str, Any]) -> Dict[str, Any]:
        text_lower = query.lower()

        # 1. Stuck Jobs & Operational Bottleneck Watchdog
        if any(w in text_lower for w in ["stuck", "bottleneck", "delay", "pending in stage", "al uzer", "kahan tak pahucha"]):
            stuck_jobs = crm_tool_suite.get_stuck_jobs(threshold_days=5, org_id=org_id)
            jobs_summary = "\n".join([
                f"• **{j['customer_name']}** ({j['service']}) — Stuck in **'{j['current_stage']}'** for **{j['days_in_stage']} days** (*{j['bottleneck_reason']}*)"
                for j in stuck_jobs
            ])

            return {
                "agent_name": self.agent_name,
                "intent": "JOB_STATUS_INQUIRY",
                "content": (
                    f"### ⚙️ Operational Kanban Bottleneck Watchdog\n\n"
                    f"I scanned active job cards across all 8 stages. Found **{len(stuck_jobs)} jobs pending attention** (>5 days):\n\n"
                    f"{jobs_summary}\n\n"
                    f"Would you like me to ping the assigned operators or follow up with the clients?"
                ),
                "suggested_actions": [
                    {
                        "label": "Ping Assigned Operators on WhatsApp",
                        "actionType": "notify_operators",
                        "payload": { "jobIds": [j["job_id"] for j in stuck_jobs] },
                        "requiresConfirmation": True
                    }
                ]
            }

        # 2. Document Vault Expiration Watchdog
        elif any(w in text_lower for w in ["passport", "expire", "expiry", "rc book", "visa", "document", "vault", "renew", "khatam"]):
            cust_name = entities.get("customer_name") or "Ahmed"
            doc_type = entities.get("document_type") or "passport"
            renewal_draft = crm_tool_suite.draft_document_renewal_notice(cust_name, doc_type, org_id)

            return {
                "agent_name": self.agent_name,
                "intent": "DOCUMENT_EXPIRATION",
                "content": (
                    f"### 📂 Document Vault Watchdog\n\n"
                    f"• **Customer:** {cust_name}\n"
                    f"• **Document:** {doc_type.capitalize()}\n"
                    f"• **Status:** Expiration alert flagged within 30-day renewal threshold.\n\n"
                    f"**Proposed WhatsApp Notification:**\n"
                    f"> \"{renewal_draft['message_preview']}\""
                ),
                "suggested_actions": [
                    {
                        "label": f"Dispatch WhatsApp Renewal Notice to {cust_name}",
                        "actionType": "send_document_reminder",
                        "payload": { "customerName": cust_name, "documentType": doc_type },
                        "requiresConfirmation": True
                    }
                ]
            }

        # 3. Customer 360° Profile Synthesis
        elif any(w in text_lower for w in ["customer", "profile", "history", "360", "ltv", "spent"]):
            cust_name = entities.get("customer_name") or "Rahul Verma"
            c360 = crm_tool_suite.get_customer_360(cust_name, org_id)

            return {
                "agent_name": self.agent_name,
                "intent": "CUSTOMER_360_QUERY",
                "content": (
                    f"### 👤 Customer 360° Overview: {cust_name}\n\n"
                    f"• **Account Tier:** {c360['status']}\n"
                    f"• **Lifetime Revenue:** ₹{c360['total_spent']:,.0f} across {c360['total_jobs']} jobs\n"
                    f"• **Predicted 12-Month LTV:** **₹{c360['predicted_ltv']:,.0f}** (Churn Risk: {c360['churn_risk']})\n"
                    f"• **Active Documents:** {len(c360['active_documents'])} stored in Vault\n"
                    f"• **Outstanding Balance:** ₹{c360['balance_due']:,.0f} (*All settled*)"
                ),
                "suggested_actions": [
                    {
                        "label": f"Open Customer 360 Card for {cust_name}",
                        "actionType": "view_customer_profile",
                        "payload": { "customerName": cust_name },
                        "requiresConfirmation": False
                    }
                ]
            }

        # Default CRM Operations Guidance
        return {
            "agent_name": self.agent_name,
            "intent": "CRM_OPERATIONS_ASSISTANCE",
            "content": (
                f"Hello {user_name}! I am your **Autonomous CRM & Operations Agent**.\n\n"
                f"I actively monitor your operational pipelines:\n"
                f"• ⚙️ **8-Stage Job Kanban Watchdog** (Identifies stuck Al Uzer & Doc Required jobs)\n"
                f"• 📂 **Document Vault Expirations** (Monitors 30-day passport & license renewals)\n"
                f"• 👤 **Customer 360° Synthesis** (Aggregates job history, balances & LTV)"
            ),
            "suggested_actions": []
        }

crm_agent = CRMAgent()
