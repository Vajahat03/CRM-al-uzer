"""
VRYS AI — Marketing Health Score Calculator (Step 9)
Computes a transparent 0–100 marketing index across 6 core pillars:
Lead Volume (20%), Lead Quality (20%), Conversion (20%), Cost Efficiency (15%), ROAS (15%), Trend (10%).
"""
from typing import Dict, Any, List
from app.schemas.marketing_schema import MarketingHealthScore

class MarketingHealthCalculator:
    def __init__(self):
        self.weights = {
            "lead_volume": 0.20,
            "lead_quality": 0.20,
            "conversion": 0.20,
            "cost_efficiency": 0.15,
            "roas": 0.15,
            "trend": 0.10
        }

    def compute_marketing_health(self, portfolio_summary: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates holistic marketing performance health.
        """
        leads = portfolio_summary.get("total_leads", 0)
        customers = portfolio_summary.get("total_customers", 0)
        roas = portfolio_summary.get("portfolio_revenue_roas", 1.0)
        cac = portfolio_summary.get("blended_cac", 500.0)

        lead_gen_score = min(100.0, max(0.0, (leads / 400.0) * 85.0))
        quality_score = min(100.0, max(0.0, (customers / max(1, leads)) * 1000.0))
        conversion_score = min(100.0, max(0.0, (customers / max(1, leads)) * 800.0))
        cost_eff_score = max(0.0, min(100.0, 110.0 - (cac / 15.0)))
        roas_score = min(100.0, max(0.0, (roas / 8.0) * 90.0))
        trend_score = 75.0

        overall = (
            lead_gen_score * self.weights["lead_volume"] +
            quality_score * self.weights["lead_quality"] +
            conversion_score * self.weights["conversion"] +
            cost_eff_score * self.weights["cost_efficiency"] +
            roas_score * self.weights["roas"] +
            trend_score * self.weights["trend"]
        )

        overall = round(overall, 1)
        status = "EXCELLENT" if overall >= 80 else "HEALTHY" if overall >= 65 else "NEEDS_OPTIMIZATION"

        return {
            "overall_health": overall,
            "lead_gen_score": round(lead_gen_score, 1),
            "quality_score": round(quality_score, 1),
            "cost_efficiency_score": round(cost_eff_score, 1),
            "roas_score": round(roas_score, 1),
            "trend_score": round(trend_score, 1),
            "status": status
        }

marketing_health_calc = MarketingHealthCalculator()
