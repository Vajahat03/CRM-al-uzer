"""
VRYS AI — Meta Webhook Handler & Lead Ingestion Pipeline (Step 9)
Verifies HMAC SHA256 signatures, ingests Facebook/Instagram Lead Ad payloads,
prevents duplicates, and maps them to normalized CRM Leads.
"""
from typing import Dict, Any, Optional
import hmac
import hashlib
import uuid
import time
from app.schemas.marketing_schema import NormalizedLead, AdPlatform

class MetaWebhookHandler:
    def __init__(self):
        self._processed_lead_tokens: set = set()

    def verify_webhook_signature(self, payload_bytes: bytes, signature_header: str, app_secret: str) -> bool:
        """
        Validates SHA256 signature from Meta Graph API.
        """
        if not signature_header.startswith("sha256="):
            return False
        expected_sig = signature_header.split("sha256=")[-1]
        calculated_sig = hmac.new(app_secret.encode('utf-8'), payload_bytes, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected_sig, calculated_sig)

    def process_lead_ad_payload(self, payload: Dict[str, Any], org_id: str) -> Dict[str, Any]:
        """
        Normalizes raw Meta Lead Ad submission into VRYS NormalizedLead.
        """
        lead_id = payload.get("leadgen_id", f"meta_lead_{uuid.uuid4().hex[:8]}")
        idempotency_token = payload.get("idempotency_token", f"{org_id}:{lead_id}")

        # Duplicate detection check
        if idempotency_token in self._processed_lead_tokens:
            return {
                "status": "DUPLICATE_IGNORED",
                "lead_id": lead_id,
                "is_duplicate": True,
                "message": "Lead already ingested into CRM"
            }

        field_data = payload.get("field_data", {})
        cust_name = field_data.get("full_name") or payload.get("name", "Inbound Lead")
        phone = field_data.get("phone_number") or payload.get("phone", "+919820099999")
        email = field_data.get("email") or payload.get("email", "lead@example.com")

        normalized = NormalizedLead(
            lead_id=lead_id,
            organization_id=org_id,
            name=cust_name,
            phone=phone,
            email=email,
            source_platform=AdPlatform.META_ADS,
            campaign_id=payload.get("campaign_id", "meta_cmp_101"),
            ad_id=payload.get("ad_id", "meta_ad_55"),
            form_id=payload.get("form_id", "meta_form_free_quote"),
            lead_score=85,
            status="NEW",
            created_at=time.time(),
            idempotency_token=idempotency_token
        )

        self._processed_lead_tokens.add(idempotency_token)

        return {
            "status": "INGESTED",
            "is_duplicate": False,
            "normalized_lead": normalized.dict()
        }

meta_webhook_handler = MetaWebhookHandler()
