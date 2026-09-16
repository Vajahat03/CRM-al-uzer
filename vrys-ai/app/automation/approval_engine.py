"""
VRYS AI — Centralized Approval Engine (Step 10)
Manages human-in-the-loop approvals for financial mutations, marketing budgets,
bulk WhatsApp dispatches, and records decision audit logs.
"""
from typing import Dict, Any, List, Optional
import time
import uuid
from app.schemas.automation_schema import ApprovalRecord

class ApprovalEngine:
    def __init__(self):
        self._approvals: Dict[str, ApprovalRecord] = {}

    def request_approval(
        self,
        tenant_id: str,
        execution_id: str,
        workflow_id: str,
        action_type: str,
        payload: Dict[str, Any],
        reason: str = "Automated high-impact action requires owner confirmation"
    ) -> ApprovalRecord:
        """
        Creates a pending approval record.
        """
        record = ApprovalRecord(
            approval_id=f"appr_{uuid.uuid4().hex[:8]}",
            tenant_id=tenant_id,
            execution_id=execution_id,
            workflow_id=workflow_id,
            action_type=action_type,
            requested_at=time.time(),
            status="PENDING",
            reason=reason,
            payload=payload
        )
        self._approvals[record.approval_id] = record
        return record

    def resolve_approval(self, approval_id: str, approved: bool, user_name: str, tenant_id: str) -> Optional[ApprovalRecord]:
        """
        Resolves an approval (APPROVED or REJECTED) with tenant verification.
        """
        record = self._approvals.get(approval_id)
        if not record or record.tenant_id != tenant_id:
            return None

        record.status = "APPROVED" if approved else "REJECTED"
        record.approved_by = user_name
        record.approved_at = time.time()
        return record

    def get_pending_approvals(self, tenant_id: str) -> List[ApprovalRecord]:
        """
        Lists pending approvals strictly isolated by tenant.
        """
        return [a for a in self._approvals.values() if a.tenant_id == tenant_id and a.status == "PENDING"]

approval_engine = ApprovalEngine()
