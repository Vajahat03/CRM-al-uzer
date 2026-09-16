"""
VRYS AI — Structured Tool Calling Dataset & Schema Registry (Step 4)
Generates high-precision function-calling training pairs teaching local open-weight models
to map natural language prompts to multi-step tool plans with explicit confirmation guardrails.
"""
from typing import Dict, Any, List
import json
import os

class ToolSchemaRegistry:
    def __init__(self):
        self.schemas = {
            "get_customer": {
                "description": "Fetch customer master record, past jobs, and contact details by name or mobile",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customerName": { "type": "string" },
                        "mobile": { "type": "string" }
                    }
                },
                "requires_confirmation": False
            },
            "get_overdue_invoices": {
                "description": "Query tenant ledger for unpaid invoices exceeding payment terms",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customerName": { "type": "string" },
                        "daysThreshold": { "type": "integer", "default": 30 },
                        "minAmount": { "type": "number", "default": 0 }
                    }
                },
                "requires_confirmation": False
            },
            "draft_payment_reminder": {
                "description": "Prepare and queue a personalized WhatsApp payment chaser message",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customerName": { "type": "string" },
                        "invoiceId": { "type": "string" },
                        "amount": { "type": "number" },
                        "channel": { "type": "string", "enum": ["whatsapp", "sms", "email"] }
                    },
                    "required": ["customerName"]
                },
                "requires_confirmation": True
            },
            "create_lead": {
                "description": "Register a new sales prospect into the pipeline",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "name": { "type": "string" },
                        "mobile": { "type": "string" },
                        "estimatedValue": { "type": "number" },
                        "source": { "type": "string" },
                        "service": { "type": "string" }
                    },
                    "required": ["name"]
                },
                "requires_confirmation": True
            },
            "get_financial_statement": {
                "description": "Calculate deterministic financial summary: job margins, Kirkol counter sales, and net profit",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "period": { "type": "string", "enum": ["today", "this_week", "this_month", "all_time"] },
                        "includeKirkol": { "type": "boolean", "default": True }
                    }
                },
                "requires_confirmation": False
            },
            "get_expiring_documents": {
                "description": "Search document vault for customer IDs, passports, or licenses expiring within threshold",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customerName": { "type": "string" },
                        "documentType": { "type": "string" },
                        "daysThreshold": { "type": "integer", "default": 30 }
                    }
                },
                "requires_confirmation": False
            },
            "send_document_reminder": {
                "description": "Dispatch automated WhatsApp renewal notice for an expiring document",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customerName": { "type": "string" },
                        "documentType": { "type": "string" },
                        "documentId": { "type": "string" }
                    },
                    "required": ["customerName", "documentType"]
                },
                "requires_confirmation": True
            },
            "get_job_status": {
                "description": "Check current 8-stage operational Kanban status of a job application",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "customerName": { "type": "string" },
                        "jobId": { "type": "string" }
                    },
                    "required": ["customerName"]
                },
                "requires_confirmation": False
            }
        }

    def generate_tool_calling_pairs(self) -> List[Dict[str, Any]]:
        """Synthesizes realistic multi-step tool calling training examples."""
        examples = [
            {
                "user_prompt": "Rahul ka invoice check karo aur agar payment overdue hai to reminder draft kar do.",
                "language": "Hinglish",
                "response": {
                    "intent": "OVERDUE_CUSTOMER_ANALYSIS",
                    "entities": { "customer_name": "Rahul" },
                    "plan_summary": "Look up customer Rahul, check for overdue invoices, and draft payment reminder if balance is past due.",
                    "tools": [
                        {
                            "name": "get_customer",
                            "arguments": { "customerName": "Rahul" },
                            "requires_confirmation": False
                        },
                        {
                            "name": "get_overdue_invoices",
                            "arguments": { "customerName": "Rahul" },
                            "requires_confirmation": False
                        },
                        {
                            "name": "draft_payment_reminder",
                            "arguments": { "customerName": "Rahul", "channel": "whatsapp" },
                            "requires_confirmation": True
                        }
                    ]
                }
            },
            {
                "user_prompt": "Ahmed ka passport kab expire ho raha hai check karo aur client ko renewal alert bhejo.",
                "language": "Hinglish",
                "response": {
                    "intent": "DOCUMENT_EXPIRATION",
                    "entities": { "customer_name": "Ahmed", "document_type": "passport" },
                    "plan_summary": "Query document vault for Ahmed's passport expiry and prepare renewal notice.",
                    "tools": [
                        {
                            "name": "get_expiring_documents",
                            "arguments": { "customerName": "Ahmed", "documentType": "passport", "daysThreshold": 30 },
                            "requires_confirmation": False
                        },
                        {
                            "name": "send_document_reminder",
                            "arguments": { "customerName": "Ahmed", "documentType": "passport" },
                            "requires_confirmation": True
                        }
                    ]
                }
            },
            {
                "user_prompt": "Faisal ke liye ₹25,000 ka naya corporate GST setup lead create karo.",
                "language": "Hinglish",
                "response": {
                    "intent": "CREATE_LEAD",
                    "entities": { "customer_name": "Faisal", "amount": 25000, "service": "GST setup" },
                    "plan_summary": "Register a new qualified corporate sales lead for Faisal with ₹25,000 estimated value.",
                    "tools": [
                        {
                            "name": "create_lead",
                            "arguments": {
                                "name": "Faisal",
                                "estimatedValue": 25000,
                                "service": "Corporate GST Setup",
                                "source": "AI Reasoning Command"
                            },
                            "requires_confirmation": True
                        }
                    ]
                }
            },
            {
                "user_prompt": "Iss month total net profit aur Kirkol counter sale kitna hua?",
                "language": "Hinglish",
                "response": {
                    "intent": "FINANCIAL_STATEMENT",
                    "entities": { "period": "this_month" },
                    "plan_summary": "Compute verified ledger net profit and counter POS receipts for current month.",
                    "tools": [
                        {
                            "name": "get_financial_statement",
                            "arguments": { "period": "this_month", "includeKirkol": True },
                            "requires_confirmation": False
                        }
                    ]
                }
            },
            {
                "user_prompt": "Check if Priya's visa application is still in Al Uzer stage or ready for delivery.",
                "language": "English",
                "response": {
                    "intent": "JOB_STATUS_INQUIRY",
                    "entities": { "customer_name": "Priya", "document_type": "visa" },
                    "plan_summary": "Query Kanban job status for Priya's visa application card.",
                    "tools": [
                        {
                            "name": "get_job_status",
                            "arguments": { "customerName": "Priya" },
                            "requires_confirmation": False
                        }
                    ]
                }
            }
        ]
        return examples

    def export_tool_dataset(self, output_dir: str = "vrys-ai/data"):
        os.makedirs(output_dir, exist_ok=True)
        pairs = self.generate_tool_calling_pairs()
        filepath = os.path.join(output_dir, "tool_calling_dataset.jsonl")
        
        with open(filepath, "w", encoding="utf-8") as f:
            for pair in pairs:
                f.write(json.dumps(pair, ensure_ascii=False) + "\n")

        with open(os.path.join(output_dir, "tool_schemas.json"), "w", encoding="utf-8") as f:
            json.dump(self.schemas, f, indent=2)

        return {
            "total_tool_pairs": len(pairs),
            "schemas_registered": list(self.schemas.keys()),
            "schema_file": os.path.join(output_dir, "tool_schemas.json"),
            "dataset_file": filepath
        }

tool_registry = ToolSchemaRegistry()

if __name__ == "__main__":
    summary = tool_registry.export_tool_dataset()
    print("[SUCCESS] VRYS Structured Tool Calling Dataset & Schema Registry Exported!")
    print(json.dumps(summary, indent=2))
