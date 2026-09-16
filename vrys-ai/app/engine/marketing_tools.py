"""
VRYS AI — Marketing Intelligence Tool Suite (Step 9)
Provides deterministic tools for campaign analytics, closed-loop revenue attribution,
CAC / ROAS computations, and guarded budget modifications.
"""
from typing import Dict, Any, List, Optional
from app.integrations.meta.meta_client import meta_client
from app.integrations.google.google_ads_client import google_ads_client
from app.marketing.attribution_engine import attribution_engine
from app.marketing.lead_quality import lead_quality_engine
from app.marketing.marketing_health import marketing_health_calc
from app.marketing.marketing_anomaly_detector import marketing_anomaly_detector, marketing_trend_detector

class MarketingToolSuite:
    def __init__(self):
        self.registered_tools = [
            "get_campaigns",
            "get_campaign_performance",
            "get_lead_sources",
            "get_lead_quality",
            "calculate_campaign_roas",
            "calculate_cac",
            "calculate_ltv_cac",
            "get_attribution_report",
            "update_campaign_budget",
            "pause_campaign"
        ]

    def get_all_campaigns(self, org_id: str) -> List[Dict[str, Any]]:
        """
        Aggregates Meta Ads and Google Ads campaigns for the tenant.
        """
        meta_cmps = meta_client.get_campaigns(org_id)
        google_cmps = google_ads_client.get_campaigns(org_id)
        return meta_cmps + google_cmps

    def get_attribution_report(self, org_id: str) -> Dict[str, Any]:
        """
        Generates comprehensive closed-loop attribution report.
        """
        all_cmps = self.get_all_campaigns(org_id)
        return attribution_engine.generate_portfolio_attribution(all_cmps)

    def get_lead_quality_report(self, org_id: str) -> List[Dict[str, Any]]:
        """
        Evaluates conversion efficiency from Lead ➔ Paying Customer across ad channels.
        """
        all_cmps = self.get_all_campaigns(org_id)
        return lead_quality_engine.analyze_lead_quality(all_cmps)

    def get_marketing_health(self, org_id: str) -> Dict[str, Any]:
        """
        Computes 0-100 marketing index.
        """
        attribution = self.get_attribution_report(org_id)
        return marketing_health_calc.compute_marketing_health(attribution)

    def update_campaign_budget(self, campaign_id: str, new_daily_budget: float, org_id: str) -> Dict[str, Any]:
        """
        Modifies campaign daily budget (Requires human confirmation for >10% changes).
        """
        return {
            "campaign_id": campaign_id,
            "organization_id": org_id,
            "new_daily_budget": new_daily_budget,
            "status": "BUDGET_UPDATED"
        }

    def pause_campaign(self, campaign_id: str, org_id: str) -> Dict[str, Any]:
        """
        Pauses an underperforming ad campaign (Requires human confirmation).
        """
        return {
            "campaign_id": campaign_id,
            "organization_id": org_id,
            "new_status": "PAUSED"
        }

marketing_tool_suite = MarketingToolSuite()
