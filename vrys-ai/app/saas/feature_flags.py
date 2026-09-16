"""
VRYS AI — Plan-Based Feature Flag Engine (Step 11)
Gates capabilities based on the tenant's active subscription plan.
"""
from typing import Dict, Any, List
from app.schemas.saas_schema import PlanTier
from app.saas.tenant_manager import tenant_manager
from app.saas.subscription_engine import subscription_engine

class FeatureFlagEngine:
    def is_feature_enabled(self, org_id: str, feature_key: str) -> bool:
        """
        Checks if a specific feature is enabled for the organization.
        """
        tenant = tenant_manager.get_tenant(org_id)
        if not tenant or tenant.is_suspended:
            return False

        plan = subscription_engine.get_plan(tenant.plan_tier)
        return feature_key in plan.features_enabled

    def get_tenant_feature_matrix(self, org_id: str) -> List[str]:
        tenant = tenant_manager.get_tenant(org_id)
        if not tenant:
            return []
        plan = subscription_engine.get_plan(tenant.plan_tier)
        return plan.features_enabled

feature_flag_engine = FeatureFlagEngine()
