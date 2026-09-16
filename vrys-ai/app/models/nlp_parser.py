"""
VRYS AI — Multi-Task NLP Message & Entity Parser
Extracts customer commitments, amounts, dates, and sentiment from inbound WhatsApp / Email messages.
"""
from typing import Dict, Any
import re

class NLPMessageParser:
    def __init__(self):
        self.model_name = "vrys-nlp-entity-parser-v1"
        self.version = "1.1.0"

    def parse_message(self, message_text: str) -> Dict[str, Any]:
        text = message_text.strip()
        text_lower = text.lower()

        # 1. Intent Detection
        if any(w in text_lower for w in ["pay", "payment", "transfer", "gpay", "upi", "settle", "send money", "remit"]):
            intent = "PAYMENT_COMMITMENT"
        elif any(w in text_lower for w in ["reschedule", "postpone", "cancel", "delay", "next week"]):
            intent = "SCHEDULE_RESCHEDULE"
        elif any(w in text_lower for w in ["quote", "price", "how much", "cost", "estimate"]):
            intent = "PRICING_INQUIRY"
        elif any(w in text_lower for w in ["doc", "document", "passport", "aadhaar", "pan", "rc"]):
            intent = "DOCUMENT_SUBMISSION"
        else:
            intent = "GENERAL_INQUIRY"

        # 2. Extract Monetary Amounts
        amount = None
        amount_match = re.search(r"(?:₹|rs\.?|inr|amount\s*of)\s*([\d,]+)", text_lower)
        if not amount_match:
            amount_match = re.search(r"\b(\d{3,7})\b", text)
        if amount_match:
            try:
                amount = float(amount_match.group(1).replace(",", ""))
            except ValueError:
                pass

        # 3. Extract Time Reference
        date_ref = None
        if "tomorrow" in text_lower:
            date_ref = "Tomorrow"
        elif "today" in text_lower:
            date_ref = "Today"
        elif "monday" in text_lower:
            date_ref = "Upcoming Monday"
        elif "weekend" in text_lower:
            date_ref = "This Weekend"

        # 4. Sentiment Analysis
        if any(w in text_lower for w in ["thanks", "thank you", "great", "excellent", "awesome", "perfect", "good"]):
            sentiment = "Positive 😊"
        elif any(w in text_lower for w in ["delay", "waiting", "angry", "bad", "slow", "issue", "problem", "urgent"]):
            sentiment = "Frustrated / Urgent ⚠️"
        else:
            sentiment = "Neutral 💬"

        return {
            "intent": intent,
            "extracted_amount": amount,
            "extracted_date": date_ref,
            "sentiment": sentiment,
            "proposed_agent_action": (
                f"Record payment promise of ₹{amount:,.0f} for {date_ref or 'soon'}" if intent == "PAYMENT_COMMITMENT" and amount
                else f"Flag urgent reschedule request" if intent == "SCHEDULE_RESCHEDULE"
                else "Draft standard customer response"
            ),
            "model": self.model_name
        }

nlp_parser = NLPMessageParser()
