"""
VRYS AI — Real-Time Usage Quota Metering (Step 11)
Enforces strict usage limits on AI tokens, WhatsApp dispatches, Storage MBs, and User seats.
"""
from typing import Dict, Any, Optional
from app.schemas.saas_schema import QuotaUsage, PlanTier
from app.saas.tenant_manager import tenant_manager
from app.saas.subscription_engine import subscription_engine

class QuotaMeteringService:
    def __init__(self):
        self._quotas: Dict[str, QuotaUsage] = {}

    def get_or_create_quota(self, org_id: str) -> QuotaUsage:
        if org_id not in self._quotas:
            tenant = tenant_manager.get_tenant(org_id)
            tier = tenant.plan_tier if tenant else PlanTier.STARTER
            plan = subscription_engine.get_plan(tier)

            self._quotas[org_id] = QuotaUsage(
                organization_id=org_id,
                ai_requests_limit=plan.max_ai_requests_per_month,
                whatsapp_messages_limit=plan.max_whatsapp_messages_per_month,
                storage_mb_limit=float(plan.max_storage_mb),
                user_seats_limit=plan.max_user_seats,
                active_workflows_limit=plan.max_active_workflows
            )
        return self._quotas[org_id]

    def check_and_consume_ai_request(self, org_id: str, count: int = 1) -> Dict[str, Any]:
        """
        Validates AI request quota before dispatching LLM calls.
        """
        quota = self.get_or_create_quota(org_id)
        if quota.ai_requests_used + count > quota.ai_requests_limit:
            return {
                "allowed": False,
                "status": "QUOTA_EXCEEDED",
                "resource": "AI_REQUESTS",
                "used": quota.ai_requests_used,
                "limit": quota.ai_requests_limit,
                "message": "Monthly AI request quota exceeded. Please upgrade your plan."
            }

        quota.ai_requests_used += count
        return {
            "allowed": True,
            "status": "CONSUMED",
            "remaining": quota.ai_requests_limit - quota.ai_requests_used
        }

    def check_storage_quota(self, org_id: str, additional_mb: float) -> Dict[str, Any]:
        quota = self.get_or_create_quota(org_id)
        if quota.storage_mb_used + additional_mb > quota.storage_mb_limit:
            return {
                "allowed": False,
                "status": "STORAGE_QUOTA_EXCEEDED",
                "used_mb": quota.storage_mb_used,
                "limit_mb": quota.storage_mb_limit
            }
        quota.storage_mb_used += additional_mb
        return {"allowed": True, "remaining_mb": quota.storage_mb_limit - quota.storage_mb_used}

    def check_user_seat_quota(self, org_id: str) -> Dict[str, Any]:
        quota = self.get_or_create_quota(org_id)
        if quota.user_seats_used >= quota.user_seats_limit:
            return {"allowed": False, "status": "SEAT_LIMIT_REACHED"}
        quota.user_seats_used += 1
        return {"allowed": True, "user_seats_used": quota.user_seats_used}

quota_service = QuotaMeteringService()
