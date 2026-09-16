"""
VRYS AI — Multi-Tenant Organization Lifecycle Manager (Step 11)
Governs organization provisioning, plan upgrades, suspension, and tenant security.
"""
from typing import Dict, Any, List, Optional
import time
import uuid
from app.schemas.saas_schema import TenantOrganization, PlanTier, SubscriptionStatus, BillingCycle

class TenantLifecycleManager:
    def __init__(self):
        self._tenants: Dict[str, TenantOrganization] = {}
        self._seed_default_tenants()

    def _seed_default_tenants(self):
        al_uzer = TenantOrganization(
            organization_id="org_aluzer",
            company_name="Al Uzer Document Services",
            owner_email="vajahat@aluzer.com",
            plan_tier=PlanTier.ENTERPRISE,
            subscription_status=SubscriptionStatus.ACTIVE,
            billing_cycle=BillingCycle.ANNUAL,
            subscription_expires_at=time.time() + 31536000 # 1 year
        )
        self._tenants[al_uzer.organization_id] = al_uzer

    def provision_tenant(
        self,
        company_name: str,
        owner_email: str,
        plan_tier: PlanTier = PlanTier.STARTER,
        billing_cycle: BillingCycle = BillingCycle.MONTHLY
    ) -> TenantOrganization:
        """
        Provisions a new tenant with a 14-day trial.
        """
        org_id = f"org_{uuid.uuid4().hex[:8]}"
        trial_duration = 14 * 86400 # 14 days
        tenant = TenantOrganization(
            organization_id=org_id,
            company_name=company_name,
            owner_email=owner_email,
            plan_tier=plan_tier,
            subscription_status=SubscriptionStatus.TRIALING,
            billing_cycle=billing_cycle,
            subscription_expires_at=time.time() + trial_duration
        )
        self._tenants[org_id] = tenant
        return tenant

    def get_tenant(self, org_id: str) -> Optional[TenantOrganization]:
        return self._tenants.get(org_id)

    def suspend_tenant(self, org_id: str, reason: str) -> Dict[str, Any]:
        """
        Suspends tenant access across all microservices.
        """
        tenant = self._tenants.get(org_id)
        if not tenant:
            return {"status": "ERROR", "message": "Tenant not found"}
        tenant.is_suspended = True
        tenant.suspension_reason = reason
        tenant.subscription_status = SubscriptionStatus.PAUSED
        return {"status": "SUSPENDED", "organization_id": org_id, "reason": reason}

    def reactivate_tenant(self, org_id: str) -> Dict[str, Any]:
        """
        Reactivates a suspended tenant.
        """
        tenant = self._tenants.get(org_id)
        if not tenant:
            return {"status": "ERROR", "message": "Tenant not found"}
        tenant.is_suspended = False
        tenant.suspension_reason = None
        tenant.subscription_status = SubscriptionStatus.ACTIVE
        return {"status": "ACTIVE", "organization_id": org_id}

    def list_all_tenants(self) -> List[TenantOrganization]:
        return list(self._tenants.values())

tenant_manager = TenantLifecycleManager()
