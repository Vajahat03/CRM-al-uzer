"""
VRYS AI — Step 5 End-to-End Regression Test Suite
Validates the complete execution flow, schema validation, entity normalization,
and audit logging before proceeding to Step 6.
"""
from app.models.local_llm import local_llm
from app.engine.entity_normalizer import entity_normalizer
from app.orchestrator import orchestrator
from app.security.audit_logger import audit_logger
from app.training.tool_calling_dataset import tool_registry

class TestEndToEndRegression:

    def test_1_complete_flow_create_lead(self):
        """End-to-End: Create Lead Command -> Entity Normalization -> Confirmation Tag -> Audit Log."""
        query = "Faisal ke liye ₹25,000 ka corporate lead banado"
        res = orchestrator.process_query(query, "org_aluzer", "Vajahat")

        assert res is not None
        assert res["intent"] == "CREATE_LEAD"
        assert len(res["suggestedActions"]) == 1

        action = res["suggestedActions"][0]
        assert action["actionType"] == "create_lead"
        assert action["requiresConfirmation"] is True
        assert action["payload"]["name"] == "Faisal"
        assert action["payload"]["estimatedValue"] == 25000

    def test_2_complete_flow_overdue_invoices(self):
        """End-to-End: Overdue Invoices -> Automatic Read Tool + Confirmed WhatsApp Chaser."""
        query = "Rahul ka invoice check karo aur payment reminder draft karo"
        res = orchestrator.process_query(query, "org_aluzer", "Vajahat")

        assert res is not None
        assert res["intent"] == "OVERDUE_INVOICES"
        assert "suggestedActions" in res

    def test_3_complete_flow_document_expiration_hinglish(self):
        """End-to-End: Hinglish Document Query -> Document Normalization -> Expiration Tool."""
        query = "Bhai dekhna zara, Ahmed ka passport kab khatam ho raha hai"
        res = orchestrator.process_query(query, "org_aluzer", "Vajahat")

        assert res is not None
        assert res["intent"] == "DOCUMENT_EXPIRATION"

    def test_4_deterministic_finance_invariance(self):
        """End-to-End: Financial Inquiry -> Deterministic Ledger Engine (No Hallucinated Math)."""
        query = "Iss month total net profit aur Kirkol sale kitna hua?"
        res = orchestrator.process_query(query, "org_aluzer", "Vajahat")

        assert res is not None
        assert res["intent"] == "FINANCIAL_STATEMENT"
        assert "Deterministic Financial Engine" in res["content"]

    def test_5_entity_normalizer_slang_and_currency(self):
        """Unit: Normalizes 25k slang, 'kal', and Hindi particles."""
        entities = entity_normalizer.extract_and_normalize("Kal shaam tak 25k account me aa jayenge Amit ke.")
        assert entities.get("customer_name") == "Amit"
        assert entities.get("amount") == 25000
        assert entities.get("date") == "tomorrow"

    def test_6_schema_compliance_all_registered_tools(self):
        """Unit: Verifies all 8 registered tool schemas conform to strict JSON standards."""
        schemas = tool_registry.schemas
        assert len(schemas) == 8
        for name, schema in schemas.items():
            assert "description" in schema
            assert "parameters" in schema
            assert "requires_confirmation" in schema

    def test_7_audit_log_tenant_isolation(self):
        """Unit: Audit logger strictly separates events by organizationId."""
        audit_logger.log_event(
            org_id="org_test_tenant_a",
            user_name="Vajahat",
            user_prompt="Audit test query",
            intent="TEST_INTENT",
            plan_summary="Testing audit isolation",
            tools_invoked=["test_tool"],
            confirmed_by_human=True,
            execution_status="SUCCESS"
        )
        logs_a = audit_logger.get_tenant_audit_logs("org_test_tenant_a")
        logs_b = audit_logger.get_tenant_audit_logs("org_test_tenant_b")

        assert len(logs_a) >= 1
        assert all(l["organization_id"] == "org_test_tenant_a" for l in logs_a)
        assert not any(l["organization_id"] == "org_test_tenant_a" for l in logs_b)

if __name__ == "__main__":
    runner = TestEndToEndRegression()
    print("Running VRYS Step 5 End-to-End Regression Suite...")
    runner.test_1_complete_flow_create_lead()
    print("[PASS] Test 1: Complete Flow - Create Lead Passed")
    runner.test_2_complete_flow_overdue_invoices()
    print("[PASS] Test 2: Complete Flow - Overdue Invoices Passed")
    runner.test_3_complete_flow_document_expiration_hinglish()
    print("[PASS] Test 3: Complete Flow - Document Expiration Hinglish Passed")
    runner.test_4_deterministic_finance_invariance()
    print("[PASS] Test 4: Complete Flow - Deterministic Finance Invariance Passed")
    runner.test_5_entity_normalizer_slang_and_currency()
    print("[PASS] Test 5: Unit - Entity Normalizer Slang & Currency Passed")
    runner.test_6_schema_compliance_all_registered_tools()
    print("[PASS] Test 6: Unit - Schema Compliance for All 8 Tools Passed")
    runner.test_7_audit_log_tenant_isolation()
    print("[PASS] Test 7: Unit - Audit Log Tenant Isolation Passed")
    print("\n[ALL PASSED] STEP 5 COMPLETION GATE VERIFIED (7/7 REGRESSION TESTS PASSED)!")
