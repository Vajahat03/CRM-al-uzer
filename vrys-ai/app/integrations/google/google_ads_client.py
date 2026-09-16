"""
VRYS AI — Google Ads API Client (Step 9)
Pulls Google Search and Performance Max campaigns, keywords, impressions, CPC, and conversion metrics.
"""
from typing import Dict, Any, List
from app.schemas.marketing_schema import AdPlatform, CampaignRecord

class GoogleAdsClient:
    def __init__(self):
        self.mock_campaigns = [
            {
                "campaign_id": "goog_cmp_201",
                "name": "Google Search — Urgent Passport & Visa Near Me",
                "platform": AdPlatform.GOOGLE_ADS,
                "status": "ACTIVE",
                "daily_budget": 1200.0,
                "total_spend": 18000.0,
                "impressions": 42100,
                "clicks": 2180,
                "ctr": 5.18,
                "cpc": 8.26,
                "leads_count": 140,
                "cpl": 128.57,
                "paying_customers_count": 14,
                "conversion_rate_pct": 10.00,
                "invoiced_revenue": 72000.0,
                "collected_revenue": 68000.0,
                "revenue_roas": 4.00,
                "collected_roas": 3.78
            }
        ]

    def get_campaigns(self, org_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves Google Ads campaigns for the authenticated tenant.
        """
        return [{**c, "organization_id": org_id} for c in self.mock_campaigns]

google_ads_client = GoogleAdsClient()
