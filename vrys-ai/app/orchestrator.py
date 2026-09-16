"""
VRYS AI — Multi-Agent Orchestrator
Coordinates the Local Reasoning Language Model, Specialized ML models, and Tool Engine
while strictly enforcing multi-layer tenant isolation and human confirmation.
"""
from typing import Dict, Any, Optional, List
from app.models.local_llm import local_llm
from app.models.intent_classifier import intent_model
from app.models.lead_scorer import lead_scorer_model
from app.models.nlp_parser import nlp_parser
from app.models.customer_intelligence import customer_intelligence_model
from app.engine.tool_engine import tool_engine
from app.memory.tenant_memory import tenant_memory
from app.security.tenant_guard import tenant_guard

from app.agents.crm_agent import crm_agent
from app.agents.business_intelligence_agent import business_intelligence_agent
from app.agents.communication_agent import communication_agent
from app.agents.marketing_agent import marketing_agent

class MultiAgentOrchestrator:
    def __init__(self):
        self.system_name = "VRYS Autonomous Multi-Agent Brain"
        self.version = "2.0.0"

    def process_query(self, query: str, org_id: str, user_name: str, preferred_agent: Optional[str] = None) -> Dict[str, Any]:
        # 1. Cryptographic / Tenant Security Validation (Never trust raw client input)
        security_ctx = tenant_guard.validate_session(org_id)
        clean_org_id = security_ctx["authorized_org_id"]

        # 2. Local Language Model Reasoning & Planning Layer
        llm_plan = local_llm.generate_plan(
            prompt=query,
            org_id=clean_org_id,
            context={"user_name": user_name, "preferred_agent": preferred_agent}
        )

        intent = llm_plan.get("intent", "GENERAL_SYSTEM_ASSISTANCE")
        entities = llm_plan.get("entities", {})
        thought = llm_plan.get("thought", "")
        plan_steps = llm_plan.get("plan", [])
        planned_tools = llm_plan.get("tools", [])
        natural_response = llm_plan.get("natural_response", "")

        text_lower = query.lower()

        # 3. Dynamic Agent Persona Delegation
        if any(w in text_lower for w in ["campaign", "meta ads", "google ads", "roas", "cac", "cpl", "which campaign", "making us money", "instagram", "marketing health"]) or preferred_agent == "MARKETING":
            agent_result = marketing_agent.handle_request(query, clean_org_id, user_name, entities)
            agent_name = agent_result["agent_name"]
            natural_response = agent_result["content"]
            intent = agent_result["intent"]
            if agent_result.get("suggested_actions"):
                planned_tools = [{"name": a["actionType"], "arguments": a["payload"], "requires_confirmation": a["requiresConfirmation"]} for a in agent_result["suggested_actions"]]
        elif any(w in text_lower for w in ["send whatsapp", "send email", "draft message", "talk to manager", "refund", "lawyer", "fraud", "angry", "i'll pay", "kal payment"]) or preferred_agent == "COMMUNICATION":
            agent_result = communication_agent.handle_request(query, clean_org_id, user_name, entities)
            agent_name = agent_result["agent_name"]
            natural_response = agent_result["content"]
            intent = agent_result["intent"]
            if agent_result.get("suggested_actions"):
                planned_tools = [{"name": a["actionType"], "arguments": a["payload"], "requires_confirmation": a["requiresConfirmation"]} for a in agent_result["suggested_actions"]]
        elif any(w in text_lower for w in ["health", "morning brief", "brief", "snapshot", "why did sales fall", "sales drop", "sales trend", "conversion drop", "receivables trend"]) or preferred_agent == "BI":
            agent_result = business_intelligence_agent.handle_request(query, clean_org_id, user_name, entities)
            agent_name = agent_result["agent_name"]
            natural_response = agent_result["content"]
            intent = agent_result["intent"]
            if agent_result.get("suggested_actions"):
                planned_tools = [{"name": a["actionType"], "arguments": a["payload"], "requires_confirmation": a["requiresConfirmation"]} for a in agent_result["suggested_actions"]]
        elif intent in ["DOCUMENT_EXPIRATION", "JOB_STATUS_INQUIRY", "CUSTOMER_360_QUERY"] or preferred_agent == "CRM":
            agent_result = crm_agent.handle_request(query, clean_org_id, user_name, entities)
            agent_name = agent_result["agent_name"]
            natural_response = agent_result["content"]
            if agent_result.get("suggested_actions"):
                planned_tools = [{"name": a["actionType"], "arguments": a["payload"], "requires_confirmation": a["requiresConfirmation"]} for a in agent_result["suggested_actions"]]
        elif "LEAD" in intent or "SALES" in intent:
            agent_name = "🎯 Sales Strategy Agent"
        elif "OVERDUE" in intent or "FINANCIAL" in intent:
            agent_name = "📊 Business Intelligence Agent"
        else:
            agent_name = "🧠 Master Orchestrator Agent"

        # 4. Resolve Suggested Tool Actions with Human Confirmation Guardrails
        suggested_actions = []
        for t in planned_tools:
            tool_name = t.get("name")
            tool_args = t.get("arguments", {})
            requires_confirmation = t.get("requires_confirmation", True)

            # Ensure arguments strictly carry clean authorized org_id
            tool_args["organizationId"] = clean_org_id

            if tool_name == "create_lead":
                suggested_actions.append({
                    "label": f"Confirm & Create Lead for {tool_args.get('name', 'Prospect')}",
                    "actionType": "create_lead",
                    "payload": {
                        "name": tool_args.get("name", "Prospect"),
                        "mobile": entities.get("phone", "+91 98200 99887"),
                        "source": "Local Reasoning Agent",
                        "estimatedValue": tool_args.get("estimatedValue", 5000),
                        "priority": "high"
                    },
                    "requiresConfirmation": True
                })
            elif tool_name == "draft_payment_reminders":
                suggested_actions.append({
                    "label": "Dispatch WhatsApp Payment Chasers",
                    "actionType": "draft_payment_reminders",
                    "payload": { "filter": "overdue_invoices" },
                    "requiresConfirmation": True
                })
            elif tool_name == "send_document_reminders":
                suggested_actions.append({
                    "label": "Send WhatsApp Document Expiration Notices",
                    "actionType": "send_document_reminders",
                    "payload": { "days_threshold": 30 },
                    "requiresConfirmation": True
                })

        # 5. Record to tenant-isolated memory
        tenant_memory.append_interaction(clean_org_id, "user_active", query, natural_response)

        return {
            "id": f"ai_resp_{int(time.time()*1000)}",
            "role": "assistant",
            "agentName": agent_name,
            "content": natural_response,
            "intent": intent,
            "reasoning": {
                "thought": thought,
                "plan": plan_steps,
                "planned_tools": [t.get("name") for t in planned_tools]
            },
            "suggestedActions": suggested_actions,
            "engine": "VRYS Local LLM Reasoning Brain (Step 2)",
            "model_telemetry": {
                "llm_runtime": "Local Open-Weight Model Engine (Ollama/vLLM/AST)",
                "active_tenant_id": clean_org_id,
                "isolation_guarantee": "Multi-Layer Enforced"
            }
        }

import time
orchestrator = MultiAgentOrchestrator()
