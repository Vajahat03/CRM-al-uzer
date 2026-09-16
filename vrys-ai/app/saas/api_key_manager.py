"""
VRYS AI — Tenant API Key Manager (Step 11)
Issues SHA256 hashed API keys with granular permission scopes and revocation tracking.
"""
from typing import Dict, Any, List, Optional
import hashlib
import secrets
import time
from app.schemas.saas_schema import ApiKeyRecord

class ApiKeyManager:
    def __init__(self):
        self._keys: Dict[str, ApiKeyRecord] = {}

    def generate_api_key(self, org_id: str, name: str, scopes: List[str]) -> Dict[str, Any]:
        """
        Creates a new tenant API key, returns plaintext token once, and stores SHA256 hash.
        """
        raw_token = f"vrys_live_{secrets.token_urlsafe(32)}"
        hashed = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

        key_record = ApiKeyRecord(
            organization_id=org_id,
            name=name,
            hashed_token=hashed,
            scopes=scopes,
            created_at=time.time()
        )
        self._keys[key_record.key_id] = key_record

        return {
            "key_id": key_record.key_id,
            "organization_id": org_id,
            "name": name,
            "plaintext_token": raw_token,
            "scopes": scopes,
            "created_at": key_record.created_at
        }

    def authenticate_api_key(self, raw_token: str, required_scope: Optional[str] = None) -> Optional[ApiKeyRecord]:
        """
        Validates token hash and required permission scope.
        """
        hashed = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()
        for record in self._keys.values():
            if record.hashed_token == hashed:
                if record.is_revoked:
                    return None
                if required_scope and required_scope not in record.scopes:
                    return None
                return record
        return None

    def revoke_api_key(self, key_id: str, org_id: str) -> bool:
        record = self._keys.get(key_id)
        if record and record.organization_id == org_id:
            record.is_revoked = True
            return True
        return False

api_key_manager = ApiKeyManager()
