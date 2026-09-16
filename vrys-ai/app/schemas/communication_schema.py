"""
VRYS AI — Message & Workflow Schemas (Step 8)
Defines strict Pydantic contracts for outbound messages, communication states,
event triggers, and workflow execution pipelines.
"""
from typing import Dict, Any, List, Optional
from enum import Enum
from pydantic import BaseModel, Field
import time

class MessageStatus(str, Enum):
    QUEUED = "QUEUED"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED"
    APPROVED = "APPROVED"
    SENT = "SENT"
    DELIVERED = "DELIVERED"
    READ = "READ"
    REPLIED = "REPLIED"
    FAILED = "FAILED"

class ChannelType(str, Enum):
    WHATSAPP = "WHATSAPP"
    EMAIL = "EMAIL"
    SMS = "SMS"
    CRM_INTERNAL = "CRM_INTERNAL"

class OutboundMessage(BaseModel):
    message_id: str
    organization_id: str
    customer_id: str
    customer_name: str
    recipient_phone_or_email: str
    channel: ChannelType
    content: str
    template_variables: Dict[str, Any] = Field(default_factory=dict)
    status: MessageStatus = MessageStatus.APPROVAL_REQUIRED
    requires_approval: bool = True
    idempotency_key: str
    timestamp: float = Field(default_factory=time.time)
    retry_count: int = 0
    failure_reason: Optional[str] = None

class WorkflowDefinition(BaseModel):
    workflow_id: str
    name: str
    organization_id: str
    trigger_event: str # e.g. "lead.created", "invoice.overdue", "job.stuck"
    conditions: List[Dict[str, Any]] = Field(default_factory=list) # e.g. [{"field": "score", "op": ">=", "val": 80}]
    actions: List[Dict[str, Any]] = Field(default_factory=list) # e.g. [{"action": "create_task"}, {"action": "send_whatsapp"}]
    requires_approval: bool = True
    escalation_timeout_hours: int = 24
    is_active: bool = True
