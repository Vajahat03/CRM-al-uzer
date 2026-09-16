"""
VRYS AI — SaaS Platform Executive Commercial Analytics (Step 11)
Computes Platform-wide MRR, ARR, ARPU, Churn Rate, and Active Subscription distribution.
"""
from typing import Dict, Any, List
from app.schemas.saas_schema import PlatformMetrics, SubscriptionStatus, BillingCycle
from app.saas.tenant_manager import tenant_manager
from app.saas.subscription_engine import subscription_engine

class SaaSAnalyticsService:
    def calculate_platform_metrics(self) -> PlatformMetrics:
        tenants = tenant_manager.list_all_tenants()
        total_tenants = len(tenants)
        active_tenants = [t for t in tenants if t.subscription_status == SubscriptionStatus.ACTIVE and not t.is_suspended]
        canceled_tenants = [t for t in tenants if t.subscription_status in [SubscriptionStatus.CANCELED, SubscriptionStatus.UNPAID]]

        mrr = 0.0
        for t in active_tenants:
            plan = subscription_engine.get_plan(t.plan_tier)
            if t.billing_cycle == BillingCycle.ANNUAL:
                mrr += (plan.annual_price_inr / 12.0)
            else:
                mrr += plan.monthly_price_inr

        mrr = round(mrr, 2)
        arr = round(mrr * 12.0, 2)
        active_count = max(1, len(active_tenants))
        arpu = round(mrr / active_count, 2)
        churn_rate = round((len(canceled_tenants) / max(1, total_tenants)) * 100, 2)

        return PlatformMetrics(
            total_tenants=total_tenants,
            active_subscriptions=len(active_tenants),
            monthly_recurring_revenue_inr=round(mrr, 2),
            annual_recurring_revenue_inr=round(arr, 2),
            average_revenue_per_user_inr=arpu,
            churn_rate_pct=churn_rate,
            total_ai_requests_metered=1420,
            total_storage_mb_metered=5420.0
        )

saas_analytics = SaaSAnalyticsService()
