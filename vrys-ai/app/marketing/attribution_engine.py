"""
VRYS AI — Closed-Loop Marketing Revenue Attribution Engine (Step 9)
Connects Ad Spend ➔ Leads ➔ Customers ➔ Invoices ➔ Collected Cash.
Calculates Revenue ROAS, Collected ROAS, Customer Acquisition Cost (CAC), and LTV/CAC ratios.
"""
from typing import Dict, Any, List
from app.schemas.marketing_schema import AttributionReport, AdPlatform

class AttributionEngine:
    def calculate_campaign_attribution(self, campaign: Dict[str, Any]) -> Dict[str, Any]:
        """
        Computes closed-loop financial attribution for a single campaign.
        """
        spend = max(1.0, campaign.get("total_spend", 0.0))
        leads = max(1, campaign.get("leads_count", 0))
        customers = campaign.get("paying_customers_count", 0)
        invoiced = campaign.get("invoiced_revenue", 0.0)
        collected = campaign.get("collected_revenue", 0.0)

        # 1. CAC Calculation (Cost per Acquired Paying Customer)
        cac = round(spend / max(1, customers), 2)

        # 2. Revenue ROAS vs Collected ROAS
        revenue_roas = round(invoiced / spend, 2)
        collected_roas = round(collected / spend, 2)

        # 3. LTV / CAC (Assuming average predicted LTV = ₹8,500)
        avg_ltv = 8500.0
        ltv_to_cac = round(avg_ltv / max(1.0, cac), 2)

        # 4. Profitability Classification
        if collected_roas >= 5.0:
            status = "HIGHLY_PROFITABLE_SCALE"
        elif collected_roas >= 2.5:
            status = "PROFITABLE"
        elif collected_roas >= 1.0:
            status = "BREAK_EVEN"
        else:
            status = "UNPROFITABLE_LEAKAGE"

        return {
            "organization_id": campaign.get("organization_id", "default"),
            "campaign_id": campaign.get("campaign_id", ""),
            "campaign_name": campaign.get("name", ""),
            "platform": campaign.get("platform", AdPlatform.META_ADS),
            "ad_spend": spend,
            "leads_generated": leads,
            "customers_acquired": customers,
            "customer_acquisition_cost": cac,
            "invoiced_revenue": invoiced,
            "collected_revenue": collected,
            "revenue_roas": revenue_roas,
            "collected_roas": collected_roas,
            "ltv_to_cac_ratio": ltv_to_cac,
            "profitability_status": status
        }

    def generate_portfolio_attribution(self, all_campaigns: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Synthesizes total portfolio attribution summary.
        """
        total_spend = sum(c.get("total_spend", 0.0) for c in all_campaigns)
        total_leads = sum(c.get("leads_count", 0) for c in all_campaigns)
        total_customers = sum(c.get("paying_customers_count", 0) for c in all_campaigns)
        total_invoiced = sum(c.get("invoiced_revenue", 0.0) for c in all_campaigns)
        total_collected = sum(c.get("collected_revenue", 0.0) for c in all_campaigns)

        portfolio_cac = round(total_spend / max(1, total_customers), 2)
        portfolio_revenue_roas = round(total_invoiced / max(1.0, total_spend), 2)
        portfolio_collected_roas = round(total_collected / max(1.0, total_spend), 2)

        campaign_reports = [self.calculate_campaign_attribution(c) for c in all_campaigns]

        return {
            "total_spend": total_spend,
            "total_leads": total_leads,
            "total_customers": total_customers,
            "total_invoiced_revenue": total_invoiced,
            "total_collected_revenue": total_collected,
            "blended_cac": portfolio_cac,
            "portfolio_revenue_roas": portfolio_revenue_roas,
            "portfolio_collected_roas": portfolio_collected_roas,
            "campaigns": campaign_reports
        }

attribution_engine = AttributionEngine()
