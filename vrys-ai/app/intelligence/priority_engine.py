"""
VRYS AI — Priority Engine (Step 7)
Evaluates Severity, Impact, Urgency, and Confidence to filter noise and prioritize actionable insights.
"""
from typing import Dict, Any

class PriorityEngine:
    def __init__(self):
        self.weights = {
            "severity": 0.35,
            "impact": 0.30,
            "urgency": 0.20,
            "confidence": 0.15
        }

    def evaluate_priority(self, severity: str, impact: str, urgency: str, confidence: float) -> Dict[str, Any]:
        """
        Calculates a composite priority score (0–100) and maps to an alert level.
        """
        score_map = {
            "CRITICAL": 100,
            "HIGH": 75,
            "MEDIUM": 45,
            "LOW": 20
        }

        sev_val = score_map.get(severity.upper(), 50)
        imp_val = score_map.get(impact.upper(), 50)
        urg_val = score_map.get(urgency.upper(), 50)
        conf_val = max(0.0, min(1.0, confidence)) * 100

        composite_score = (
            sev_val * self.weights["severity"] +
            imp_val * self.weights["impact"] +
            urg_val * self.weights["urgency"] +
            conf_val * self.weights["confidence"]
        )

        if composite_score >= 80:
            alert_tier = "CRITICAL_ALERT"
            notify_channel = "IMMEDIATE_MODAL"
        elif composite_score >= 60:
            alert_tier = "HIGH_PRIORITY"
            notify_channel = "DAILY_DIGEST"
        elif composite_score >= 40:
            alert_tier = "MEDIUM_PRIORITY"
            notify_channel = "WEEKLY_REVIEW"
        else:
            alert_tier = "LOW_INFO"
            notify_channel = "DASHBOARD_FEED"

        return {
            "composite_score": round(composite_score, 2),
            "alert_tier": alert_tier,
            "notification_channel": notify_channel,
            "requires_immediate_attention": composite_score >= 80
        }

priority_engine = PriorityEngine()
