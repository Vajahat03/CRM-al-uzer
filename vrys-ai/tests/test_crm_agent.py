"""
VRYS AI — Step 6 Autonomous CRM Agent Invariant & Functionality Test Suite
Validates stuck jobs watchdog, document expiration alerts, and Customer 360 synthesis.
"""
from app.agents.crm_agent import crm_agent
from app.engine.crm_tools import crm_tool_suite
from app.orchestrator import orchestrator

class TestCRMAgent:

    def test_1_stuck_jobs_watchdog(self):
        """CRMAgent correctly identifies jobs stuck in Al Uzer or Doc Required stages."""
        stuck = crm_tool_suite.get_stuck_jobs(threshold_days=5, org_id="org_aluzer")
        assert len(stuck) >= 2
        assert any(j["current_stage"] == "Al Uzer" for j in stuck)
        assert any(j["days_in_stage"] >= 5 for j in stuck)

        res = crm_agent.handle_request("Show stuck jobs in Al Uzer bottleneck", "org_aluzer", "Vajahat", {})
        assert "Bottleneck Watchdog" in res["content"]
        assert len(res["suggested_actions"]) == 1
        assert res["suggested_actions"][0]["requiresConfirmation"] is True

    def test_2_document_vault_expiry_notice(self):
        """CRMAgent extracts expiring passport and drafts WhatsApp renewal alert."""
        res = crm_agent.handle_request(
            "Ahmed ka passport kab expire ho raha hai?",
            "org_aluzer",
            "Vajahat",
            {"customer_name": "Ahmed", "document_type": "passport"}
        )
        assert res["intent"] == "DOCUMENT_EXPIRATION"
        assert "Ahmed" in res["content"]
        assert "Passport" in res["content"]
        assert len(res["suggested_actions"]) == 1
        assert res["suggested_actions"][0]["actionType"] == "send_document_reminder"

    def test_3_customer_360_synthesis(self):
        """CRMAgent synthesizes LTV, active jobs, and balances into Customer 360 view."""
        res = crm_agent.handle_request(
            "Rahul Verma ka complete history aur 360 profile dikhao",
            "org_aluzer",
            "Vajahat",
            {"customer_name": "Rahul Verma"}
        )
        assert res["intent"] == "CUSTOMER_360_QUERY"
        assert "Rahul Verma" in res["content"]
        assert "Lifetime Revenue" in res["content"]
        assert "Predicted 12-Month LTV" in res["content"]

    def test_4_orchestrator_crm_delegation(self):
        """Master orchestrator seamlessly delegates CRM queries to CRMAgent."""
        res = orchestrator.process_query("Bhai dekhna zara, Ahmed ka passport kab khatam ho raha hai", "org_aluzer", "Vajahat")
        assert res["agentName"] == "💬 Autonomous CRM Operations Agent"
        assert "Document Vault Watchdog" in res["content"]

if __name__ == "__main__":
    runner = TestCRMAgent()
    print("Running VRYS Step 6 Autonomous CRM Agent Test Suite...")
    runner.test_1_stuck_jobs_watchdog()
    print("[PASS] Test 1: Stuck Jobs Watchdog Passed")
    runner.test_2_document_vault_expiry_notice()
    print("[PASS] Test 2: Document Vault Expiry Notice Passed")
    runner.test_3_customer_360_synthesis()
    print("[PASS] Test 3: Customer 360 Synthesis Passed")
    runner.test_4_orchestrator_crm_delegation()
    print("[PASS] Test 4: Master Orchestrator CRM Delegation Passed")
    print("\n[ALL PASSED] STEP 6 AUTONOMOUS CRM AGENT TESTS PASSED (4/4)!")
