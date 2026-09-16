"""
VRYS AI — SaaS Subscription & Billing Engine (Step 11)
Calculates plan pricing, annual discounts, subscription transitions, and invoice handling.
"""
from typing import Dict, Any, List, Optional
import time
from app.schemas.saas_schema import PlanTier, BillingCycle, SubscriptionPlan, SubscriptionStatus
from app.saas.tenant_manager import tenant_manager

class SubscriptionEngine:
    def __init__(self):
        self._plans: Dict[PlanTier, SubscriptionPlan] = self._init_plans()

    def _init_plans(self) -> Dict[PlanTier, SubscriptionPlan]:
        return {
            PlanTier.STARTER: SubscriptionPlan(
                plan_id="plan_starter",
                name="Starter Plan",
                tier=PlanTier.STARTER,
                monthly_price_inr=2499.0,
                annual_price_inr=23990.0, # ~20% discount (₹1,999/mo)
                max_user_seats=3,
                max_ai_requests_per_month=500,
                max_whatsapp_messages_per_month=1000,
                max_storage_mb=5000, # 5 GB
                max_active_workflows=3,
                features_enabled=["CRM_CORE", "INVOICING", "AI_COPILOT"]
            ),
            PlanTier.GROWTH: SubscriptionPlan(
                plan_id="plan_growth",
                name="Growth Plan",
                tier=PlanTier.GROWTH,
                monthly_price_inr=6999.0,
                annual_price_inr=67190.0, # ~20% discount (₹5,599/mo)
                max_user_seats=10,
                max_ai_requests_per_month=2500,
                max_whatsapp_messages_per_month=5000,
                max_storage_mb=25000, # 25 GB
                max_active_workflows=15,
                features_enabled=["CRM_CORE", "INVOICING", "AI_COPILOT", "AUTONOMOUS_CRM", "COMMUNICATION_AGENT", "EVENT_WORKFLOWS"]
            ),
            PlanTier.ENTERPRISE: SubscriptionPlan(
                plan_id="plan_enterprise",
                name="Enterprise Scale",
                tier=PlanTier.ENTERPRISE,
                monthly_price_inr=19999.0,
                annual_price_inr=191990.0, # ~20% discount (₹15,999/mo)
                max_user_seats=100,
                max_ai_requests_per_month=20000,
                max_whatsapp_messages_per_month=50000,
                max_storage_mb=250000, # 250 GB
                max_active_workflows=100,
                features_enabled=[
                    "CRM_CORE", "INVOICING", "AI_COPILOT", "AUTONOMOUS_CRM",
                    "BI_AGENT", "COMMUNICATION_AGENT", "MARKETING_INTELLIGENCE",
                    "EVENT_WORKFLOWS", "CUSTOM_LLM_FINE_TUNING", "UNLIMITED_API_ACCESS"
                ]
            )
        }

    def get_plan(self, tier: PlanTier) -> SubscriptionPlan:
        return self._plans[tier]

    def calculate_billing_amount(self, tier: PlanTier, cycle: BillingCycle) -> float:
        """
        Calculates exact billing charge in INR.
        """
        plan = self.get_plan(tier)
        return plan.annual_price_inr if cycle == BillingCycle.ANNUAL else plan.monthly_price_inr

    def handle_payment_success(self, org_id: str, amount_paid: float, cycle: BillingCycle) -> Dict[str, Any]:
        """
        Activates or renews subscription after successful gateway payment.
        """
        tenant = tenant_manager.get_tenant(org_id)
        if not tenant:
            return {"status": "ERROR", "message": "Tenant not found"}

        extension_sec = 31536000 if cycle == BillingCycle.ANNUAL else 2592000 # 30 days
        tenant.subscription_status = SubscriptionStatus.ACTIVE
        tenant.billing_cycle = cycle
        tenant.subscription_expires_at = time.time() + extension_sec
        tenant.is_suspended = False

        return {
            "status": "SUCCESS",
            "organization_id": org_id,
            "subscription_status": tenant.subscription_status.value,
            "expires_at": tenant.subscription_expires_at
        }

    def handle_payment_failure(self, org_id: str, reason: str) -> Dict[str, Any]:
        """
        Transitions subscription to PAST_DUE on payment failure.
        """
        tenant = tenant_manager.get_tenant(org_id)
        if not tenant:
            return {"status": "ERROR", "message": "Tenant not found"}

        tenant.subscription_status = SubscriptionStatus.PAST_DUE
        return {
            "status": "PAST_DUE",
            "organization_id": org_id,
            "reason": reason
        }

    def upgrade_plan(self, org_id: str, target_tier: PlanTier) -> Dict[str, Any]:
        """
        Upgrades tenant plan tier.
        """
        tenant = tenant_manager.get_tenant(org_id)
        if not tenant:
            return {"status": "ERROR", "message": "Tenant not found"}

        tenant.plan_tier = target_tier
        return {
            "status": "UPGRADED",
            "organization_id": org_id,
            "new_plan": target_tier.value
        }

subscription_engine = SubscriptionEngine()
