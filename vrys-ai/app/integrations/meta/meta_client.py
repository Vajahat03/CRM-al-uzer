"""
VRYS AI — Meta Graph & Ads API Client (Step 9)
Pulls normalized campaigns, ad sets, spend, CTR, CPL, Facebook page and Instagram business metrics.
"""
from typing import Dict, Any, List, Optional
from app.schemas.marketing_schema import AdPlatform, CampaignRecord

class MetaClient:
    def __init__(self):
        self.mock_campaigns = [
            {
                "campaign_id": "meta_cmp_101",
                "name": "Summer Passport & Visa Offer",
                "platform": AdPlatform.META_ADS,
                "status": "ACTIVE",
                "daily_budget": 1500.0,
                "total_spend": 25000.0,
                "impressions": 84200,
                "clicks": 3120,
                "ctr": 3.71,
                "cpc": 8.01,
                "leads_count": 320,
                "cpl": 78.12,
                "paying_customers_count": 27,
                "conversion_rate_pct": 8.44,
                "invoiced_revenue": 180000.0,
                "collected_revenue": 165000.0,
                "revenue_roas": 7.20,
                "collected_roas": 6.60
            },
            {
                "campaign_id": "meta_cmp_102",
                "name": "Corporate GST & Trade License Retargeting",
                "platform": AdPlatform.META_ADS,
                "status": "ACTIVE",
                "daily_budget": 800.0,
                "total_spend": 10000.0,
                "impressions": 28400,
                "clicks": 1420,
                "ctr": 5.00,
                "cpc": 7.04,
                "leads_count": 95,
                "cpl": 105.26,
                "paying_customers_count": 11,
                "conversion_rate_pct": 11.58,
                "invoiced_revenue": 95000.0,
                "collected_revenue": 90000.0,
                "revenue_roas": 9.50,
                "collected_roas": 9.00
            }
        ]

    def get_campaigns(self, org_id: str) -> List[Dict[str, Any]]:
        """
        Retrieves Meta Ads campaigns for the authenticated tenant.
        """
        return [{**c, "organization_id": org_id} for c in self.mock_campaigns]

    def get_instagram_insights(self, org_id: str) -> Dict[str, Any]:
        """
        Retrieves Instagram Business statistics: reach, impressions, follower growth, reel views.
        """
        return {
            "organization_id": org_id,
            "account_handle": "@vrys_documents",
            "followers": 14250,
            "monthly_reach": 98400,
            "impressions": 245000,
            "reels_views": 184000,
            "engagement_rate_pct": 4.82,
            "inbound_dm_inquiries": 86
        }

meta_client = MetaClient()
