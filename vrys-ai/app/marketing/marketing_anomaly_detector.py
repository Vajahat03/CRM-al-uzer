"""
VRYS AI — Marketing Anomaly & Trend Detectors (Step 9)
Detects sudden Cost-Per-Lead (CPL) spikes, CTR drops, and multi-week conversion degradation.
"""
from typing import Dict, Any, List

class MarketingAnomalyDetector:
    def detect_anomalies(self, current_campaigns: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        anomalies = []
        for c in current_campaigns:
            cpl = c.get("cpl", 0.0)
            target_cpl = 90.0
            if cpl > target_cpl * 1.3:
                increase_pct = round(((cpl - target_cpl) / target_cpl) * 100, 1)
                anomalies.append({
                    "anomaly_type": "CPL_SPIKE",
                    "campaign_id": c.get("campaign_id"),
                    "campaign_name": c.get("name"),
                    "severity": "HIGH",
                    "current_cpl": cpl,
                    "target_cpl": target_cpl,
                    "increase_pct": increase_pct,
                    "description": f"Campaign '{c.get('name')}' CPL spiked to ₹{cpl:,.2f} ({increase_pct}% above ₹{target_cpl:,.2f} target)."
                })
        return anomalies

class MarketingTrendDetector:
    def detect_trends(self, weekly_conversion_history: List[float]) -> List[Dict[str, Any]]:
        trends = []
        if len(weekly_conversion_history) >= 3:
            is_declining = all(weekly_conversion_history[i] > weekly_conversion_history[i+1] for i in range(len(weekly_conversion_history)-1))
            if is_declining:
                trends.append({
                    "trend_type": "CONSECUTIVE_CAMPAIGN_CONVERSION_DECLINE",
                    "severity": "HIGH",
                    "weeks": len(weekly_conversion_history),
                    "trajectory": weekly_conversion_history,
                    "description": f"Ad conversion has declined across {len(weekly_conversion_history)} consecutive weeks."
                })
        return trends

marketing_anomaly_detector = MarketingAnomalyDetector()
marketing_trend_detector = MarketingTrendDetector()
