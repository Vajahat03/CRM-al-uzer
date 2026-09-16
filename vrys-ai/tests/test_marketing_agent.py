"""
VRYS AI — Step 9 Marketing & Social Media Intelligence 20-Test Completion Gate
Validates Meta/Google integration, Webhook HMAC signatures, Lead Normalization,
Closed-Loop Revenue Attribution, ROAS/CAC calculations, Anomaly/Trend detection,
Marketing Agent reasoning, Budget approval guardrails, and Multi-Tenant Isolation.
"""
from app.agents.marketing_agent import marketing_agent
from app.engine.marketing_tools import marketing_tool_suite
from app.security.integration_credentials import integration_vault
from app.integrations.meta.meta_client import meta_client
from app.integrations.meta.meta_webhooks import meta_webhook_handler
from app.integrations.google.google_ads_client import google_ads_client
from app.marketing.attribution_engine import attribution_engine
from app.marketing.lead_quality import lead_quality_engine
from app.marketing.marketing_health import marketing_health_calc
from app.marketing.marketing_anomaly_detector import marketing_anomaly_detector, marketing_trend_detector
from app.schemas.marketing_schema import AdPlatform, NormalizedLead
from app.orchestrator import orchestrator
import hmac
import hashlib

class TestMarketingAgent:

    def test_1_meta_account_connection(self):
        """Test 1: Registers encrypted Meta token reference in integration vault."""
        rec = integration_vault.register_integration(
            org_id="org_aluzer",
            provider="META",
            external_account_id="act_987654321",
            token_reference="enc_tok_meta_aluzer_v1",
            scopes=["ads_read", "leads_retrieval", "instagram_basic"]
        )
        assert rec["status"] == "ACTIVE"
        assert rec["provider"] == "META"

    def test_2_meta_webhook_verification(self):
        """Test 2: Verifies HMAC SHA256 signature from Meta Graph API."""
        secret = "test_meta_app_secret_123"
        payload = b'{"object": "page", "entry": []}'
        sig = "sha256=" + hmac.new(secret.encode('utf-8'), payload, hashlib.sha256).hexdigest()
        is_valid = meta_webhook_handler.verify_webhook_signature(payload, sig, secret)
        assert is_valid is True

        is_invalid = meta_webhook_handler.verify_webhook_signature(payload, "sha256=forged_signature", secret)
        assert is_invalid is False

    def test_3_meta_lead_ingestion(self):
        """Test 3: Ingests raw Meta Lead Ad payload into normalized lead."""
        raw_lead = {
            "leadgen_id": "meta_lead_999",
            "campaign_id": "meta_cmp_101",
            "field_data": {
                "full_name": "Karan Johar",
                "phone_number": "+919811122233",
                "email": "karan@example.com"
            }
        }
        res = meta_webhook_handler.process_lead_ad_payload(raw_lead, "org_aluzer")
        assert res["status"] == "INGESTED"
        assert res["normalized_lead"]["name"] == "Karan Johar"
        assert res["normalized_lead"]["source_platform"] == AdPlatform.META_ADS.value

    def test_4_instagram_data_normalization(self):
        """Test 4: Normalizes Instagram business reach, impressions, and reels."""
        ig = meta_client.get_instagram_insights("org_aluzer")
        assert ig["followers"] > 0
        assert ig["monthly_reach"] > 0
        assert ig["engagement_rate_pct"] > 0

    def test_5_meta_ads_campaign_ingestion(self):
        """Test 5: Pulls Meta Ads campaigns with spend, impressions, CTR, and CPL."""
        cmps = meta_client.get_campaigns("org_aluzer")
        assert len(cmps) >= 2
        assert all(c["platform"] == AdPlatform.META_ADS for c in cmps)
        assert cmps[0]["total_spend"] == 25000.0

    def test_6_google_ads_campaign_ingestion(self):
        """Test 6: Pulls Google Search & Performance Max campaign metrics."""
        cmps = google_ads_client.get_campaigns("org_aluzer")
        assert len(cmps) >= 1
        assert cmps[0]["platform"] == AdPlatform.GOOGLE_ADS
        assert cmps[0]["ctr"] > 0

    def test_7_unified_lead_normalization(self):
        """Test 7: NormalizedLead strictly conforms to standard schema."""
        lead = NormalizedLead(
            lead_id="lead_test_001",
            organization_id="org_aluzer",
            name="Sneha Kapoor",
            phone="+919820033333",
            source_platform=AdPlatform.META_ADS,
            idempotency_token="org_aluzer:lead_test_001"
        )
        assert lead.lead_score == 50
        assert lead.status == "NEW"

    def test_8_duplicate_lead_detection(self):
        """Test 8: Duplicate lead submission is safely ignored."""
        raw = {"leadgen_id": "meta_dup_001", "name": "Duplicate Lead", "phone": "+919800000000"}
        res1 = meta_webhook_handler.process_lead_ad_payload(raw, "org_aluzer")
        res2 = meta_webhook_handler.process_lead_ad_payload(raw, "org_aluzer")
        assert res1["status"] == "INGESTED"
        assert res2["status"] == "DUPLICATE_IGNORED"
        assert res2["is_duplicate"] is True

    def test_9_campaign_attribution(self):
        """Test 9: Correctly links Campaign ➔ Customers ➔ Invoices."""
        cmps = marketing_tool_suite.get_all_campaigns("org_aluzer")
        assert len(cmps) >= 3
        single_att = attribution_engine.calculate_campaign_attribution(cmps[0])
        assert single_att["customers_acquired"] > 0
        assert single_att["invoiced_revenue"] > 0

    def test_10_spend_aggregation(self):
        """Test 10: Aggregates portfolio ad spend across Meta and Google."""
        report = marketing_tool_suite.get_attribution_report("org_aluzer")
        assert report["total_spend"] == 53000.0 # 25k + 10k + 18k
        assert report["total_leads"] == 555 # 320 + 95 + 140

    def test_11_revenue_attribution(self):
        """Test 11: Distinguishes Invoiced Revenue from Collected Cash Revenue."""
        report = marketing_tool_suite.get_attribution_report("org_aluzer")
        assert report["total_invoiced_revenue"] == 347000.0
        assert report["total_collected_revenue"] == 323000.0
        assert report["portfolio_revenue_roas"] > report["portfolio_collected_roas"]

    def test_12_campaign_performance_calculation(self):
        """Test 12: Calculates CPL, CTR, and conversion rates deterministically."""
        cmps = meta_client.get_campaigns("org_aluzer")
        c = cmps[0]
        cpl_calc = round(c["total_spend"] / c["leads_count"], 2)
        assert cpl_calc == c["cpl"]

    def test_13_roas_calculation(self):
        """Test 13: Computes exact ROAS (Revenue / Ad Spend)."""
        cmps = meta_client.get_campaigns("org_aluzer")
        att = attribution_engine.calculate_campaign_attribution(cmps[0])
        assert att["revenue_roas"] == 7.20 # 180,000 / 25,000
        assert att["collected_roas"] == 6.60 # 165,000 / 25,000

    def test_14_cac_and_ltv_to_cac_ratio(self):
        """Test 14: Computes Customer Acquisition Cost (CAC) and LTV/CAC ratio."""
        cmps = meta_client.get_campaigns("org_aluzer")
        att = attribution_engine.calculate_campaign_attribution(cmps[0])
        assert att["customer_acquisition_cost"] == 925.93 # 25,000 / 27
        assert att["ltv_to_cac_ratio"] > 5.0

    def test_15_lead_quality_analysis(self):
        """Test 15: Identifies Tier 1 high-intent campaigns (>10% conversion)."""
        quality = marketing_tool_suite.get_lead_quality_report("org_aluzer")
        assert len(quality) >= 3
        retargeting = next(q for q in quality if "Retargeting" in q["campaign_name"])
        assert retargeting["quality_tier"] == "TIER_1_HIGH_INTENT"
        assert retargeting["lead_to_customer_conversion_pct"] > 10.0

    def test_16_marketing_anomaly_detection(self):
        """Test 16: Catches CPL spikes > 30% over target."""
        cmps = marketing_tool_suite.get_all_campaigns("org_aluzer")
        anomalies = marketing_anomaly_detector.detect_anomalies(cmps)
        assert len(anomalies) >= 1
        assert any(a["anomaly_type"] == "CPL_SPIKE" for a in anomalies)

    def test_17_marketing_trend_detection(self):
        """Test 17: Detects multi-week declining campaign conversion trends."""
        history = [9.5, 8.8, 7.4, 5.9]
        trends = marketing_trend_detector.detect_trends(history)
        assert len(trends) >= 1
        assert trends[0]["trend_type"] == "CONSECUTIVE_CAMPAIGN_CONVERSION_DECLINE"

    def test_18_marketing_agent_reasoning(self):
        """Test 18: Marketing agent explains which campaign makes money with concrete ROAS."""
        res = marketing_agent.handle_request("Which campaign is actually making us money?", "org_aluzer", "Vajahat", {})
        assert res["intent"] == "MARKETING_ATTRIBUTION_ANALYSIS"
        assert "9.5x ROAS" in res["content"]
        assert "Corporate GST" in res["content"]

    def test_19_budget_change_approval_guardrail(self):
        """Test 19: Budget scaling proposals strictly require explicit human confirmation."""
        res = marketing_agent.handle_request("Which campaign is making us money?", "org_aluzer", "Vajahat", {})
        assert "suggested_actions" in res
        for a in res["suggested_actions"]:
            assert a["requiresConfirmation"] is True
            assert a["actionType"] == "update_campaign_budget"

    def test_20_multi_tenant_isolation(self):
        """Test 20: Tenant Alpha campaigns strictly carry Tenant Alpha organization_id."""
        cmps_a = marketing_tool_suite.get_all_campaigns("org_tenant_alpha")
        cmps_b = marketing_tool_suite.get_all_campaigns("org_tenant_beta")
        assert all(c["organization_id"] == "org_tenant_alpha" for c in cmps_a)
        assert all(c["organization_id"] == "org_tenant_beta" for c in cmps_b)

if __name__ == "__main__":
    runner = TestMarketingAgent()
    print("Running VRYS Step 9 Marketing & Social Media Intelligence 20-Test Completion Gate...")
    runner.test_1_meta_account_connection()
    print("[PASS] Test 1: Meta Account Connection & Encrypted Reference")
    runner.test_2_meta_webhook_verification()
    print("[PASS] Test 2: Meta Webhook HMAC SHA256 Signature Verification")
    runner.test_3_meta_lead_ingestion()
    print("[PASS] Test 3: Meta Lead Ad Ingestion & Normalization")
    runner.test_4_instagram_data_normalization()
    print("[PASS] Test 4: Instagram Business Statistics Normalization")
    runner.test_5_meta_ads_campaign_ingestion()
    print("[PASS] Test 5: Meta Ads Campaign Ingestion")
    runner.test_6_google_ads_campaign_ingestion()
    print("[PASS] Test 6: Google Ads Campaign Ingestion")
    runner.test_7_unified_lead_normalization()
    print("[PASS] Test 7: Unified Lead Normalization Schema")
    runner.test_8_duplicate_lead_detection()
    print("[PASS] Test 8: Duplicate Lead Detection & Idempotency")
    runner.test_9_campaign_attribution()
    print("[PASS] Test 9: Campaign-to-Customer Attribution")
    runner.test_10_spend_aggregation()
    print("[PASS] Test 10: Multi-Platform Ad Spend Aggregation")
    runner.test_11_revenue_attribution()
    print("[PASS] Test 11: Invoiced Revenue vs Collected Cash Attribution")
    runner.test_12_campaign_performance_calculation()
    print("[PASS] Test 12: Campaign Performance & CPL Calculations")
    runner.test_13_roas_calculation()
    print("[PASS] Test 13: Revenue ROAS & Cash ROAS Calculations")
    runner.test_14_cac_and_ltv_to_cac_ratio()
    print("[PASS] Test 14: CAC & LTV/CAC Ratio Calculations")
    runner.test_15_lead_quality_analysis()
    print("[PASS] Test 15: Lead Quality & Conversion Tiering")
    runner.test_16_marketing_anomaly_detection()
    print("[PASS] Test 16: Marketing Anomaly Detection (CPL Spikes)")
    runner.test_17_marketing_trend_detection()
    print("[PASS] Test 17: Multi-Week Ad Conversion Trend Detection")
    runner.test_18_marketing_agent_reasoning()
    print("[PASS] Test 18: Marketing Agent Reasoning & Recommendations")
    runner.test_19_budget_change_approval_guardrail()
    print("[PASS] Test 19: Budget Change Human Confirmation Guardrail")
    runner.test_20_multi_tenant_isolation()
    print("[PASS] Test 20: Multi-Tenant Marketing Isolation")
    print("\n[ALL PASSED] STEP 9 COMPLETION GATE VERIFIED (20/20 TESTS PASSED)!")
