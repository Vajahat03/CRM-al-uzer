"""
VRYS AI — Hybrid Entity Extraction & Hinglish Normalizer (Step 5 Hardening)
Performs robust slot extraction, entity normalization, currency/temporal parsing,
and Hinglish colloquialism normalization without requiring full model retraining.
"""
from typing import Dict, Any, Optional, List
import re

class EntityNormalizer:
    def __init__(self):
        # 1. Standard Document Classes
        self.doc_types = {
            "passport": "passport",
            "passports": "passport",
            "visa": "visa",
            "visas": "visa",
            "rc": "rc book",
            "rc book": "rc book",
            "driving license": "driving license",
            "license": "driving license",
            "aadhaar": "aadhaar",
            "aadhaar card": "aadhaar",
            "pan": "pan card",
            "pan card": "pan card",
            "gst": "gst certificate",
            "gst certificate": "gst certificate",
            "trade license": "trade license",
            "gumasta": "gumasta license"
        }

        # 2. Hindi / Hinglish Temporal Normalization Map
        self.temporal_map = {
            "aaj": "today",
            "today": "today",
            "kal": "tomorrow",
            "tomorrow": "tomorrow",
            "agle hafte": "next_week",
            "next week": "next_week",
            "somvaar": "monday",
            "monday": "monday",
            "this weekend": "this_weekend",
            "weekend": "this_weekend",
            "this month": "this_month",
            "iss month": "this_month",
            "iss hafte": "this_week",
            "this week": "this_week"
        }

    def extract_and_normalize(self, text: str, initial_entities: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Normalizes and completes entity dictionary from input text.
        """
        entities: Dict[str, Any] = dict(initial_entities or {})
        text_lower = text.lower().strip()

        # 1. Customer Name Extraction (English & Hinglish)
        if "customer_name" not in entities or not entities["customer_name"] or entities["customer_name"] in ["Customer", "Prospect", "Inbound Prospect"]:
            # Pattern 1: "Ahmed ka...", "Rahul ke...", "Priya ki..."
            name_pattern_1 = re.search(r"\b([A-Z][a-z]+)\s+(?:ka|ki|ke|ko|ne|se)\b", text)
            # Pattern 2: "for Ahmed", "for Rahul"
            name_pattern_2 = re.search(r"\b(?:for|lead for)\s+([A-Z][a-z]+)\b", text, re.IGNORECASE)
            # Pattern 3: "aa jayenge Amit ke"
            name_pattern_3 = re.search(r"\b([A-Z][a-z]+)\s+ke\b", text)

            if name_pattern_1:
                entities["customer_name"] = name_pattern_1.group(1).strip()
            elif name_pattern_2:
                entities["customer_name"] = name_pattern_2.group(1).strip()
            elif name_pattern_3:
                entities["customer_name"] = name_pattern_3.group(1).strip()
            else:
                # Standalone capitalized name
                words = [w for w in text.split() if w and w[0].isupper() and w.lower() not in ["bhai", "check", "create", "what", "how", "which", "show", "today", "kal", "mera", "kiska", "agar", "aaj"]]
                if words:
                    entities["customer_name"] = words[0].replace(",", "").replace(".", "").strip()

        # Also populate "name" key if customer_name exists
        if "customer_name" in entities:
            entities["name"] = entities["customer_name"]

        # 2. Document Type Extraction & Normalization
        if "document_type" not in entities or not entities["document_type"]:
            for raw_doc, canonical_doc in self.doc_types.items():
                if raw_doc in text_lower:
                    entities["document_type"] = canonical_doc
                    break

        # 3. Monetary Amount Extraction & Slang Parsing (e.g. "25k", "₹15,000", "20000")
        if "amount" not in entities or not entities["amount"]:
            # Check for '25k' slang
            k_match = re.search(r"\b(\d+)\s*k\b", text_lower)
            if k_match:
                entities["amount"] = int(k_match.group(1)) * 1000
            else:
                amt_match = re.search(r"(?:₹|rs\.?|inr|amount|value|budget|ka)?\s*([\d,]{4,7})", text_lower)
                if amt_match:
                    try:
                        entities["amount"] = int(amt_match.group(1).replace(",", ""))
                    except ValueError:
                        pass

        # 4. Temporal / Date Reference Normalization
        if "date" not in entities or not entities["date"]:
            for raw_time, canonical_time in self.temporal_map.items():
                if raw_time in text_lower:
                    entities["date"] = canonical_time
                    break

        # 5. Period Normalization (for financial queries)
        if any(w in text_lower for w in ["iss month", "this month", "month"]):
            entities["period"] = "this_month"
        elif any(w in text_lower for w in ["iss hafte", "this week", "week"]):
            entities["period"] = "this_week"
        elif any(w in text_lower for w in ["aaj", "today"]):
            entities["period"] = "today"

        # 6. Period Days Normalization (for overdue queries)
        days_match = re.search(r"(\d+)\s*(?:days?|din)", text_lower)
        if days_match:
            entities["period_days"] = int(days_match.group(1))
        elif "overdue" in text_lower or "baaki" in text_lower or "unpaid" in text_lower:
            entities["period_days"] = entities.get("period_days", 30)

        # 7. Channel Normalization
        if "counter" in text_lower or "kirkol" in text_lower:
            entities["channel"] = "kirkol_pos"

        return entities

entity_normalizer = EntityNormalizer()
