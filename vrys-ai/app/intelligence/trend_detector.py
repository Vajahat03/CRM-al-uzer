"""
VRYS AI — Multi-Week Business Trend Detector (Step 7)
Analyzes sequential historical data points to identify multi-week trends (e.g. declining conversions, rising receivables).
"""
from typing import Dict, Any, List

class TrendDetector:
    def detect_trends(self, historical_weeks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Analyzes 4-week historical trajectory.
        """
        trends = []
        if len(historical_weeks) < 3:
            return trends

        # 1. Check for Consecutive Conversion Rate Decline
        conversions = [w.get("conversion_rate", 0) for w in historical_weeks]
        is_strictly_declining = all(conversions[i] > conversions[i+1] for i in range(len(conversions)-1))
        if is_strictly_declining:
            drop_total = round(conversions[0] - conversions[-1], 1)
            trends.append({
                "trend_type": "CONSECUTIVE_CONVERSION_DECLINE",
                "weeks_duration": len(conversions),
                "severity": "HIGH",
                "trajectory": conversions,
                "total_drop_points": drop_total,
                "description": f"Sales conversion has declined for {len(conversions)} consecutive weeks ({conversions[0]}% ➔ {conversions[-1]}%)."
            })

        # 2. Check for Consecutive Receivables Growth
        receivables = [w.get("outstanding_receivables", 0) for w in historical_weeks]
        is_strictly_rising = all(receivables[i] < receivables[i+1] for i in range(len(receivables)-1))
        if is_strictly_rising:
            growth_pct = round(((receivables[-1] - receivables[0]) / max(1, receivables[0])) * 100, 1)
            trends.append({
                "trend_type": "RISING_RECEIVABLES_RISK",
                "weeks_duration": len(receivables),
                "severity": "HIGH",
                "trajectory": receivables,
                "growth_percentage": growth_pct,
                "description": f"Outstanding client receivables have grown {growth_pct}% over the last {len(receivables)} weeks."
            })

        return trends

trend_detector = TrendDetector()
