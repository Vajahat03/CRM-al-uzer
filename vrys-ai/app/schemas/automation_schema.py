"""
VRYS AI — Event & Automation Schemas (Step 10)
Defines standardized contracts for Business Events, Workflow State Transitions,
Execution Traces, and Human Approval Records.
"""
from typing import Dict, Any, List, Optional, Union
from enum import Enum
from pydantic import BaseModel, Field
import time
import uuid

class EventType(str, Enum):
    LEAD_CREATED = "lead.created"
    LEAD_STATUS_CHANGED = "lead.status_changed"
    CUSTOMER_CREATED = "customer.created"
    JOB_STUCK_5_DAYS = "job.stuck_5_days"
    JOB_COMPLETED = "job.completed"
    INVOICE_CREATED = "invoice.created"
    INVOICE_OVERDUE = "invoice.overdue"
    PAYMENT_RECEIVED = "payment.received"
    MESSAGE_RECEIVED = "message.received"
    CAMPAIGN_CPL_SPIKE = "campaign.cpl_spike"
    DOCUMENT_EXPIRING = "document.expiring"

class WorkflowExecutionState(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    TRIGGERED = "TRIGGERED"
    RUNNING = "RUNNING"
    WAITING = "WAITING"
    APPROVAL_REQUIRED = "APPROVAL_REQUIRED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"

class BusinessEvent(BaseModel):
    event_id: str = Field(default_factory=lambda: f"evt_{uuid.uuid4().hex[:12]}")
    event_type: EventType
    tenant_id: str
    entity_type: str # e.g. "lead", "invoice", "job", "campaign"
    entity_id: str
    timestamp: float = Field(default_factory=time.time)
    source: str = "system"
    payload: Dict[str, Any] = Field(default_factory=dict)
    idempotency_token: str

class StepExecutionTrace(BaseModel):
    step_id: str
    action_type: str
    timestamp: float = Field(default_factory=time.time)
    status: str # SUCCESS, FAILED, PENDING_APPROVAL, WAITING
    input_payload: Dict[str, Any] = Field(default_factory=dict)
    output_result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None

class WorkflowExecutionTrace(BaseModel):
    execution_id: str = Field(default_factory=lambda: f"exec_{uuid.uuid4().hex[:12]}")
    workflow_id: str
    tenant_id: str
    initial_event_id: str
    state: WorkflowExecutionState = WorkflowExecutionState.TRIGGERED
    started_at: float = Field(default_factory=time.time)
    completed_at: Optional[float] = None
    steps_executed: List[StepExecutionTrace] = Field(default_factory=list)
    approval_record: Optional[Dict[str, Any]] = None

class ApprovalRecord(BaseModel):
    approval_id: str = Field(default_factory=lambda: f"appr_{uuid.uuid4().hex[:8]}")
    tenant_id: str
    execution_id: str
    workflow_id: str
    action_type: str
    requested_by: str = "AI_AUTOMATION_ENGINE"
    requested_at: float = Field(default_factory=time.time)
    approved_by: Optional[str] = None
    approved_at: Optional[float] = None
    status: str = "PENDING" # PENDING, APPROVED, REJECTED
    reason: Optional[str] = None
    payload: Dict[str, Any] = Field(default_factory=dict)
