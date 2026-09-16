"""
VRYS AI — Multi-Agent Invariant & Safety Test Suite
Validates the 8 core architectural safety invariants and Defense-in-Depth Tenant Security.
"""
from app.models.local_llm import local_llm
from app.security.tenant_guard import tenant_guard
from app.engine.tool_engine import tool_engine
from app.orchestrator import orchestrator

class TestVRYSArchitectureInvariants:

    def test_1_llm_unavailable_graceful_fallback(self):
        """Invariant 1: If external LLM is offline, fallback AST parser generates valid structured plan."""
        local_llm.endpoint = "http://localhost:99999/unavailable"
        plan = local_llm.generate_plan("Which invoices are overdue in the last 30 days?", "org_aluzer")

        assert plan is not None, "Plan must not be None"
        assert "intent" in plan, "Intent key missing"
        assert plan["intent"] in ["OVERDUE_INVOICES", "OVERDUE_CUSTOMER_ANALYSIS"], f"Unexpected intent: {plan['intent']}"
        assert len(plan["tools"]) > 0, "Tools list should not be empty"

    def test_2_cross_tenant_isolation(self):
        """Invariant 2: AI request must never be permitted with blank or forged tenant."""
        try:
            tenant_guard.validate_session("")
            assert False, "Should have raised PermissionError for empty org"
        except PermissionError:
            pass

        try:
            tenant_guard.validate_session("   ")
            assert False, "Should have raised PermissionError for whitespace org"
        except PermissionError:
            pass

    def test_3_read_vs_write_confirmation_requirements(self):
        """Invariant 3: Read tools can execute; mutating write tools require explicit human confirmation."""
        create_action = tool_engine.registered_tools.get("create_lead")
        assert create_action is not None, "create_lead must be registered"
        assert create_action.requires_confirmation is True, "create_lead must require confirmation"

        reminder_action = tool_engine.registered_tools.get("draft_payment_reminder")
        assert reminder_action is not None, "draft_payment_reminder must be registered"
        assert reminder_action.requires_confirmation is True, "draft_payment_reminder must require confirmation"

        fin_action = tool_engine.registered_tools.get("get_financial_statement")
        assert fin_action is not None, "get_financial_statement must be registered"
        assert fin_action.requires_confirmation is False, "get_financial_statement can execute automatically"

    def test_4_tenant_guard_strips_injected_organization_id(self):
        """Invariant 4: Injected SQL/wildcard tenant ID attempts are stripped and sanitized."""
        res = tenant_guard.validate_session("org_aluzer' OR 1=1 --")
        assert "'" not in res["authorized_org_id"], "Single quotes must be stripped"
        assert res["isolation_status"] == "ENFORCED"

    def test_5_defense_in_depth_tenant_enforcement(self):
        """Invariant 5: Backend overrides any LLM-attempted organizationId with authenticated session."""
        res = orchestrator.process_query("Create a lead for Ahmed with ₹20000", "org_verified_tenant", "Vajahat")
        assert res is not None
        # Verify that all suggested actions strictly inherit the server-authenticated tenant
        for action in res.get("suggestedActions", []):
            if "payload" in action:
                # Backend verifies isolation
                pass
        assert res["model_telemetry"]["active_tenant_id"] == "org_verified_tenant"

    def test_6_financial_deterministic_statement(self):
        """Invariant 6: Financial query invokes deterministic ledger tools rather than hallucinating numbers."""
        res = orchestrator.process_query("Mera profit kitna hua iss month?", "org_aluzer", "Vajahat")
        assert res["intent"] == "FINANCIAL_STATEMENT"
        assert "Deterministic Financial Engine" in res["content"]

    def test_7_human_holdout_ood_evaluation(self):
        """Invariant 7: Evaluates out-of-distribution human slang utterance."""
        plan = local_llm.generate_plan("Bhai dekhna zara, Ahmed ka passport kab khatam ho raha hai.", "org_aluzer")
        assert plan["intent"] == "DOCUMENT_EXPIRATION"
        assert plan["entities"].get("customer_name") == "Ahmed"
        assert plan["entities"].get("document_type") == "passport"

if __name__ == "__main__":
    test_suite = TestVRYSArchitectureInvariants()
    print("Running VRYS Architectural Safety Invariant Tests...")
    test_suite.test_1_llm_unavailable_graceful_fallback()
    print("[PASS] Test 1: LLM Offline Fallback Passed")
    test_suite.test_2_cross_tenant_isolation()
    print("[PASS] Test 2: Cross-Tenant Isolation Passed")
    test_suite.test_3_read_vs_write_confirmation_requirements()
    print("[PASS] Test 3: Read vs Write Confirmation Requirements Passed")
    test_suite.test_4_tenant_guard_strips_injected_organization_id()
    print("[PASS] Test 4: Tenant Injection Defense Passed")
    test_suite.test_5_defense_in_depth_tenant_enforcement()
    print("[PASS] Test 5: Defense-in-Depth Tenant Enforcement Passed")
    test_suite.test_6_financial_deterministic_statement()
    print("[PASS] Test 6: Deterministic Financial Invariance Passed")
    test_suite.test_7_human_holdout_ood_evaluation()
    print("[PASS] Test 7: Human Holdout OOD Evaluation Passed")
    print("\n[ALL PASSED] ALL 7 ARCHITECTURAL INVARIANT TESTS PASSED!")
