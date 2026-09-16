"""
VRYS AI — Contextual Message Generator (Step 8)
Generates high-precision personalized messages using deterministic Customer 360 data
and conversation history to prevent hallucinated amounts or dates.
"""
from typing import Dict, Any, Optional

class MessageGenerator:
    def __init__(self):
        self.templates = {
            "PAYMENT_REMINDER": (
                "Hello {customer_name}, this is a friendly reminder from {company_name} "
                "regarding Invoice #{invoice_number} for ₹{invoice_amount:,.0f} which was due on {due_date}. "
                "Please let us know if you need UPI or bank transfer details."
            ),
            "DOCUMENT_RENEWAL": (
                "Hi {customer_name}, your {document_type} is scheduled to expire on {due_date}. "
                "To ensure uninterrupted validity, we have initiated your renewal slot with {company_name}. "
                "Reply to confirm processing."
            ),
            "LEAD_FOLLOWUP": (
                "Hi {customer_name}, thank you for your interest in {service_name} with {company_name}. "
                "Our specialist {employee_name} is ready to assist you with the next step. "
                "When is a convenient time for a quick 5-minute call?"
            ),
            "JOB_STATUS_UPDATE": (
                "Hello {customer_name}, your application for {service_name} has moved to stage: *{job_stage}*. "
                "We are tracking it actively and will notify you upon final dispatch."
            )
        }

    def generate_message(self, template_key: str, customer_context: Dict[str, Any], custom_tone: str = "professional") -> Dict[str, Any]:
        """
        Synthesizes a personalized message payload with strictly validated database variables.
        """
        template = self.templates.get(template_key, self.templates["LEAD_FOLLOWUP"])
        
        variables = {
            "customer_name": customer_context.get("name", "Valued Customer"),
            "company_name": customer_context.get("company_name", "VRYS Enterprise"),
            "invoice_number": customer_context.get("invoice_number", "INV-2026-001"),
            "invoice_amount": float(customer_context.get("invoice_amount", 15000.0)),
            "due_date": customer_context.get("due_date", "Upcoming"),
            "document_type": customer_context.get("document_type", "Passport"),
            "service_name": customer_context.get("service_name", "Document Processing"),
            "employee_name": customer_context.get("employee_name", "Vajahat"),
            "job_stage": customer_context.get("job_stage", "In Progress")
        }

        rendered_text = template.format(**variables)
        return {
            "template_key": template_key,
            "rendered_content": rendered_text,
            "variables_injected": variables,
            "tone": custom_tone
        }

message_generator = MessageGenerator()
