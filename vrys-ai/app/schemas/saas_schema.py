"""
VRYS AI — SaaS Governance, Billing & Security Schemas (Step 11)
Defines strict Pydantic contracts for Multi-Tenant Organizations, Subscription Plans,
Usage Quota Meters, Feature Flags, API Key Credentials, and Platform Commercial Metrics.
"""
from typing import Dict, Any, List, Optional
from enum import Enum
from pydantic import BaseModel, Field
import time
import uuid

class PlanTier(str, Enum):
    STARTER = "STARTER"
    GROWTH = "GROWTH"
    ENTERPRISE = "ENTERPRISE"
    CUSTOM = "CUSTOM"

class SubscriptionStatus(str, Enum):
    TRIALING = "TRIALING"
    ACTIVE = "ACTIVE"
    PAST_DUE = "PAST_DUE"
    CANCELED = "CANCELED"
    UNPAID = "UNPAID"
    PAUSED = "PAUSED"

class BillingCycle(str, Enum):
    MONTHLY = "MONTHLY"
    ANNUAL = "ANNUAL"

class SubscriptionPlan(BaseModel):
    plan_id: str
    name: str
    tier: PlanTier
    monthly_price_inr: float
    annual_price_inr: float # With 20% discount
    max_user_seats: int
    max_ai_requests_per_month: int
    max_whatsapp_messages_per_month: int
    max_storage_mb: int
    max_active_workflows: int
    features_enabled: List[str]

class TenantOrganization(BaseModel):
    organization_id: str
    company_name: str
    owner_email: str
    plan_tier: PlanTier = PlanTier.STARTER
    subscription_status: SubscriptionStatus = SubscriptionStatus.TRIALING
    billing_cycle: BillingCycle = BillingCycle.MONTHLY
    created_at: float = Field(default_factory=time.time)
    subscription_expires_at: float
    is_suspended: bool = False
    suspension_reason: Optional[str] = None
    custom_metadata: Dict[str, Any] = Field(default_factory=dict)

class QuotaUsage(BaseModel):
    organization_id: str
    ai_requests_used: int = 0
    ai_requests_limit: int = 500
    whatsapp_messages_used: int = 0
    whatsapp_messages_limit: int = 1000
    storage_mb_used: float = 0.0
    storage_mb_limit: float = 5000.0
    user_seats_used: int = 1
    user_seats_limit: int = 5
    active_workflows_used: int = 0
    active_workflows_limit: int = 3

class ApiKeyRecord(BaseModel):
    key_id: str = Field(default_factory=lambda: f"key_{uuid.uuid4().hex[:8]}")
    organization_id: str
    name: str
    hashed_token: str
    scopes: List[str]
    created_at: float = Field(default_factory=time.time)
    expires_at: Optional[float] = None
    is_revoked: bool = False

class PlatformMetrics(BaseModel):
    total_tenants: int
    active_subscriptions: int
    monthly_recurring_revenue_inr: float
    annual_recurring_revenue_inr: float
    average_revenue_per_user_inr: float
    churn_rate_pct: float
    total_ai_requests_metered: int
    total_storage_mb_metered: float
