"""
VRYS AI — Step 8 Communication & Workflow Execution Agent 15-Test Completion Gate
Validates message generation, WhatsApp/Email dispatch, workflows, retries,
approval guardrails, duplicate protection, human handoff, and multi-tenant isolation.
"""
import uuid
from app.agents.communication_agent import communication_agent
from app.engine.communication_tools import communication_tool_suite
from app.communication.message_generator import message_generator
from app.communication.conversation_manager import conversation_manager
from app.communication.human_handoff import human_handoff_manager
from app.channels.whatsapp_client import whatsapp_client
from app.channels.email_client import email_client
from app.workflows.workflow_engine import workflow_engine
from app.workflows.retry_manager import retry_manager
from app.schemas.communication_schema import OutboundMessage, ChannelType, MessageStatus
from app.orchestrator import orchestrator

class TestCommunicationAgent:

    def test_1_customer_context_retrieval(self):
        """Test 1: Retrieves verified customer database context."""
        ctx = communication_tool_suite.get_customer_context("cust_101", "org_aluzer")
        assert ctx["name"] == "Rahul Verma"
        assert "invoice_amount" in ctx
        assert ctx["organization_id"] == "org_aluzer"

    def test_2_personalized_message_generation(self):
        """Test 2: Generates personalized message using database fields without hallucination."""
        ctx = {"name": "Ahmed", "company_name": "VRYS", "invoice_number": "INV-100", "invoice_amount": 25000.0, "due_date": "Tomorrow"}
        msg = message_generator.generate_message("PAYMENT_REMINDER", ctx)
        assert "Ahmed" in msg["rendered_content"]
        assert "₹25,000" in msg["rendered_content"]
        assert "INV-100" in msg["rendered_content"]

    def test_3_message_schema_validation(self):
        """Test 3: OutboundMessage strictly conforms to Pydantic schema."""
        msg = OutboundMessage(
            message_id="msg_test_001",
            organization_id="org_aluzer",
            customer_id="cust_101",
            customer_name="Rahul Verma",
            recipient_phone_or_email="+919820012345",
            channel=ChannelType.WHATSAPP,
            content="Hello Rahul",
            idempotency_key=str(uuid.uuid4())
        )
        assert msg.status == MessageStatus.APPROVAL_REQUIRED
        assert msg.channel == ChannelType.WHATSAPP

    def test_4_whatsapp_dispatch(self):
        """Test 4: WhatsApp template message dispatch with receipt tracking."""
        receipt = whatsapp_client.send_template_message(
            org_id="org_aluzer",
            customer_id="cust_101",
            recipient_phone="+919820012345",
            template_name="custom_reminder",
            template_params={"message": "Your passport is ready."}
        )
        assert receipt["status"] == MessageStatus.SENT.value
        assert "message_id" in receipt

    def test_5_email_dispatch(self):
        """Test 5: Transactional email dispatch."""
        receipt = email_client.send_email(
            org_id="org_aluzer",
            customer_id="cust_101",
            recipient_email="rahul@example.com",
            subject="Invoice Reminder",
            body_html="<p>Invoice due</p>"
        )
        assert receipt["status"] == MessageStatus.SENT.value
        assert "email_id" in receipt

    def test_6_message_status_tracking(self):
        """Test 6: Tracks message delivery states."""
        receipt = whatsapp_client.send_template_message(
            org_id="org_aluzer", customer_id="cust_102", recipient_phone="+919820012345", template_name="status_test", template_params={}
        )
        status_rec = whatsapp_client.get_message_status(receipt["message_id"])
        assert status_rec is not None
        assert status_rec["status"] == MessageStatus.SENT.value

    def test_7_workflow_trigger_detection(self):
        """Test 7: Event trigger detection for lead.created."""
        res = workflow_engine.evaluate_and_trigger("lead.created", {"name": "Faisal", "score": 90}, "org_aluzer")
        assert res["triggered"] is True
        assert len(res["workflows_matched"]) >= 1

    def test_8_workflow_condition_evaluation(self):
        """Test 8: Condition evaluation filters out low-score leads (< 80)."""
        res = workflow_engine.evaluate_and_trigger("lead.created", {"name": "Cold Lead", "score": 45}, "org_aluzer")
        assert res["triggered"] is True
        assert len(res["actions_executed"]) == 0 # Filtered out by condition

    def test_9_workflow_execution_pipeline(self):
        """Test 9: High-score lead triggers task creation and WhatsApp draft."""
        res = workflow_engine.evaluate_and_trigger("lead.created", {"name": "Hot Prospect", "score": 85}, "org_aluzer")
        assert len(res["actions_executed"]) == 2
        assert any(a["action"] == "create_task" for a in res["actions_executed"])
        assert any(a["action"] == "generate_whatsapp_draft" for a in res["actions_executed"])

    def test_10_retry_handling_max_attempts(self):
        """Test 10: Retries failed operations up to 3 times."""
        fail_count = 0
        def faulty_op():
            nonlocal fail_count
            fail_count += 1
            if fail_count < 3:
                raise ConnectionError("Network timeout")
            return {"status": "SUCCESS"}

        res = retry_manager.execute_with_retry(faulty_op)
        assert res["status"] == "SUCCESS"
        assert res["retry_attempts"] == 3

    def test_11_approval_guardrail(self):
        """Test 11: Outbound communication requires explicit human confirmation."""
        res = communication_agent.handle_request("Send WhatsApp payment reminder to Rahul", "org_aluzer", "Vajahat", {"customer_name": "Rahul"})
        assert "suggested_actions" in res
        for a in res["suggested_actions"]:
            assert a["requiresConfirmation"] is True

    def test_12_duplicate_message_prevention_idempotency(self):
        """Test 12: Idempotency token prevents duplicate message dispatches."""
        token = str(uuid.uuid4())
        res1 = whatsapp_client.send_template_message("org_aluzer", "cust_101", "+919820012345", "test", {}, idempotency_key=token)
        res2 = whatsapp_client.send_template_message("org_aluzer", "cust_101", "+919820012345", "test", {}, idempotency_key=token)
        assert res2.get("is_duplicate") is True
        assert res1["message_id"] == res2["message_id"]

    def test_13_cooldown_rate_limit_protection(self):
        """Test 13: 24-hour customer cooldown prevents spamming."""
        # Clear/simulate a recent contact
        conversation_manager.record_outbound_message("org_cooldown_test", {
            "customer_id": "cust_recent", "channel": "WHATSAPP", "timestamp": 1000000000.0 # Old time
        })
        # Fresh contact
        res = communication_tool_suite.send_whatsapp_message("cust_recent", "Test message", "org_cooldown_test")
        assert res["status"] == MessageStatus.SENT.value

        # Immediate follow-up attempt should be blocked by safety guard
        blocked = communication_tool_suite.send_whatsapp_message("cust_recent", "Immediate spam", "org_cooldown_test")
        assert blocked["status"] == "BLOCKED_BY_SAFETY_GUARD"

    def test_14_human_handoff(self):
        """Test 14: Sensitive keywords (angry, refund, lawyer) trigger immediate human handoff."""
        res_refund = human_handoff_manager.evaluate_incoming_message("I want a refund, your service is terrible")
        assert res_refund["requires_handoff"] is True
        assert res_refund["conversation_status"] == "HUMAN_CONTROLLED"

        agent_res = communication_agent.handle_request("I want a refund immediately", "org_aluzer", "Vajahat", {})
        assert agent_res["intent"] == "HUMAN_HANDOFF"
        assert "Human Handoff Triggered" in agent_res["content"]

    def test_15_multi_tenant_isolation(self):
        """Test 15: Tenant A cannot retrieve Tenant B conversation timeline."""
        conversation_manager.record_outbound_message("org_tenant_a", {"customer_id": "cust_shared", "channel": "WHATSAPP", "timestamp": 1.0})
        timeline_a = conversation_manager.get_customer_timeline("org_tenant_a", "cust_shared")
        timeline_b = conversation_manager.get_customer_timeline("org_tenant_b", "cust_shared")
        assert len(timeline_a) >= 1
        assert len(timeline_b) == 0

if __name__ == "__main__":
    runner = TestCommunicationAgent()
    print("Running VRYS Step 8 Communication & Workflow Execution Agent 15-Test Completion Gate...")
    runner.test_1_customer_context_retrieval()
    print("[PASS] Test 1: Customer Context Retrieval")
    runner.test_2_personalized_message_generation()
    print("[PASS] Test 2: Personalized Message Generation")
    runner.test_3_message_schema_validation()
    print("[PASS] Test 3: Message Schema Validation")
    runner.test_4_whatsapp_dispatch()
    print("[PASS] Test 4: WhatsApp Dispatch")
    runner.test_5_email_dispatch()
    print("[PASS] Test 5: Email Dispatch")
    runner.test_6_message_status_tracking()
    print("[PASS] Test 6: Message Status Tracking")
    runner.test_7_workflow_trigger_detection()
    print("[PASS] Test 7: Workflow Trigger Detection")
    runner.test_8_workflow_condition_evaluation()
    print("[PASS] Test 8: Workflow Condition Evaluation")
    runner.test_9_workflow_execution_pipeline()
    print("[PASS] Test 9: Workflow Execution Pipeline")
    runner.test_10_retry_handling_max_attempts()
    print("[PASS] Test 10: Retry Handling Max Attempts")
    runner.test_11_approval_guardrail()
    print("[PASS] Test 11: Approval Guardrail")
    runner.test_12_duplicate_message_prevention_idempotency()
    print("[PASS] Test 12: Duplicate Prevention via Idempotency")
    runner.test_13_cooldown_rate_limit_protection()
    print("[PASS] Test 13: Cooldown & Rate-Limit Protection")
    runner.test_14_human_handoff()
    print("[PASS] Test 14: Human Handoff on Sensitive Sentiment")
    runner.test_15_multi_tenant_isolation()
    print("[PASS] Test 15: Multi-Tenant Communication Isolation")
    print("\n[ALL PASSED] STEP 8 COMPLETION GATE VERIFIED (15/15 TESTS PASSED)!")
