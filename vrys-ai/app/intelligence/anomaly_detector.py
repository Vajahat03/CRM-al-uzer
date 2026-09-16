"""
VRYS AI — Business Anomaly Detector (Step 7)
Identifies sudden drops, SLA bottlenecks, and revenue irregularities using deterministic calculations.
"""
from typing import Dict, Any, List

class AnomalyDetector:
    def __init__(self):
        self.revenue_drop_threshold = 0.15 # 15% drop threshold
        self.job_delay_threshold_days = 5 # 5 days in bottleneck stage

    def detect_anomalies(self, current_metrics: Dict[str, Any], baseline_metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        anomalies = []

        # 1. Daily Revenue Anomaly Check
        current_rev = current_metrics.get("revenue_today", 0)
        expected_min_rev = baseline_metrics.get("expected_min_daily_revenue", 90000)
        if current_rev < expected_min_rev:
            drop_pct = round(((expected_min_rev - current_rev) / expected_min_rev) * 100, 1)
            anomalies.append({
                "anomaly_type": "REVENUE_DROP",
                "severity": "CRITICAL" if drop_pct >= 40 else "HIGH",
                "metric": "revenue_today",
                "current_value": current_rev,
                "expected_minimum": expected_min_rev,
                "drop_percentage": drop_pct,
                "description": f"Today's revenue (₹{current_rev:,.0f}) is {drop_pct}% below expected baseline of ₹{expected_min_rev:,.0f}."
            })

        # 2. Operational Job Bottleneck Anomaly
        overdue_jobs = current_metrics.get("overdue_jobs", 0)
        active_jobs = max(1, current_metrics.get("active_jobs", 1))
        overdue_ratio = (overdue_jobs / active_jobs)
        if overdue_jobs >= 10 or overdue_ratio > 0.15:
            anomalies.append({
                "anomaly_type": "OPERATIONAL_BOTTLENECK",
                "severity": "HIGH",
                "metric": "overdue_jobs",
                "count": overdue_jobs,
                "delayed_ratio_pct": round(overdue_ratio * 100, 1),
                "description": f"{overdue_jobs} jobs ({round(overdue_ratio * 100, 1)}% of total pipeline) are exceeding SLA delivery windows."
            })

        # 3. High-Value Uncontacted Leads Anomaly
        uncontacted_leads = current_metrics.get("uncontacted_high_value_leads", 0)
        if uncontacted_leads >= 10:
            anomalies.append({
                "anomaly_type": "LEAD_RESPONSE_DELAY",
                "severity": "HIGH",
                "metric": "uncontacted_high_value_leads",
                "count": uncontacted_leads,
                "description": f"{uncontacted_leads} high-value leads have not received an initial follow-up within 24 hours."
            })

        return anomalies

anomaly_detector = AnomalyDetector()
