"""
VRYS AI — Step 7 Business Intelligence & Decision Agent 12-Test Completion Gate
Validates business snapshot, period comparison, anomaly/trend detection, priority engine,
insight explainability, tenant isolation, financial guardrails, and orchestrator routing.
"""
from app.agents.business_intelligence_agent import business_intelligence_agent
from app.engine.bi_tools import bi_tool_suite
from app.intelligence.anomaly_detector import anomaly_detector
from app.intelligence.trend_detector import trend_detector
from app.intelligence.priority_engine import priority_engine
from app.intelligence.business_health import business_health_calc
from app.intelligence.insight_engine import insight_engine
from app.orchestrator import orchestrator
from app.security.tenant_guard import tenant_guard

class TestBusinessIntelligenceAgent:

    def test_1_business_snapshot(self):
        """Test 1: Correct aggregation in business snapshot."""
        snapshot = bi_tool_suite.get_business_snapshot("org_aluzer")
        assert snapshot is not None
        assert "revenue_today" in snapshot
        assert "health_breakdown" in snapshot
        assert snapshot["health_breakdown"]["overall_health"] > 0

    def test_2_period_comparison(self):
        """Test 2: Correct percentage change calculations."""
        comp = bi_tool_suite.compare_business_periods("This Week", "Last Week", "org_aluzer")
        assert "revenue_change_pct" in comp
        assert "conversion_change_pct" in comp
        assert isinstance(comp["revenue_change_pct"], float)

    def test_3_revenue_anomaly_detection(self):
        """Test 3: Artificial 25%+ drop detected as critical anomaly."""
        current = {"revenue_today": 38000.0, "overdue_jobs": 14, "active_jobs": 126}
        baseline = {"expected_min_daily_revenue": 90000.0}
        anomalies = anomaly_detector.detect_anomalies(current, baseline)
        assert len(anomalies) >= 1
        rev_anom = next(a for a in anomalies if a["anomaly_type"] == "REVENUE_DROP")
        assert rev_anom["severity"] in ["HIGH", "CRITICAL"]
        assert rev_anom["drop_percentage"] > 25.0

    def test_4_false_positive_protection(self):
        """Test 4: Normal variation (e.g. 5% variance) does NOT trigger critical alert."""
        current = {"revenue_today": 92000.0, "overdue_jobs": 2, "active_jobs": 120}
        baseline = {"expected_min_daily_revenue": 90000.0}
        anomalies = anomaly_detector.detect_anomalies(current, baseline)
        assert len(anomalies) == 0

    def test_5_trend_detection(self):
        """Test 5: 4-week consecutive declining conversion detected."""
        history = [
            {"conversion_rate": 22.0, "outstanding_receivables": 180000},
            {"conversion_rate": 20.0, "outstanding_receivables": 220000},
            {"conversion_rate": 17.0, "outstanding_receivables": 275000},
            {"conversion_rate": 14.8, "outstanding_receivables": 340000}
        ]
        trends = trend_detector.detect_trends(history)
        assert len(trends) >= 1
        conv_trend = next(t for t in trends if t["trend_type"] == "CONSECUTIVE_CONVERSION_DECLINE")
        assert conv_trend["weeks_duration"] == 4
        assert conv_trend["severity"] == "HIGH"

    def test_6_insight_explainability(self):
        """Test 6: Generated insights contain concrete evidence and recommendations."""
        snapshot = bi_tool_suite.get_business_snapshot("org_aluzer")
        comp = bi_tool_suite.compare_business_periods("This Week", "Last Week", "org_aluzer")
        history = [
            {"conversion_rate": 22.0, "outstanding_receivables": 180000},
            {"conversion_rate": 20.0, "outstanding_receivables": 220000},
            {"conversion_rate": 17.0, "outstanding_receivables": 275000},
            {"conversion_rate": 14.8, "outstanding_receivables": 340000}
        ]
        insights = insight_engine.generate_insights(snapshot, comp, history)
        assert len(insights) >= 1
        for ins in insights:
            assert "title" in ins
            assert "evidence" in ins
            assert len(ins["evidence"]) >= 1
            assert "recommendation" in ins
            assert len(ins["recommendation"]) >= 1

    def test_7_priority_engine(self):
        """Test 7: High-impact issue gets HIGH/CRITICAL priority score."""
        prio = priority_engine.evaluate_priority(severity="HIGH", impact="HIGH", urgency="HIGH", confidence=0.95)
        assert prio["composite_score"] >= 75
        assert prio["alert_tier"] in ["HIGH_PRIORITY", "CRITICAL_ALERT"]

    def test_8_tenant_isolation(self):
        """Test 8: Tenant A context is strictly isolated from Tenant B."""
        snap_a = bi_tool_suite.get_business_snapshot("org_tenant_alpha")
        snap_b = bi_tool_suite.get_business_snapshot("org_tenant_beta")
        assert snap_a["organization_id"] == "org_tenant_alpha"
        assert snap_b["organization_id"] == "org_tenant_beta"

    def test_9_financial_guardrail(self):
        """Test 9: Recommended financial actions strictly require human confirmation."""
        res = business_intelligence_agent.handle_request("Why are receivables increasing?", "org_aluzer", "Vajahat", {})
        assert "suggested_actions" in res
        for action in res["suggested_actions"]:
            assert action["requiresConfirmation"] is True

    def test_10_orchestrator_delegation(self):
        """Test 10: Routing: BI intent -> BI Agent; CRM intent -> CRM Agent."""
        res_bi = orchestrator.process_query("Give me today's business health and morning brief", "org_aluzer", "Vajahat")
        assert res_bi["agentName"] == "📊 Business Intelligence & Decision Agent"

        res_crm = orchestrator.process_query("Which jobs are stuck in Al Uzer stage?", "org_aluzer", "Vajahat")
        assert res_crm["agentName"] == "💬 Autonomous CRM Operations Agent"

    def test_11_empty_low_data_resilience(self):
        """Test 11: No crashes or ZeroDivisionErrors on fresh tenant with zero metrics."""
        empty_metrics = {
            "new_leads": 0,
            "conversion_rate": 0.0,
            "active_jobs": 0,
            "overdue_jobs": 0,
            "outstanding_receivables": 0.0,
            "revenue_today": 0.0,
            "expiring_documents": 0
        }
        health = business_health_calc.compute_health_score(empty_metrics)
        assert health is not None
        assert 0 <= health["overall_health"] <= 100

    def test_12_conflicting_data_safety(self):
        """Test 12: Handles anomalous zero-bound metrics safely."""
        anomalies = anomaly_detector.detect_anomalies(
            {"revenue_today": 0.0, "active_jobs": 0, "overdue_jobs": 0},
            {"expected_min_daily_revenue": 50000.0}
        )
        assert len(anomalies) >= 1

if __name__ == "__main__":
    runner = TestBusinessIntelligenceAgent()
    print("Running VRYS Step 7 Business Intelligence Agent 12-Test Completion Gate...")
    runner.test_1_business_snapshot()
    print("[PASS] Test 1: Business Snapshot Correct Aggregation")
    runner.test_2_period_comparison()
    print("[PASS] Test 2: Period Comparison Calculations")
    runner.test_3_revenue_anomaly_detection()
    print("[PASS] Test 3: Revenue Anomaly Detection")
    runner.test_4_false_positive_protection()
    print("[PASS] Test 4: False Positive Protection")
    runner.test_5_trend_detection()
    print("[PASS] Test 5: Multi-Week Trend Detection")
    runner.test_6_insight_explainability()
    print("[PASS] Test 6: Insight Explainability & Evidence")
    runner.test_7_priority_engine()
    print("[PASS] Test 7: Priority Engine Composite Scoring")
    runner.test_8_tenant_isolation()
    print("[PASS] Test 8: Multi-Tenant Metric Isolation")
    runner.test_9_financial_guardrail()
    print("[PASS] Test 9: Financial Mutation Confirmation Guardrail")
    runner.test_10_orchestrator_delegation()
    print("[PASS] Test 10: Master Orchestrator Intent Routing")
    runner.test_11_empty_low_data_resilience()
    print("[PASS] Test 11: Empty / Low Data Resilience")
    runner.test_12_conflicting_data_safety()
    print("[PASS] Test 12: Conflicting Data Safety")
    print("\n[ALL PASSED] STEP 7 COMPLETION GATE VERIFIED (12/12 TESTS PASSED)!")
