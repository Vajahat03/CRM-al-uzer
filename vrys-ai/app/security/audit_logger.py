"""
VRYS AI — Production AI Audit Logger & Schema Validator (Step 5.5)
Records every AI reasoning plan, tool dispatch, confirmation, and outcome with tenant isolation.
"""
from typing import Dict, Any, List, Optional
import json
import time
import os

class AIAuditLogger:
    def __init__(self, log_dir: str = "vrys-ai/logs"):
        self.log_dir = log_dir
        os.makedirs(log_dir, exist_ok=True)
        self.log_file = os.path.join(log_dir, "ai_audit_trail.jsonl")

    def log_event(
        self,
        org_id: str,
        user_name: str,
        user_prompt: str,
        intent: str,
        plan_summary: str,
        tools_invoked: List[str],
        confirmed_by_human: bool,
        execution_status: str
    ):
        event = {
            "timestamp": time.time(),
            "datetime": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
            "organization_id": org_id,
            "user_name": user_name,
            "user_prompt": user_prompt,
            "intent": intent,
            "plan_summary": plan_summary,
            "tools_invoked": tools_invoked,
            "confirmed_by_human": confirmed_by_human,
            "execution_status": execution_status
        }

        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(event, ensure_ascii=False) + "\n")

        return event

    def get_tenant_audit_logs(self, org_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Retrieves audit logs strictly filtered by authorized organization ID."""
        if not os.path.exists(self.log_file):
            return []

        tenant_logs = []
        with open(self.log_file, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip():
                    item = json.loads(line)
                    if item.get("organization_id") == org_id:
                        tenant_logs.append(item)

        return tenant_logs[-limit:]

audit_logger = AIAuditLogger()
