"""
VRYS AI — Scheduled Intelligence Runner (Step 7)
Runs periodic background scans (e.g. 08:00 AM Morning Brief, Operational Bottleneck Watchdog)
using deterministic checks to avoid unnecessary LLM compute costs.
"""
from typing import Dict, Any, List
import time
from app.agents.business_intelligence_agent import business_intelligence_agent
from app.engine.bi_tools import bi_tool_suite
from app.security.audit_logger import audit_logger

class IntelligenceScheduler:
    def __init__(self):
        self.scheduled_jobs = [
            "DAILY_MORNING_BRIEF_0800",
            "OPERATIONAL_BOTTLENECK_SCAN_HOURLY",
            "WEEKLY_BUSINESS_REVIEW_MONDAY"
        ]

    def trigger_daily_brief(self, org_id: str, user_name: str = "Owner") -> Dict[str, Any]:
        """
        Executes 08:00 AM Daily Business Brief.
        """
        result = business_intelligence_agent.handle_request("Give me today's business health and morning brief", org_id, user_name, {})
        
        # Log event to tenant audit trail
        audit_logger.log_event(
            org_id=org_id,
            user_name=f"SYSTEM_SCHEDULER ({user_name})",
            user_prompt="[CRON: 08:00 AM Daily Briefing]",
            intent=result["intent"],
            plan_summary="Automated daily executive business snapshot and anomaly scan",
            tools_invoked=["get_business_snapshot", "compare_business_periods", "detect_business_anomalies"],
            confirmed_by_human=False,
            execution_status="GENERATED"
        )
        return result

    def trigger_bottleneck_scan(self, org_id: str) -> List[Dict[str, Any]]:
        """
        Runs hourly operational bottleneck check without invoking expensive LLMs.
        """
        anomalies = bi_tool_suite.detect_business_anomalies(org_id)
        return anomalies

intelligence_scheduler = IntelligenceScheduler()
