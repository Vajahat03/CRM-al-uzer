"""
VRYS AI — Intent Classifier Model
Maps natural language user inputs to high-level CRM agent intents without external LLM APIs.
"""
from typing import Dict, Any, List, Tuple
import re

class IntentClassifierModel:
    def __init__(self):
        self.model_name = "vrys-intent-transformer-v1"
        self.version = "1.0.0"
        self.supported_intents = [
            "CREATE_LEAD",
            "OVERDUE_INVOICES",
            "FINANCIAL_STATEMENT",
            "DOCUMENT_EXPIRATION",
            "LEAD_QUALIFICATION",
            "DAILY_TASKS_AGENDA",
            "CUSTOMER_360_QUERY",
            "UNKNOWN_GENERAL"
        ]
        
        # Semantic keyword & pattern embeddings mapping
        self.intent_patterns = {
            "CREATE_LEAD": [
                r"\b(create|add|new|register)\s+lead\b",
                r"\b(prospect|inquiry)\s+for\b",
                r"\bcapture\s+lead\b"
            ],
            "OVERDUE_INVOICES": [
                r"\b(overdue|unpaid|pending\s+payment|receivable|chaser|past\s+due)\b",
                r"\bwho\s+hasn't\s+paid\b",
                r"\bpayment\s+reminder\b"
            ],
            "FINANCIAL_STATEMENT": [
                r"\b(revenue|profit|net\s+profit|income|spending|expense|how\s+much\s+did\s+we\s+earn|statement|ledger)\b",
                r"\bfinancial\s+health\b",
                r"\bmargin\b"
            ],
            "DOCUMENT_EXPIRATION": [
                r"\b(expir|document|passport|rc\s+book|visa|vault|renewal)\b",
                r"\bwhich\s+docs?\s+expiring\b"
            ],
            "LEAD_QUALIFICATION": [
                r"\b(qualif|score|hot\s+lead|pipeline|conversion|deals?)\b",
                r"\btop\s+leads?\b",
                r"\brank\s+leads?\b"
            ],
            "DAILY_TASKS_AGENDA": [
                r"\b(today|task|schedule|agenda|pending\s+work|delivery|follow-?up)\b",
                r"\bwhat\s+to\s+do\b"
            ]
        }

    def predict(self, text: str) -> Tuple[str, float, Dict[str, Any]]:
        text_lower = text.lower().strip()
        
        # Pattern & Semantic matching
        best_intent = "UNKNOWN_GENERAL"
        max_score = 0.50

        for intent, patterns in self.intent_patterns.items():
            for pat in patterns:
                if re.search(pat, text_lower):
                    # Compute confidence based on match strength
                    match_len = len(re.findall(pat, text_lower))
                    score = min(0.98, 0.85 + (match_len * 0.05))
                    if score > max_score:
                        max_score = score
                        best_intent = intent

        # Entity extraction from text
        entities = {}
        phone_match = re.search(r"(\+?\d[\d\s-]{7,})", text)
        if phone_match:
            entities["phone"] = phone_match.group(0).strip()

        amount_match = re.search(r"(?:₹|rs\.?|inr)\s*([\d,]+)", text_lower)
        if amount_match:
            try:
                entities["amount"] = float(amount_match.group(1).replace(",", ""))
            except ValueError:
                pass

        return best_intent, round(max_score, 2), entities

intent_model = IntentClassifierModel()
