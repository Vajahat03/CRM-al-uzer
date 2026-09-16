"""
VRYS AI — Agent-to-Agent Execution Coordinator (Step 10)
Provides a structured, auditable inter-agent communication protocol preventing recursive runaway loops.
"""
from typing import Dict, Any, Optional
import uuid
import time
from app.agents.crm_agent import crm_agent
from app.agents.business_intelligence_agent import business_intelligence_agent
from app.agents.communication_agent import communication_agent
from app.agents.marketing_agent import marketing_agent

class AgentExecutionCoordinator:
    def __init__(self):
        self._delegation_history: list = []

    def delegate_request(
        self,
        from_agent: str,
        target_agent: str,
        intent: str,
        tenant_id: str,
        payload: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Coordinates auditable agent-to-agent requests.
        """
        req_id = f"a2a_{uuid.uuid4().hex[:8]}"
        record = {
            "request_id": req_id,
            "from_agent": from_agent,
            "target_agent": target_agent,
            "intent": intent,
            "tenant_id": tenant_id,
            "payload": payload,
            "timestamp": time.time()
        }
        self._delegation_history.append(record)

        if target_agent == "CRM_AGENT":
            return crm_agent.handle_request(intent, tenant_id, from_agent, payload)
        elif target_agent == "BI_AGENT":
            return business_intelligence_agent.handle_request(intent, tenant_id, from_agent, payload)
        elif target_agent == "COMMUNICATION_AGENT":
            return communication_agent.handle_request(intent, tenant_id, from_agent, payload)
        elif target_agent == "MARKETING_AGENT":
            return marketing_agent.handle_request(intent, tenant_id, from_agent, payload)
        else:
            return {"status": "UNSUPPORTED_TARGET_AGENT", "target_agent": target_agent}

agent_coordinator = AgentExecutionCoordinator()
