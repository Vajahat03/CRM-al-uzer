"""
VRYS AI — Event-Driven Workflow Engine (Step 8)
Executes business automation pipelines: Lead Qualification ➔ Task Assignment ➔ WhatsApp Outreach,
and Overdue Invoice ➔ Finance Task ➔ WhatsApp Reminder.
"""
from typing import Dict, Any, List, Optional
import uuid
import time
from app.schemas.communication_schema import WorkflowDefinition
from app.communication.message_generator import message_generator
from app.channels.whatsapp_client import whatsapp_client
from app.communication.conversation_manager import conversation_manager
from app.workflows.retry_manager import retry_manager

class WorkflowEngine:
    def __init__(self):
        self.active_workflows: Dict[str, WorkflowDefinition] = {}
        self._register_default_workflows()

    def _register_default_workflows(self):
        # 1. Hot Lead Inbound Pipeline
        wf_lead = WorkflowDefinition(
            workflow_id="wf_hot_lead_inbound",
            name="Hot Lead Inbound Workflow",
            organization_id="default",
            trigger_event="lead.created",
            conditions=[{"field": "score", "op": ">=", "val": 80}],
            actions=[{"action": "create_task"}, {"action": "generate_whatsapp_draft"}],
            requires_approval=True
        )
        # 2. Overdue Invoice Recovery Pipeline
        wf_invoice = WorkflowDefinition(
            workflow_id="wf_overdue_invoice_recovery",
            name="Overdue Invoice Recovery Workflow",
            organization_id="default",
            trigger_event="invoice.overdue",
            conditions=[{"field": "days_overdue", "op": ">=", "val": 7}],
            actions=[{"action": "create_finance_task"}, {"action": "send_whatsapp_reminder"}],
            requires_approval=True
        )
        self.active_workflows[wf_lead.workflow_id] = wf_lead
        self.active_workflows[wf_invoice.workflow_id] = wf_invoice

    def evaluate_and_trigger(self, event_type: str, event_payload: Dict[str, Any], org_id: str) -> Dict[str, Any]:
        """
        Evaluates active workflows matching the event_type against conditional rules.
        """
        matching_wfs = [
            wf for wf in self.active_workflows.values()
            if wf.trigger_event == event_type and (wf.organization_id in [org_id, "default"]) and wf.is_active
        ]

        if not matching_wfs:
            return {
                "triggered": False,
                "reason": f"No active workflow found for event: {event_type}",
                "actions_executed": []
            }

        executed_actions = []
        for wf in matching_wfs:
            # Evaluate Conditions
            conditions_met = True
            for cond in wf.conditions:
                field = cond["field"]
                val = cond["val"]
                op = cond["op"]
                actual_val = event_payload.get(field, 0)
                if op == ">=" and actual_val < val:
                    conditions_met = False
                elif op == "==" and actual_val != val:
                    conditions_met = False

            if not conditions_met:
                continue

            # Execute Workflow Actions
            for act in wf.actions:
                act_name = act["action"]
                if act_name == "create_task" or act_name == "create_finance_task":
                    executed_actions.append({
                        "action": act_name,
                        "status": "COMPLETED",
                        "task_id": f"task_{uuid.uuid4().hex[:8]}",
                        "title": f"Automated Follow-up: {event_payload.get('name', 'Account')}"
                    })
                elif act_name == "generate_whatsapp_draft" or act_name == "send_whatsapp_reminder":
                    msg = message_generator.generate_message(
                        "PAYMENT_REMINDER" if "invoice" in event_type else "LEAD_FOLLOWUP",
                        event_payload
                    )
                    executed_actions.append({
                        "action": act_name,
                        "status": "APPROVAL_REQUIRED",
                        "requires_approval": wf.requires_approval,
                        "draft_preview": msg["rendered_content"],
                        "payload": event_payload
                    })

        return {
            "triggered": True,
            "workflows_matched": [wf.name for wf in matching_wfs],
            "actions_executed": executed_actions,
            "requires_human_approval": any(a.get("requires_approval", False) for a in executed_actions)
        }

workflow_engine = WorkflowEngine()
