"""
VRYS AI — Lead Quality & Channel Efficiency Engine (Step 9)
Evaluates true business lead quality: conversion percentage from Lead ➔ Paid Customer,
identifying high-volume but low-quality ad sets.
"""
from typing import Dict, Any, List

class LeadQualityEngine:
    def analyze_lead_quality(self, campaigns: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Ranks campaigns by customer conversion efficiency rather than vanity lead counts.
        """
        results = []
        for c in campaigns:
            leads = max(1, c.get("leads_count", 0))
            customers = c.get("paying_customers_count", 0)
            conv_rate = round((customers / leads) * 100, 2)
            cpl = round(c.get("total_spend", 0.0) / leads, 2)

            if conv_rate >= 10.0:
                tier = "TIER_1_HIGH_INTENT"
            elif conv_rate >= 5.0:
                tier = "TIER_2_MODERATE"
            else:
                tier = "TIER_3_LOW_QUALITY_VOLUME"

            results.append({
                "campaign_id": c.get("campaign_id", ""),
                "campaign_name": c.get("name", ""),
                "platform": c.get("platform", ""),
                "leads_generated": leads,
                "paying_customers": customers,
                "lead_to_customer_conversion_pct": conv_rate,
                "cost_per_lead": cpl,
                "quality_tier": tier,
                "recommendation": (
                    "Scale daily budget by 15-20%" if tier == "TIER_1_HIGH_INTENT"
                    else "Optimize ad copy and landing page" if tier == "TIER_2_MODERATE"
                    else "Refine audience targeting to reduce low-intent clicks"
                )
            })
        return results

lead_quality_engine = LeadQualityEngine()
