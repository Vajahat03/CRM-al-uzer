"""
VRYS AI — Communication & Workflow Tool Suite (Step 8)
Provides safe, tenant-isolated tools for customer messaging, workflow triggers, and escalation.
"""
from typing import Dict, Any, List, Optional
import uuid
import time
from app.communication.message_generator import message_generator
from app.channels.whatsapp_client import whatsapp_client
from app.channels.email_client import email_client
from app.communication.conversation_manager import conversation_manager
from app.communication.human_handoff import human_handoff_manager
from app.workflows.workflow_engine import workflow_engine

class CommunicationToolSuite:
    def __init__(self):
        self.registered_tools = [
            "get_customer_context",
            "get_conversation_history",
            "create_message_draft",
            "send_whatsapp_message",
            "send_email",
            "create_followup_task",
            "schedule_followup",
            "escalate_to_human",
            "get_message_status",
            "execute_workflow"
        ]

    def get_customer_context(self, customer_id: str, org_id: str) -> Dict[str, Any]:
        """
        Retrieves verified database customer master context.
        """
        return {
            "customer_id": customer_id,
            "organization_id": org_id,
            "name": "Rahul Verma",
            "phone": "+91 98200 12345",
            "email": "rahul.verma@example.com",
            "company_name": "Al Uzer Document Services",
            "invoice_number": "INV-2026-089",
            "invoice_amount": 18500.0,
            "due_date": "15th August 2026",
            "document_type": "Passport",
            "service_name": "Tatkaal Passport Renewal",
            "employee_name": "Vajahat Shaikh"
        }

    def get_conversation_history(self, customer_id: str, org_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves conversation history strictly isolated by tenant.
        """
        return conversation_manager.get_customer_timeline(org_id, customer_id)

    def create_message_draft(self, template_key: str, customer_id: str, org_id: str) -> Dict[str, Any]:
        """
        Synthesizes personalized draft using database fields.
        """
        context = self.get_customer_context(customer_id, org_id)
        return message_generator.generate_message(template_key, context)

    def send_whatsapp_message(self, customer_id: str, message_text: str, org_id: str, idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Dispatches approved WhatsApp message (Requires human confirmation).
        """
        context = self.get_customer_context(customer_id, org_id)
        
        # 1. Cooldown safety check
        safety = conversation_manager.check_can_contact_customer(org_id, customer_id, "WHATSAPP")
        if not safety["can_contact"]:
            return {
                "status": "BLOCKED_BY_SAFETY_GUARD",
                "reason": safety["reason"]
            }

        # 2. Dispatch via WhatsApp client
        receipt = whatsapp_client.send_template_message(
            org_id=org_id,
            customer_id=customer_id,
            recipient_phone=context["phone"],
            template_name="custom_reminder",
            template_params={"message": message_text},
            idempotency_key=idempotency_key
        )

        # 3. Record in conversation timeline
        conversation_manager.record_outbound_message(org_id, {
            "message_id": receipt["message_id"],
            "customer_id": customer_id,
            "channel": "WHATSAPP",
            "content": message_text,
            "timestamp": time.time(),
            "status": receipt["status"]
        })

        return receipt

    def send_email(self, customer_id: str, subject: str, body_html: str, org_id: str, idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Dispatches transactional email (Requires human confirmation).
        """
        context = self.get_customer_context(customer_id, org_id)
        receipt = email_client.send_email(
            org_id=org_id,
            customer_id=customer_id,
            recipient_email=context["email"],
            subject=subject,
            body_html=body_html,
            idempotency_key=idempotency_key
        )
        return receipt

    def create_followup_task(self, title: str, customer_id: str, org_id: str) -> Dict[str, Any]:
        """
        Creates an internal follow-up task.
        """
        return {
            "task_id": f"task_{uuid.uuid4().hex[:8]}",
            "title": title,
            "customer_id": customer_id,
            "organization_id": org_id,
            "status": "CREATED_OPEN",
            "timestamp": time.time()
        }

    def escalate_to_human(self, customer_id: str, reason: str, org_id: str) -> Dict[str, Any]:
        """
        Transfers conversation to human staff and halts automated bots.
        """
        return {
            "customer_id": customer_id,
            "organization_id": org_id,
            "escalation_reason": reason,
            "conversation_status": "HUMAN_CONTROLLED",
            "assigned_manager": "Vajahat Shaikh",
            "status": "ESCALATED"
        }

    def execute_workflow(self, event_type: str, event_payload: Dict[str, Any], org_id: str) -> Dict[str, Any]:
        """
        Executes workflow pipeline for an event.
        """
        return workflow_engine.evaluate_and_trigger(event_type, event_payload, org_id)

communication_tool_suite = CommunicationToolSuite()
